import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    console.log("Checking all projects and their reviews...\n");

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

    projects.forEach(project => {
        console.log(`\n📁 Project: ${project.name}`);
        console.log(`   Default Reviewer: ${project.reviewer.name}`);
        console.log(`   Reviews:`);

        project.reviews.forEach(review => {
            const mismatch = review.reviewerId !== project.reviewerId ? " ⚠️ MISMATCH" : " ✓";
            console.log(`   - ${review.form.title}: ${review.reviewer.name} (${review.status})${mismatch}`);
        });
    });

    // Find all mismatched reviews
    const allReviews = await prisma.review.findMany({
        include: {
            project: {
                include: {
                    reviewer: true
                }
            },
            reviewer: true,
            form: true
        }
    });

    const mismatches = allReviews.filter(r => r.reviewerId !== r.project.reviewerId);

    if (mismatches.length > 0) {
        console.log(`\n\n⚠️  Found ${mismatches.length} review(s) with mismatched reviewers:`);
        mismatches.forEach(review => {
            console.log(`   - ${review.project.name} / ${review.form.title}:`);
            console.log(`     Currently: ${review.reviewer.name}`);
            console.log(`     Should be: ${review.project.reviewer.name}`);
        });

        console.log("\n\nWould you like to fix these mismatches? (This will update all reviews to match their project's default reviewer)");
    } else {
        console.log("\n\n✅ All reviews are correctly assigned to their project's default reviewer!");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
