import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log("Fixing all reviewer assignment mismatches...\n");

    // Get all projects with their reviews
    const projects = await prisma.project.findMany({
        include: {
            reviewer: true,
            reviews: {
                include: {
                    reviewer: true,
                    form: true
                }
            }
        }
    });

    let totalFixed = 0;

    for (const project of projects) {
        const mismatches = project.reviews.filter(r => r.reviewerId !== project.reviewerId);

        if (mismatches.length > 0) {
            console.log(`\n📁 ${project.name}:`);
            console.log(`   Fixing ${mismatches.length} review(s) to be assigned to ${project.reviewer.name}...`);

            for (const review of mismatches) {
                await prisma.review.update({
                    where: { id: review.id },
                    data: { reviewerId: project.reviewerId }
                });

                console.log(`   ✓ ${review.form.title}: ${review.reviewer.name} → ${project.reviewer.name}`);
                totalFixed++;
            }
        }
    }

    if (totalFixed === 0) {
        console.log("✅ No mismatches found! All reviews are correctly assigned.");
    } else {
        console.log(`\n\n✅ Fixed ${totalFixed} review assignment(s)!`);
        console.log("\nFinal status:");

        // Show final status
        const updatedProjects = await prisma.project.findMany({
            include: {
                reviewer: true,
                reviews: {
                    include: {
                        reviewer: true,
                        form: true
                    }
                }
            }
        });

        updatedProjects.forEach(project => {
            console.log(`\n📁 ${project.name} (Reviewer: ${project.reviewer.name})`);
            project.reviews.forEach(review => {
                console.log(`   ✓ ${review.form.title}: ${review.reviewer.name} (${review.status})`);
            });
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("\n✅ Done! Please refresh the Reports page to see all changes.");
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
