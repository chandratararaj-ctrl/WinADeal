
import prisma from './src/config/database';

async function checkUserEmail() {
    const userId = '93f83e3d-d244-4224-a685-d93636235881'; // From previous log
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    console.log("Checking User for Partner ID 5a79ccb5-f3b9-4429-b113-76015223f2f2...");
    if (user) {
        console.log(`User Found:`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- ID: ${user.id}`);
    } else {
        console.log("User not found!");
    }
}

checkUserEmail()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
