"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/withAuth";
import { getAIClient } from "@/lib/ai";
import { NotificationService } from "@/services/notificationService";
import { sendEmail, emailTemplates } from "@/lib/email";


export async function generateAIAnalysis(reviewId: string) {
    try {
        await requireRole("ADMIN", "QA_HEAD");

        // 1. Get the AI Client
        const { client: openai, model } = await getAIClient();

        // 2. Get review data for context (include lead + reviewer for alert recipients)
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                project: {
                    include: {
                        lead: true,
                        reviewer: true,
                    }
                },
                form: true
            }
        });

        if (!review) throw new Error("Review not found");

        console.log(`Generating AI Analysis for review ${reviewId} (Project: ${review.project.name})`);

        // Robust parsing of answers and questions
        let answers: any = {};
        try {
            answers = typeof review.answers === 'string' ? JSON.parse(review.answers || "{}") : (review.answers || {});
        } catch (e) {
            console.error("Failed to parse review answers:", e);
        }

        let questions: any[] = [];
        try {
            questions = typeof review.form.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form.questions || []);
        } catch (e) {
            console.error("Failed to parse form questions:", e);
        }

        // Flatten questions if they are nested in sections
        const allQuestions: any[] = [];
        if (Array.isArray(questions)) {
            questions.forEach((item: any) => {
                if (item && item.questions && Array.isArray(item.questions)) {
                    allQuestions.push(...item.questions);
                } else if (item && item.items && Array.isArray(item.items)) {
                    allQuestions.push(...item.items);
                } else if (item) {
                    allQuestions.push(item);
                }
            });
        }

        // 3. Construct the prompt
        let prompt = `You are a QA Architect analyzing a project review for a ${review.project.type} project named "${review.project.name}".\n\n`;
        prompt += `Current Status: ${review.status}\n`;
        prompt += `Health Status: ${review.healthStatus}\n`;
        prompt += `Reviewer Observations: ${review.observations || "None provided"}\n`;
        prompt += `Recommended Actions: ${review.recommendedActions || "None provided"}\n\n`;
        prompt += `DETAILED Q&A DATA:\n`;

        let qaCount = 0;
        allQuestions.forEach((q: any) => {
            if (!q || !q.id) return;
            const answer = answers[q.id];
            if (answer !== undefined && answer !== null && answer !== "") {
                const label = q.label || q.text || "Question";
                const formattedAnswer = Array.isArray(answer) ? answer.join(", ") : answer;
                const reason = answers[`${q.id}_reason`];
                prompt += `Q: ${label}\nA: ${formattedAnswer}${reason ? ` (Reason/Explanation: ${reason})` : ''}\n\n`;
                qaCount++;
            }
        });

        if (qaCount === 0) {
            prompt += "(No detailed Q&A data available for this review)\n";
        }

        prompt += `\nANALYSIS TASK:\n`;
        prompt += `Based on the data above, provide a professional, critical, and objective assessment of this project's quality health and risks. \n`;
        prompt += `- If the status is "Challenged" or "Critical", focus on identifying root causes and specific risks.\n`;
        prompt += `- Provide actionable suggestions for the QA team or Project Lead.\n`;
        prompt += `- Keep the tone professional and the length concise.\n\n`;
        prompt += `OUTPUT FORMAT (JSON ONLY):\n`;
        prompt += `- riskScore: 0 to 10 (10 being highest risk)\n`;
        prompt += `- riskLevel: "LOW", "MEDIUM", "HIGH", or "CRITICAL"\n`;
        prompt += `- summary: A 2-3 sentence overview\n`;
        prompt += `- observations: Array of key risks/findings\n`;
        prompt += `- actionItems: Array of recommended steps\n`;

        // 4. Call AI Provider
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { 
                    role: "system", 
                    content: "You are a professional QA Project Auditor and Architect. Output valid JSON only, with no markdown code blocks, no thinking tags, and no conversational preamble." 
                },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 2000,
        });

        const rawContent = response.choices[0].message.content || "{}";

        // 5. Robust cleaning: strip <think>...</think> tags and markdown fences
        let cleaned = rawContent.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        let jsonString = (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace)
            ? cleaned.substring(firstBrace, lastBrace + 1)
            : cleaned;

        let finalAnalysis: any;
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed && typeof parsed === "object") {
                const riskLevel = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(parsed.riskLevel).toUpperCase())
                    ? String(parsed.riskLevel).toUpperCase()
                    : "MEDIUM";
                const riskScore = typeof parsed.riskScore === "number" ? Math.min(10, Math.max(0, parsed.riskScore)) : 5;
                
                let summaryText = typeof parsed.summary === "string" ? parsed.summary : JSON.stringify(parsed.summary || "");
                summaryText = summaryText.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();

                const observations = Array.isArray(parsed.observations)
                    ? parsed.observations.map((o: any) => typeof o === "string" ? o : JSON.stringify(o)).filter(Boolean)
                    : [];

                const actionItems = Array.isArray(parsed.actionItems)
                    ? parsed.actionItems.map((a: any) => typeof a === "string" ? a : JSON.stringify(a)).filter(Boolean)
                    : [];

                finalAnalysis = {
                    riskScore,
                    riskLevel,
                    summary: summaryText || "Project review quality assessment complete.",
                    observations,
                    actionItems
                };
            }
        } catch (e) {
            console.warn("generateAIAnalysis JSON parse failed, falling back to minimal object:", e);
            const cleanFallback = cleaned
                .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
                .replace(/^#+\s+/gm, "")
                .trim();

            finalAnalysis = {
                riskScore: 5,
                riskLevel: "MEDIUM",
                summary: cleanFallback.substring(0, 300) || "Analysis complete.",
                observations: [],
                actionItems: []
            };
        }

        const analysisText = JSON.stringify(finalAnalysis);

        console.log(`AI Analysis generated successfully for review ${reviewId}`);

        // Persist the analysis to DB immediately
        await prisma.review.update({
            where: { id: reviewId },
            data: { aiAnalysis: analysisText }
        });

        // Fire alerts for HIGH / CRITICAL risk (mirrors AIAnalysisService behaviour)
        try {
            const parsed = JSON.parse(analysisText);
            if (parsed.riskLevel === "HIGH" || parsed.riskLevel === "CRITICAL") {
                const recipients = [
                    review.project.lead,
                    review.project.reviewer,
                ].filter(Boolean);

                for (const user of recipients) {
                    await NotificationService.create(
                        user!.id,
                        "AI_ALERT",
                        `AI Alert: ${review.project.name} flagged as ${parsed.riskLevel} risk (Score: ${parsed.riskScore}/10)`,
                        `/reviews/${reviewId}`
                    );

                    // Best-effort email — failure must not block the response
                    sendEmail(
                        user!.email,
                        emailTemplates.aiAlert(
                            user!.name,
                            review.project.name,
                            parsed.riskLevel,
                            parsed.riskScore,
                            parsed.actionItems ?? [],
                            reviewId
                        )
                    ).catch(e => console.error("AI alert email failed:", e));
                }
            }
        } catch (alertErr) {
            // Non-fatal — log and continue
            console.error("Failed to fire AI alert notifications:", alertErr);
        }

        // Return the analysis string so the UI can display it without a page reload
        return { analysis: analysisText };
    } catch (error: any) {
        console.error("generateAIAnalysis server action failed:", error);
        // Return error object instead of throwing — avoids Next.js stripping the message
        // in production and showing the generic "Server Components render" error boundary.
        return { 
            analysis: "",
            error: error.message || "An unexpected error occurred during AI analysis generation."
        };
    }
}
