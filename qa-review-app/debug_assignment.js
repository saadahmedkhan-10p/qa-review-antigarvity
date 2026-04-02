const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Debugging Project Assignment...");

    // 1. Find User
    const users = await prisma.user.findMany({
        where: { name: "Saad Ahmed Khan" }
    });
    console.log(`Found ${users.length} user(s) named "Saad Ahmed Khan":`);
    users.forEach(u => console.log(` - ID: ${u.id}, Email: ${u.email}, Roles: ${u.roles}`));

    if (users.length === 0) {
        console.log("User not found!");
        return;
    }

    // 2. Find Project
    const project = await prisma.project.findUnique({
        where: { name: "Gamma Project" },
        include: { reviewer: true }
    });

    if (!project) {
        console.log("Project 'Gamma' not found!");
        console.log("Listing all projects:");
        const allProjects = await prisma.project.findMany();
        allProjects.forEach(p => console.log(` - Name: '${p.name}', ID: ${p.id}`));
    } else {
        console.log(`Project 'Gamma' found:`);
        console.log(` - ID: ${project.id}`);
        console.log(` - Reviewer ID: ${project.reviewerId}`);
        console.log(` - Reviewer Name: ${project.reviewer ? project.reviewer.name : 'NULL'}`);

        // Check match
        const matchedUser = users.find(u => u.id === project.reviewerId);
        if (matchedUser) {
            console.log(`MATCH: Project is assigned to user ID ${matchedUser.id} (${matchedUser.email})`);
        } else {
            console.log(`MISMATCH: Project reviewer ID ${project.reviewerId} does not match any found user IDs.`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
