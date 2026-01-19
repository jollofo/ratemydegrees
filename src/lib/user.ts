import "server-only";
import prisma from "./prisma";

export async function getDbUser(userId: string) {
    try {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                email: true,
            }
        });
    } catch (error) {
        console.error("Error fetching DB user:", error);
        return null;
    }
}
