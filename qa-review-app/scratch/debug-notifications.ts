import { prisma } from "../src/lib/prisma";
import { NotificationService } from "../src/services/notificationService";

async function checkNotifications() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log("Checking notifications for users...");
  
  for (const user of users) {
    const count = await prisma.notification.count({ where: { userId: user.id } });
    const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
    console.log(`User: ${user.name} (${user.email}) - Total: ${count}, Unread: ${unread}`);
    
    if (count === 0) {
      console.log(`Creating test notification for ${user.name}...`);
      await NotificationService.create(
        user.id,
        "SYSTEM",
        "Test notification created at " + new Date().toISOString(),
        "/"
      );
      console.log("Created.");
    }
  }
}

checkNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
