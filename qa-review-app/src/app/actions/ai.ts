"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/withAuth";
import OpenAI from "openai";

export async function generateAIAnalysis(reviewId: string) {
    await requireAuth();

    // 1. Get the API Key
    const setting = await prisma.systemSettings.findUnique({
        where: { key: "OPENAI_API_KEY" }
    });

    if (!setting || !setting.value) {
        throw new Error("OpenAI API Key not configured. Please contact an administrator.");
    }

    const openai = new OpenAI({
        apiKey: setting.value,
    });

    // 2. Get review data for context
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            project: true,
            form: true
        }
    });

    if (!review) throw new Error("Review not found");

    const answers = typeof review.answers === 'string' ? JSON.parse(review.answers || "{}") : (review.answers || {});
    const questions = typeof review.form.questions === 'string' ? JSON.parse(review.form.questions || "[]") : (review.form.questions || []);

    // Flatten questions if needed
    const allQuestions = questions.flatMap((section: any) => section.questions || [section]);

    // 3. Construct the prompt
    let prompt = `You are a QA Architect analyzing a project review for a ${review.project.type} project named "${review.project.name}".\n\n`;
    prompt += `Health Status: ${review.healthStatus}\n`;
    prompt += `Reviewer Observations: ${review.observations || "None"}\n\n`;
    prompt += `Q&A Data:\n`;

    allQuestions.forEach((q: any) => {
        const answer = answers[q.id];
        if (answer !== undefined) {
            prompt += `Q: ${q.label || q.text}\nA: ${Array.isArray(answer) ? answer.join(", ") : answer}\n\n`;
        }
    });

    prompt += `\nBased on the above data, provide a professional AI analysis of the project's risks and suggested improvements. Keep it concise and objective. Focus on why the project might be "Challenged" if applicable.`;

    // 4. Call OpenAI
    const response = await openai.chat.completions.create({
        model: "gpt-4o", // or gpt-3.5-turbo
        messages: [
            { role: "system", content: "You are a professional QA auditor." },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
    });

    const analysis = response.choices[0].message.content;

    return { analysis };
}
