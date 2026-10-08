import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface DetailedReviewData {
    id: string;
    status: string;
    healthStatus: string;
    observations: string | null;
    recommendedActions: string | null;
    followUpComment: string | null;
    aiAnalysis: string | null;
    submittedDate: string;
    createdAt: string;
    answers: any;
    project: {
        id: string;
        name: string;
        type: string;
        lead?: { name: string; email?: string } | null;
        contactPerson?: { name: string; email?: string } | null;
        reviewer?: { name: string; email?: string } | null;
        secondaryReviewer?: { name: string; email?: string } | null;
    };
    reviewer?: { name: string; email?: string } | null;
    secondaryReviewer?: { name: string; email?: string } | null;
    form: {
        id: string;
        title: string;
        questions: any;
        projectType?: string | null;
    };
}

const HEALTH_COLORS: Record<string, [number, number, number]> = {
    "On Track": [5, 150, 105], // Green #059669
    "Slightly Challenged": [217, 119, 6], // Amber #D97706
    "Extremely Challenged": [220, 38, 38], // Red #DC2626
    "Critical": [220, 38, 38], // Red #DC2626
    "Deferred": [59, 130, 246], // Blue #3B82F6
    "On Hold": [147, 51, 234], // Purple #9333EA
};

export function generateDetailedReviewsPDF(
    reviews: DetailedReviewData[],
    category: "MANUAL" | "AUTOMATION"
): void {
    if (!reviews || reviews.length === 0) {
        throw new Error("No review data available to generate report.");
    }

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    reviews.forEach((review, index) => {
        if (index > 0) {
            doc.addPage();
        }

        let currentY = 16;

        // ── 1. Header Banner ─────────────────────────────────────────────
        doc.setFillColor(49, 46, 129); // Dark Indigo #312E81
        doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(review.project.name, margin + 5, currentY + 9);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const typeLabel = review.project.type?.replace("_", " ") || category;
        const submittedFormatted = review.submittedDate
            ? format(new Date(review.submittedDate), "MMMM d, yyyy")
            : "N/A";
        doc.text(
            `${category} QA REVIEW | Form: ${review.form.title} | Type: ${typeLabel}`,
            margin + 5,
            currentY + 16
        );

        // Submitted Date tag (top right of banner)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(
            `Submitted: ${submittedFormatted}`,
            pageWidth - margin - 5,
            currentY + 9,
            { align: "right" }
        );

        currentY += 27;

        // ── 2. Meta Info Grid ───────────────────────────────────────────
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.roundedRect(margin, currentY, contentWidth, 20, 1.5, 1.5, "FD");

        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text("PRIMARY REVIEWER", margin + 5, currentY + 6);
        doc.text("SECONDARY REVIEWER", margin + 52, currentY + 6);
        doc.text("PROJECT LEAD", margin + 100, currentY + 6);
        doc.text("QA CONTACT", margin + 142, currentY + 6);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.text(
            review.reviewer?.name || review.project.reviewer?.name || "Unassigned",
            margin + 5,
            currentY + 13
        );
        doc.text(
            review.secondaryReviewer?.name || review.project.secondaryReviewer?.name || "N/A",
            margin + 52,
            currentY + 13
        );
        doc.text(
            review.project.lead?.name || "Not assigned",
            margin + 100,
            currentY + 13
        );
        doc.text(
            review.project.contactPerson?.name || "N/A",
            margin + 142,
            currentY + 13
        );

        currentY += 25;

        // ── 3. Health & Executive Summary ──────────────────────────────
        const healthStatus = review.healthStatus || "On Track";
        const healthRGB = HEALTH_COLORS[healthStatus] || [75, 85, 99];

        // Overall Health Bar
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.setDrawColor(203, 213, 225); // Slate-300
        doc.roundedRect(margin, currentY, contentWidth, 11, 1.5, 1.5, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        doc.text("Overall Project Health Status:", margin + 5, currentY + 7.5);

        // Badge pill
        doc.setFillColor(healthRGB[0], healthRGB[1], healthRGB[2]);
        doc.roundedRect(margin + 60, currentY + 2, 45, 7, 1.5, 1.5, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5);
        doc.text(healthStatus, margin + 82.5, currentY + 6.8, { align: "center" });

        currentY += 15;

        // Key Observations (ALWAYS SHOWN, even if On Track)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("Key Observations:", margin, currentY);
        currentY += 4;

        const observationsText = review.observations?.trim() || "No observations provided.";
        const obsLines = doc.splitTextToSize(observationsText, contentWidth - 8);
        const obsBoxHeight = Math.max(obsLines.length * 4.5 + 6, 12);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(199, 210, 254); // Indigo-200 border
        doc.roundedRect(margin, currentY, contentWidth, obsBoxHeight, 1.5, 1.5, "FD");
        // Accent bar on left
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, currentY, 2.5, obsBoxHeight, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(obsLines, margin + 6, currentY + 5.5);

        currentY += obsBoxHeight + 5;

        // Recommended Actions / Action Items (ALWAYS SHOWN)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text("Recommended Actions / Action Items:", margin, currentY);
        currentY += 4;

        const actionsText = review.recommendedActions?.trim() || "No recommended actions specified.";
        const actionLines = doc.splitTextToSize(actionsText, contentWidth - 8);
        const actionBoxHeight = Math.max(actionLines.length * 4.5 + 6, 12);

        doc.setFillColor(254, 243, 199); // Amber-50
        doc.setDrawColor(251, 191, 36); // Amber-300 border
        doc.roundedRect(margin, currentY, contentWidth, actionBoxHeight, 1.5, 1.5, "FD");
        // Accent bar on left
        doc.setFillColor(217, 119, 6); // Amber-600
        doc.rect(margin, currentY, 2.5, actionBoxHeight, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(120, 53, 15); // Amber-900
        doc.text(actionLines, margin + 6, currentY + 5.5);

        currentY += actionBoxHeight + 7;

        // Follow-up Comments / AI Analysis (Optional, if exists)
        if (review.followUpComment?.trim()) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59);
            doc.text("Admin Follow-up Comment:", margin, currentY);
            currentY += 3.5;

            const followLines = doc.splitTextToSize(review.followUpComment.trim(), contentWidth - 8);
            const followHeight = followLines.length * 4 + 4;
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(margin, currentY, contentWidth, followHeight, 1, 1, "F");
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(followLines, margin + 4, currentY + 3.5);
            currentY += followHeight + 5;
        }

        // ── 4. Full Questionnaire Table ─────────────────────────────────
        // Parse Form Questions
        let rawQuestions: any[] = [];
        try {
            rawQuestions = typeof review.form.questions === "string"
                ? JSON.parse(review.form.questions || "[]")
                : (review.form.questions || []);
        } catch {
            rawQuestions = [];
        }

        let sections: Array<{ id: string; title: string; questions: any[] }> = [];
        if (rawQuestions.length > 0) {
            if (rawQuestions[0].questions || rawQuestions[0].items) {
                sections = rawQuestions.map((s: any) => ({
                    id: s.id || s.title,
                    title: s.title || s.name || "General",
                    questions: s.questions || s.items || []
                }));
            } else {
                sections = [{ id: "general", title: "General Questionnaire", questions: rawQuestions }];
            }
        }

        // Parse answers
        let answersObj: Record<string, any> = {};
        try {
            answersObj = typeof review.answers === "string"
                ? JSON.parse(review.answers || "{}")
                : (review.answers || {});
        } catch {
            answersObj = {};
        }

        // Build table rows per section
        sections.forEach((section) => {
            const sectionQuestions = section.questions || [];
            if (sectionQuestions.length === 0) return;

            const tableRows: Array<[string, string, string, string]> = sectionQuestions.map((q: any, qIdx: number) => {
                const qNum = `${qIdx + 1}`;
                const qLabel = q.label || q.text || "Untitled Question";
                const ansValue = answersObj[q.id];

                let ansFormatted = "—";
                if (ansValue !== undefined && ansValue !== null) {
                    if (Array.isArray(ansValue)) {
                        ansFormatted = ansValue.join(", ");
                    } else if (typeof ansValue === "boolean") {
                        ansFormatted = ansValue ? "Yes" : "No";
                    } else {
                        ansFormatted = String(ansValue).trim() || "—";
                    }
                }

                const reasonValue = answersObj[`${q.id}_reason`];
                const reasonFormatted = reasonValue ? String(reasonValue).trim() : "—";

                return [qNum, qLabel, ansFormatted, reasonFormatted];
            });

            // Section heading above the table
            autoTable(doc, {
                startY: currentY,
                margin: { left: margin, right: margin },
                head: [
                    [
                        {
                            content: `Section: ${section.title}`,
                            colSpan: 4,
                            styles: {
                                fillColor: [67, 56, 202], // Indigo-700 #4338CA
                                textColor: [255, 255, 255],
                                fontStyle: "bold",
                                fontSize: 9.5,
                                halign: "left",
                                cellPadding: 3,
                            }
                        }
                    ],
                    ["#", "Question", "Selected Answer", "Reason / Explanation"]
                ],
                body: tableRows,
                theme: "striped",
                headStyles: {
                    fillColor: [79, 70, 229], // Indigo-600
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2.5,
                    overflow: "linebreak",
                    valign: "top",
                },
                columnStyles: {
                    0: { cellWidth: 8, halign: "center", fontStyle: "bold" },
                    1: { cellWidth: 90 },
                    2: { cellWidth: 38, fontStyle: "bold", textColor: [30, 41, 59] },
                    3: { cellWidth: 46, textColor: [71, 85, 105], fontStyle: "italic" },
                },
                didDrawPage: (data) => {
                    // Update currentY for next section
                    currentY = data.cursor?.y ? data.cursor.y + 7 : margin;
                }
            });

            // Update currentY after table finishes
            const lastAutoTable = (doc as any).lastAutoTable;
            if (lastAutoTable && lastAutoTable.finalY) {
                currentY = lastAutoTable.finalY + 7;
            }
        });
    });

    // ── 5. Add Running Footers to All Pages ─────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(
            `QA Review Portal • 10Pearls • Generated on ${format(new Date(), "MMM d, yyyy, h:mm a")}`,
            margin,
            pageHeight - 5
        );
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 5,
            { align: "right" }
        );
    }

    const exportFileName = `${category}_QA_Reviews_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(exportFileName);
}
