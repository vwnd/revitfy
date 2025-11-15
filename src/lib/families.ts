import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { createDatabase } from "./create-database";

export const getFamilies = createServerFn({
  method: 'GET',
}).handler(async () => {
  const db = await createDatabase();

  // Query to get family definitions with their usage count
  const familiesWithUsage = await db
    .select({
      id: schema.familyDefinitions.id,
      name: schema.familyDefinitions.name,
      category: schema.familyDefinitions.category,
      usageCount: sql<number>`COUNT(${schema.families.id})`.as('usageCount'),
    })
    .from(schema.familyDefinitions)
    .leftJoin(
      schema.families,
      eq(schema.families.definitionId, schema.familyDefinitions.id)
    )
    .groupBy(
      schema.familyDefinitions.id,
      schema.familyDefinitions.name,
      schema.familyDefinitions.category
    )
    .orderBy(schema.familyDefinitions.name);

  return familiesWithUsage.map((family) => ({
    id: family.id,
    name: family.name,
    category: family.category,
    usageCount: Number(family.usageCount) || 0,
  }));
});

