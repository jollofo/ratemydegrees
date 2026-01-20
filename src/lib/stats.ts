import "server-only";
import prisma from "./prisma";

export async function getHomepageStats() {
    try {
        const [majorCount, institutionCount] = await Promise.all([
            prisma.major.count(),
            prisma.institution.count({ where: { active: true } })
        ]);
        return { majorCount, institutionCount };
    } catch (error) {
        console.error("Error fetching homepage stats:", error);
        return { majorCount: 0, institutionCount: 0 };
    }
}
