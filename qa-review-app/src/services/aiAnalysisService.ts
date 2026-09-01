import { getAIClient } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "./notificationService";
import { sendEmail, emailTemplates } from "@/lib/email";

export interface AIAnalysisResult {
    riskScore: number; // 0-10
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    observations: string[];
    actionItems: string[];
    summary: string;
}

export class AIAnalysisService {
    /**
     * Perform AI analysis on a project review
     */
    static async analyzeReview(reviewId: string) {
        try {
            const review = await prisma.review.findUnique({
                where: { id: reviewId },
                include: {
                    project: {
                        include: {
                            lead: true,
                            reviewer: true,
                        }
                    },
                    form: true,
                    comments: true,
                }
            });

            if (!review) return null;

            // Robust parsing of answers and questions
            let answers: any = {};
            try {
                answers = typeof review.answers === 'string' ? JSON.parse(review.answers || "{}") : (review.answers || {});
            } catch (e) {
                console.error("Failed to parse review answers:", e);
            }

            let questions: any[] = [];
            try {
                questions = typeof review.form?.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form?.questions || []);
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

            const commentsText = review.comments.map(c => c.content).join("\n");

            let prompt = `Analyze the following QA Review data for project "${review.project.name}" (${review.project.type || 'Software'}) and provide a comprehensive risk evaluation.\n\n`;
            prompt += `PROJECT CONTEXT:\n`;
            prompt += `- Project: ${review.project.name}\n`;
            prompt += `- Review Status: ${review.status}\n`;
            prompt += `- Health Status: ${review.healthStatus}\n`;
            prompt += `- Reviewer Observations: ${review.observations || "None provided"}\n`;
            prompt += `- Recommended Actions: ${review.recommendedActions || "None provided"}\n\n`;

            prompt += `DETAILED Q&A ASSESSMENT DATA:\n`;
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
                prompt += "(No detailed Q&A data available)\n\n";
            }

            if (commentsText) {
                prompt += `DISCUSSION & FOLLOW-UP LOGS:\n${commentsText}\n\n`;
            }

            prompt += `Provide a structured risk assessment focusing on identifying root causes, risks, and actionable recommendations.`;

            const { client: openai, model } = await getAIClient();

            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: `You are an expert QA Project Auditor. 
                        Evaluate project risk based on review observations, questions, answers, and comments.
                        
                        CRITERIA:
                        - "LOW": Minor issues, on track.
                        - "MEDIUM": Some challenges, needs attention.
                        - "HIGH": Significant risks, potential delay or quality failure.
                        - "CRITICAL": Major blockers, immediate intervention required.
                        
                        OUTPUT REQUIREMENTS:
                        - Output valid JSON only, no markdown code fences, no thinking tags, no preamble.
                        - riskScore: 0 to 10 (10 being highest risk).
                        - riskLevel: "LOW", "MEDIUM", "HIGH", or "CRITICAL".
                        - observations: Array of key risks identified.
                        - actionItems: Array of recommended immediate steps.
                        - summary: A 2-3 sentence overview.
                        
                        PRIVACY:
                        - Strip all PII (names, emails, phones) from the output.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 2000,
            });

            const rawContent = response.choices[0].message.content || "{}";

            // Robust cleaning: strip <think>...</think> tags and markdown fences
            let cleaned = rawContent.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "").trim();
            cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            let jsonString = (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace)
                ? cleaned.substring(firstBrace, lastBrace + 1)
                : cleaned;

            let analysis: AIAnalysisResult;
            try {
                const parsed = JSON.parse(jsonString);
                const riskLevel = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(String(parsed.riskLevel).toUpperCase())
                    ? String(parsed.riskLevel).toUpperCase() as any
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

                analysis = {
                    riskScore,
                    riskLevel,
                    summary: summaryText || "Project quality assessment complete.",
                    observations,
                    actionItems
                };
            } catch {
                console.warn("[AIAnalysisService] JSON parse failed, falling back to minimal object");
                const cleanFallback = cleaned
                    .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
                    .replace(/^#+\s+/gm, "")
                    .trim();

                analysis = {
                    riskScore: 5,
                    riskLevel: "MEDIUM",
                    summary: cleanFallback.substring(0, 300) || "Analysis complete.",
                    observations: [],
                    actionItems: []
                };
            }

            // Persist the analysis
            await prisma.review.update({
                where: { id: reviewId },
                data: {
                    aiAnalysis: JSON.stringify(analysis)
                }
            });

            // Trigger alerts if risk is HIGH or CRITICAL
            if (analysis.riskLevel === "HIGH" || analysis.riskLevel === "CRITICAL") {
                await this.triggerAlerts(review, analysis);
            }

            return analysis;
        } catch (error) {
            console.error("AI Analysis failed:", error);
            return null;
        }
    }

    private static async triggerAlerts(review: any, analysis: AIAnalysisResult) {
        const recipients = [
            review.project.lead,
            review.project.reviewer
        ].filter(u => u !== null);

        for (const user of recipients) {
            // Create in-app notification
            await NotificationService.create(
                user.id,
                "AI_ALERT",
                `AI Alert: ${review.project.name} flagged as ${analysis.riskLevel} risk (Score: ${analysis.riskScore}/10)`,
                `/reviews/${review.id}`
            );

            // Send email
            await sendEmail(
                user.email,
                emailTemplates.aiAlert(
                    user.name,
                    review.project.name,
                    analysis.riskLevel,
                    analysis.riskScore,
                    analysis.actionItems,
                    review.id
                )
            );
        }
    }
}
