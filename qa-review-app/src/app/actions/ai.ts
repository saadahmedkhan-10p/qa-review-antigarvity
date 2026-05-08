"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/withAuth";
import { getAIClient } from "@/lib/ai";
import { NotificationService } from "@/services/notificationService";
import { sendEmail, emailTemplates } from "@/lib/email";


export async function generateAIAnalysis(reviewId: string) {
    try {
        await requireAuth();

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
                prompt += `Q: ${label}\nA: ${formattedAnswer}\n\n`;
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
        // Note: response_format is NOT used here because some providers (e.g. Grok/xAI)
        // do not support it. JSON is extracted from the response text instead.
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { 
                    role: "system", 
                    content: "You are a professional QA Project Auditor and Architect. Respond ONLY with a valid JSON object, no markdown, no code fences." 
                },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const rawContent = response.choices[0].message.content || "{}";

        // Robustly extract JSON from the response (handles markdown code fences)
        let analysisText = rawContent;
        const jsonMatch = rawContent.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
            analysisText = jsonMatch[1];
        }

        // Validate it's parseable JSON before returning
        try {
            JSON.parse(analysisText);
        } catch {
            // Wrap plain text in a minimal valid JSON structure
            analysisText = JSON.stringify({
                riskScore: 5,
                riskLevel: "MEDIUM",
                summary: rawContent,
                observations: [],
                actionItems: []
            });
        }

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
