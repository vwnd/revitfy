import { eq, sql, desc, and, gte, count, inArray } from 'drizzle-orm';
import { families, familyTypes, familyUsage, familyTypeUsage, familyReactions, projects } from '../../drizzle/schema';
import type { InferSelectModel } from 'drizzle-orm';

type Family = InferSelectModel<typeof families>;
type FamilyType = InferSelectModel<typeof familyTypes>;
type Db = ReturnType<typeof import('../db').getDb>;

export interface FamilyDetailResult {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  likesCount: number;
  dislikesCount: number;
  lastUsed: string;
  types: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
  usageStatistics: {
    relatedProjects: Array<{
      projectId: string;
      projectName: string;
      usedCount: number;
    }>;
    relatedLocations: Array<{
      cityName: string;
      usageCount: number;
    }>;
    relatedPeriods: {
      lastMonth: number;
      lastQuarter: number;
      lastYear: number;
    };
  };
}

/**
 * Get family by ID with all related data
 */
export async function getFamilyById(db: Db, familyId: string): Promise<FamilyDetailResult | null> {
  // Get the family
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId))
    .limit(1);

  if (!family) {
    return null;
  }

  // Get all types for this family
  const types = await db
    .select({
      id: familyTypes.id,
      name: familyTypes.name,
    })
    .from(familyTypes)
    .where(eq(familyTypes.familyId, familyId));

  // Get usage counts for each type
  const typeIds = types.map(t => t.id);
  const typeUsageCounts = typeIds.length > 0
    ? await db
        .select({
          typeId: familyTypeUsage.typeId,
          usageCount: sql<number>`COALESCE(SUM(${familyTypeUsage.usageCount}), 0)`.as('usage_count'),
        })
        .from(familyTypeUsage)
        .where(inArray(familyTypeUsage.typeId, typeIds))
        .groupBy(familyTypeUsage.typeId)
    : [];

  const typeUsageMap = new Map(
    typeUsageCounts.map(t => [t.typeId, Number(t.usageCount)])
  );

  // Get total family usage count
  const [familyUsageResult] = await db
    .select({
      totalUsage: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('total_usage'),
    })
    .from(familyUsage)
    .where(eq(familyUsage.familyId, familyId));

  const totalUsageCount = Number(familyUsageResult?.totalUsage || 0);

  // Get likes and dislikes counts
  const likesResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(familyReactions)
    .where(
      and(
        eq(familyReactions.familyId, familyId),
        eq(familyReactions.reactionType, 'like')
      )
    );

  const dislikesResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(familyReactions)
    .where(
      and(
        eq(familyReactions.familyId, familyId),
        eq(familyReactions.reactionType, 'dislike')
      )
    );

  const likesCount = Number(likesResult[0]?.count || 0);
  const dislikesCount = Number(dislikesResult[0]?.count || 0);

  // Get last used timestamp
  const [lastUsedResult] = await db
    .select({
      lastUsed: sql<string>`MAX(${familyUsage.lastUsed})`.as('last_used'),
    })
    .from(familyUsage)
    .where(eq(familyUsage.familyId, familyId));

  const lastUsed = lastUsedResult?.lastUsed 
    ? formatRelativeTime(lastUsedResult.lastUsed)
    : 'Never';

  // Get usage by project
  const usageByProject = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      usedCount: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('used_count'),
    })
    .from(familyUsage)
    .innerJoin(projects, eq(familyUsage.projectId, projects.id))
    .where(eq(familyUsage.familyId, familyId))
    .groupBy(projects.id, projects.name)
    .orderBy(desc(sql`COALESCE(SUM(${familyUsage.usageCount}), 0)`))
    .limit(10);

  // Get usage by location (city)
  const usageByLocation = await db
    .select({
      cityName: projects.cityName,
      usageCount: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('usage_count'),
    })
    .from(familyUsage)
    .innerJoin(projects, eq(familyUsage.projectId, projects.id))
    .where(
      and(
        eq(familyUsage.familyId, familyId),
        sql`${projects.cityName} IS NOT NULL`
      )
    )
    .groupBy(projects.cityName)
    .orderBy(desc(sql`COALESCE(SUM(${familyUsage.usageCount}), 0)`))
    .limit(10);

  // Get usage by period
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const lastQuarter = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [lastMonthResult] = await db
    .select({
      count: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('count'),
    })
    .from(familyUsage)
    .where(
      and(
        eq(familyUsage.familyId, familyId),
        gte(familyUsage.lastUsed, lastMonth.toISOString())
      )
    );

  const [lastQuarterResult] = await db
    .select({
      count: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('count'),
    })
    .from(familyUsage)
    .where(
      and(
        eq(familyUsage.familyId, familyId),
        gte(familyUsage.lastUsed, lastQuarter.toISOString())
      )
    );

  const [lastYearResult] = await db
    .select({
      count: sql<number>`COALESCE(SUM(${familyUsage.usageCount}), 0)`.as('count'),
    })
    .from(familyUsage)
    .where(
      and(
        eq(familyUsage.familyId, familyId),
        gte(familyUsage.lastUsed, lastYear.toISOString())
      )
    );

  return {
    id: family.id,
    name: family.name,
    category: family.category,
    usageCount: totalUsageCount,
    likesCount: likesCount,
    dislikesCount: dislikesCount,
    lastUsed,
    types: types.map(type => ({
      id: type.id,
      name: type.name,
      usageCount: typeUsageMap.get(type.id) || 0,
    })),
    usageStatistics: {
      relatedProjects: usageByProject.map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        usedCount: Number(p.usedCount),
      })),
      relatedLocations: usageByLocation.map(l => ({
        cityName: l.cityName || 'Unknown',
        usageCount: Number(l.usageCount),
      })),
      relatedPeriods: {
        lastMonth: Number(lastMonthResult?.count || 0),
        lastQuarter: Number(lastQuarterResult?.count || 0),
        lastYear: Number(lastYearResult?.count || 0),
      },
    },
  };
}

/**
 * Format timestamp to relative time string (e.g., "2 days ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

