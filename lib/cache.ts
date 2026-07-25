import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cache Duration Constants
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
};

export const CACHE_TAGS = {
  BRANCHES: "branches",
  POSITIONS: "positions",
  GUIDES: "guides",
  VIDEOS: "videos",
  QUIZZES: "quizzes",
  USERS: "users",
};

/**
 * Cached getter for Branches list with select optimization
 */
export const getBranchesCached = unstable_cache(
  async () => {
    return prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  },
  ["branches-list"],
  {
    revalidate: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.BRANCHES],
  }
);

/**
 * Cached getter for Positions list with select optimization
 */
export const getPositionsCached = unstable_cache(
  async () => {
    return prisma.position.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  },
  ["positions-list"],
  {
    revalidate: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.POSITIONS],
  }
);

/**
 * Cache invalidation helpers
 */
export function invalidateBranchesCache() {
  revalidateTag(CACHE_TAGS.BRANCHES);
  revalidatePath("/admin/users");
  revalidatePath("/admin/guides");
  revalidatePath("/admin/videos");
}

export function invalidatePositionsCache() {
  revalidateTag(CACHE_TAGS.POSITIONS);
  revalidatePath("/admin/users");
  revalidatePath("/admin/guides");
  revalidatePath("/admin/videos");
}

export function invalidateGuidesCache() {
  revalidateTag(CACHE_TAGS.GUIDES);
  revalidatePath("/dashboard/guides");
  revalidatePath("/admin/guides");
}

export function invalidateVideosCache() {
  revalidateTag(CACHE_TAGS.VIDEOS);
  revalidatePath("/dashboard/videos");
  revalidatePath("/admin/videos");
}
