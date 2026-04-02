import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
    // Find Siraj Munir
    const sirajMunir = await prisma.user.findFirst({
        where: {
            name: {
                contains: "Siraj"
            }
        }
    });

    if (!sirajMunir) {
        console.log("Siraj Munir not found in database");
        console.log("Available users:");
        const allUsers = await prisma.user.findMany();
        allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));
        return;
    }

    console.log("Found Siraj Munir:", sirajMunir.name, sirajMunir.email);

    // Find Gamma Project
    const gammaProject = await prisma.project.findFirst({
        where: {
            name: {
                contains: "Gamma"
            }
        }
    });

    if (!gammaProject) {
        console.log("Gamma Project not found");
        console.log("Available projects:");
        const allProjects = await prisma.project.findMany();
        allProjects.forEach(p => console.log(`- ${p.name}`));
        return;
    }

    console.log("Found Gamma Project:", gammaProject.name);

    // Update all reviews for Gamma Project to be assigned to Siraj Munir
    const updateResult = await prisma.review.updateMany({
        where: {
            projectId: gammaProject.id
        },
        data: {
            reviewerId: sirajMunir.id
        }
    });

    console.log(`✅ Updated ${updateResult.count} review(s) for Gamma Project to be assigned to Siraj Munir`);

    // Show the updated reviews
    const updatedReviews = await prisma.review.findMany({
        where: {
            projectId: gammaProject.id
        },
        include: {
            reviewer: true,
            form: true
        }
    });

    console.log("\nUpdated reviews:");
    updatedReviews.forEach(review => {
        console.log(`- ${review.form.title}: ${review.reviewer.name} (${review.status})`);
    });
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log("\n✅ Done! Please refresh the Reports page to see the changes.");
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
