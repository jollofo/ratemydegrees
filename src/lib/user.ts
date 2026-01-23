import prisma from "./prisma";

export interface DbUser {
    id: string;
    role: string;
    email: string | null;
}

export async function getDbUser(userId: string): Promise<DbUser | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                email: true,
            }
        });
        return user as DbUser | null;
    } catch (error) {
        console.error("Error fetching DB user:", error);
        return null;
    }
}
