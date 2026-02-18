import prisma from "./prisma";
import { createClient } from "@/utils/supabase/server";

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

/**
 * Resolves the currently authenticated Supabase user to a Prisma user,
 * creating one if it doesn't exist yet. Throws if not authenticated.
 */
export async function getOrCreatePrismaUser() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Must be signed in');
    }

    let prismaUser = await prisma.user.findUnique({
        where: { id: user.id }
    });

    if (!prismaUser) {
        prismaUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.email,
                role: 'USER'
            }
        });
    }

    return prismaUser;
}
