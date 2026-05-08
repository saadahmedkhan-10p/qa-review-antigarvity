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
                    comments: true,
                }
            });

            if (!review) return null;

            // Strip PII (Simple regex for email/name patterns, but LLM system prompt is better)
            const commentsText = review.comments.map(c => c.content).join("\n");
            
            const prompt = `
                Analyze the following QA Review data and provide a risk evaluation.
                
                PROJECT CONTEXT:
                Name: ${review.project.name}
                Current Health Status: ${review.healthStatus}
                Reviewer Observations: ${review.observations || "None provided"}
                Recommended Actions: ${review.recommendedActions || "None provided"}
                
                DISCUSSION LOGS:
                ${commentsText || "No discussion logs available."}
                
                Provide a structured risk assessment.
            `;

            const { client: openai, model } = await getAIClient();

            // Note: response_format is NOT used because some providers (e.g. Grok/xAI)
            // do not support it. JSON is extracted from the response text instead.
            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: `You are an expert QA Project Auditor. 
                        Your task is to evaluate project risk based on review observations and comments.
                        
                        CRITERIA:
                        - "LOW": Minor issues, on track.
                        - "MEDIUM": Some challenges, needs attention.
                        - "HIGH": Significant risks, potential delay or quality failure.
                        - "CRITICAL": Major blockers, immediate intervention required.
                        
                        OUTPUT REQUIREMENTS:
                        - Return JSON ONLY, no markdown, no code fences.
                        - riskScore: 0 to 10 (10 being highest risk).
                        - riskLevel: "LOW", "MEDIUM", "HIGH", or "CRITICAL".
                        - observations: Array of key risks identified.
                        - actionItems: Array of recommended immediate steps.
                        - summary: A 2-3 sentence overview.
                        
                        PRIVACY:
                        - Strip all PII (names, emails, phones) from the output.
                        `
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
            });

            const rawContent = response.choices[0].message.content || "{}";

            // Robustly extract JSON from the response (handles markdown code fences)
            let jsonString = rawContent;
            const jsonMatch = rawContent.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                jsonString = jsonMatch[1];
            }

            let analysis: AIAnalysisResult;
            try {
                analysis = JSON.parse(jsonString) as AIAnalysisResult;
            } catch {
                // Fallback: wrap plain text in a minimal valid structure
                analysis = {
                    riskScore: 5,
                    riskLevel: "MEDIUM",
                    summary: rawContent,
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
