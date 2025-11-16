import "dotenv/config";
import { readFile, readdir, access } from "fs/promises";
import { constants } from "fs";
import { join, dirname, extname, basename } from "path";
import { randomUUID } from "crypto";
import { AwsClient } from "aws4fetch";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createFamily } from "../worker/db/families";
import { createPlaylist, addFamilyToPlaylist } from "../worker/db/playlists";

interface FamilyUsageExport {
  description: string;
  exportMetadata: {
    version: string;
    exportDate: string;
    revitVersion: string;
    projectName: string;
  };
  familyUsage: Array<{
    id: string;
    familyId: string; // This is actually the family name
    projectId: string;
    category: string;
    usageCount: number;
    lastUsed: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface Env {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  USER_ID: string; // User ID for creating families and playlists
}

/**
 * Infer category from family name
 * Examples: PWA_DOR_* -> Doors, PWA_WAL_* -> Walls, etc.
 */
function inferCategory(familyName: string): string {
  const upperName = familyName.toUpperCase();
  
  if (upperName.includes("_DOR_") || upperName.startsWith("DOR_")) {
    return "Doors";
  }
  if (upperName.includes("_WIN_") || upperName.startsWith("WIN_")) {
    return "Windows";
  }
  if (upperName.includes("_WAL_") || upperName.startsWith("WAL_")) {
    return "Walls";
  }
  if (upperName.includes("_FLO_") || upperName.startsWith("FLO_")) {
    return "Floors";
  }
  if (upperName.includes("_ROO_") || upperName.startsWith("ROO_")) {
    return "Roofs";
  }
  if (upperName.includes("_FUR_") || upperName.startsWith("FUR_")) {
    return "Furniture";
  }
  if (upperName.includes("_MEP_") || upperName.startsWith("MEP_")) {
    return "MEP";
  }
  if (upperName.includes("_STR_") || upperName.startsWith("STR_")) {
    return "Structural";
  }
  
  // Default category
  return "Other";
}

/**
 * Generate a unique ID for a family based on its name
 */
function generateFamilyId(familyName: string): string {
  // Create a URL-friendly ID from the family name
  return `fam_${familyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

/**
 * Upload file to R2 storage
 */
async function uploadToR2(
  filePath: string,
  storageKey: string,
  env: Env
): Promise<string> {
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });

  const bucketName = "revitfy-storage";
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;

  const url = new URL(
    `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`
  );
  url.pathname = `/${storageKey}`;
  url.searchParams.set("X-Amz-Expires", "3600");

  const fileContent = await readFile(filePath);
  // Convert Buffer to Uint8Array for fetch API compatibility
  const uint8Array = new Uint8Array(fileContent);

  const signed = await client.sign(
    new Request(url, {
      method: "PUT",
      body: uint8Array,
      headers: {
        "Content-Type": getContentType(filePath),
      },
    }),
    { aws: { signQuery: true } }
  );

  const response = await fetch(signed.url, {
    method: "PUT",
    body: uint8Array,
    headers: {
      "Content-Type": getContentType(filePath),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to R2: ${response.statusText}`);
  }

  return storageKey;
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".rfa": "application/octet-stream",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  };
  return contentTypes[ext] || "application/octet-stream";
}

/**
 * Find or create a family by name
 */
async function findOrCreateFamily(
  db: ReturnType<typeof getDb>,
  familyName: string,
  category: string,
  folderPath: string,
  env: Env
): Promise<{ id: string; name: string }> {
  // First, try to find by name
  const existing = await db.query.families.findFirst({
    where: eq(schema.families.name, familyName),
  });

  if (existing) {
    console.log(`  Found existing family: ${familyName} (ID: ${existing.id})`);
    return { id: existing.id, name: existing.name };
  }

  // Family doesn't exist, create it
  console.log(`  Creating new family: ${familyName}`);
  const familyId = generateFamilyId(familyName);
  console.log(`  Generated family ID: ${familyId}`);
  // Use provided category, or fallback to inference if not provided
  const finalCategory = category || inferCategory(familyName);

  // Look for .rfa file
  const rfaFileName = `${familyName}.rfa`;
  const rfaFilePath = join(folderPath, rfaFileName);
  let rfaStorageKey: string | undefined;

  try {
    await access(rfaFilePath, constants.F_OK);
    // File exists, upload it
    rfaStorageKey = `family/${familyId}/${rfaFileName}`;
    console.log(`  Uploading RFA file: ${rfaFileName}`);
    await uploadToR2(rfaFilePath, rfaStorageKey, env);
  } catch (error) {
    console.warn(`  Warning: RFA file not found: ${rfaFileName}`);
  }

  // Look for preview image (PNG)
  // Try common patterns: {name}.png, {name}_preview.png, etc.
  // Also check for files containing the family name
  const previewPatterns = [
    `${familyName}.png`,
    `${familyName}_preview.png`,
    `${familyName}_thumb.png`,
  ];

  let previewStorageKey: string | undefined;
  
  // First try exact patterns
  for (const pattern of previewPatterns) {
    const previewPath = join(folderPath, pattern);
    try {
      await access(previewPath, constants.F_OK);
      // File exists, upload it
      previewStorageKey = `family/${familyId}/preview.${extname(pattern).slice(1)}`;
      console.log(`  Uploading preview image: ${pattern}`);
      await uploadToR2(previewPath, previewStorageKey, env);
      break;
    } catch {
      // Try next pattern
    }
  }

  // If no exact match, search for PNG files containing the family name
  if (!previewStorageKey) {
    try {
      const files = await readdir(folderPath);
      const pngFile = files.find(
        (file) =>
          file.toLowerCase().endsWith(".png") &&
          file.toLowerCase().includes(familyName.toLowerCase())
      );

      if (pngFile) {
        const previewPath = join(folderPath, pngFile);
        previewStorageKey = `family/${familyId}/preview.png`;
        console.log(`  Uploading preview image: ${pngFile}`);
        await uploadToR2(previewPath, previewStorageKey, env);
      }
    } catch (error) {
      // Ignore errors when searching for files
    }
  }

  // Create the family
  const family = await createFamily(db, {
    id: familyId,
    name: familyName,
    category: finalCategory,
    userId: env.USER_ID,
    previewImageStorageKey: previewStorageKey,
    rfaFileStorageKey: rfaStorageKey,
  });

  console.log(`  ✅ Family created successfully (ID: ${family.id}, Name: ${family.name})`);
  return { id: family.id, name: family.name };
}

/**
 * Find or create a project
 */
async function findOrCreateProject(
  db: ReturnType<typeof getDb>,
  projectId: string,
  projectName: string,
  exportDate: string
): Promise<string> {
  const existing = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
  });

  if (existing) {
    console.log(`  Found existing project: ${projectName} (ID: ${existing.id})`);
    // Update harvestedAt
    await db
      .update(schema.projects)
      .set({
        harvestedAt: exportDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.projects.id, projectId));
    return projectId;
  }

  console.log(`  Creating new project: ${projectName} (ID: ${projectId})`);
  const [createdProject] = await db.insert(schema.projects).values({
    id: projectId,
    name: projectName,
    harvestedAt: exportDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  console.log(`  ✅ Project created successfully (ID: ${createdProject.id}, Name: ${createdProject.name})`);
  return projectId;
}

/**
 * Create or update family usage record
 */
async function upsertFamilyUsage(
  db: ReturnType<typeof getDb>,
  usageRecord: FamilyUsageExport["familyUsage"][0],
  familyDbId: string,
  projectId: string
): Promise<void> {
  // Check if usage record exists
  const existing = await db.query.familyUsage.findFirst({
    where: and(
      eq(schema.familyUsage.familyId, familyDbId),
      eq(schema.familyUsage.projectId, projectId)
    ),
  });

  if (existing) {
    // Update existing record
    const [updated] = await db
      .update(schema.familyUsage)
      .set({
        usageCount: usageRecord.usageCount,
        lastUsed: usageRecord.lastUsed,
        updatedAt: usageRecord.updatedAt,
      })
      .where(eq(schema.familyUsage.id, existing.id))
      .returning();
    console.log(`    Updated usage record (ID: ${updated.id}, Usage Count: ${updated.usageCount})`);
  } else {
    // Create new record
    const [created] = await db.insert(schema.familyUsage).values({
      id: usageRecord.id,
      familyId: familyDbId,
      projectId: projectId,
      usageCount: usageRecord.usageCount,
      lastUsed: usageRecord.lastUsed,
      createdAt: usageRecord.createdAt,
      updatedAt: usageRecord.updatedAt,
    }).returning();
    console.log(`    Created usage record (ID: ${created.id}, Usage Count: ${created.usageCount})`);
  }
}

/**
 * Get database connection
 */
function getDb(env: Env) {
  const connectionString =
    env.HYPERDRIVE?.connectionString || env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL or HYPERDRIVE connection string is required");
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

/**
 * Main ingest function
 */
async function ingestUsageExport(jsonFilePath: string) {
  console.log(`\n🚀 Starting ingest process for: ${jsonFilePath}\n`);

  // Validate environment variables
  const env: Env = {
    DATABASE_URL: process.env.DATABASE_URL,
    HYPERDRIVE: process.env.HYPERDRIVE
      ? JSON.parse(process.env.HYPERDRIVE)
      : undefined,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID!,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY!,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID!,
    USER_ID: "1JrKYPzweHa6unq7DBlAP65REs0fd4YN" // zuza user id
  };

  // Check required env vars
  if (!env.R2_ACCESS_KEY_ID) {
    throw new Error("R2_ACCESS_KEY_ID environment variable is required");
  }
  if (!env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2_SECRET_ACCESS_KEY environment variable is required");
  }
  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID environment variable is required");
  }
  if (!env.USER_ID) {
    throw new Error("USER_ID environment variable is required");
  }
  if (!env.DATABASE_URL && !env.HYPERDRIVE) {
    throw new Error(
      "Either DATABASE_URL or HYPERDRIVE environment variable is required"
    );
  }

  console.log("✅ Environment variables validated\n");

  // Read JSON file
  const jsonContent = await readFile(jsonFilePath, "utf-8");
  const exportData: FamilyUsageExport = JSON.parse(jsonContent);

  const folderPath = dirname(jsonFilePath);
  const projectId = exportData.familyUsage[0]?.projectId;
  const projectName = exportData.exportMetadata.projectName;

  if (!projectId) {
    throw new Error("No project ID found in export data");
  }

  console.log(`📦 Project: ${projectName} (${projectId})`);
  console.log(`📁 Folder: ${folderPath}`);
  console.log(`📊 Found ${exportData.familyUsage.length} family usage records\n`);

  // Initialize database
  const db = getDb(env);

  // Find or create project
  await findOrCreateProject(
    db,
    projectId,
    projectName,
    exportData.exportMetadata.exportDate
  );

  // Process each family usage record
  const processedFamilies: Array<{ id: string; name: string }> = [];

  for (const usageRecord of exportData.familyUsage) {
    const familyName = usageRecord.familyId; // familyId is actually the name
    const category = usageRecord.category;
    console.log(`\n📋 Processing family: ${familyName}`);

    try {
      // Find or create family
      const family = await findOrCreateFamily(
        db,
        familyName,
        category,
        folderPath,
        env
      );

      // Create or update usage record
      await upsertFamilyUsage(db, usageRecord, family.id, projectId);

      processedFamilies.push(family);
      console.log(`  ✅ Successfully processed ${familyName}`);
    } catch (error) {
      console.error(`  ❌ Error processing ${familyName}:`, error);
      throw error;
    }
  }

  // Create playlist with all families from this project
  console.log(`\n🎵 Creating playlist for project: ${projectName}`);
  const playlistId = randomUUID();
  const playlistName = `${projectName} - Families`;
  console.log(`  Generated playlist ID (GUID): ${playlistId}`);
  console.log(`  User ID: ${env.USER_ID}`);

  let finalPlaylistId: string = playlistId;

  try {
    // First verify the user exists (foreign key constraint check)
    const userExists = await db.query.user.findFirst({
      where: eq(schema.user.id, env.USER_ID),
    });
    
    if (!userExists) {
      throw new Error(`User with ID ${env.USER_ID} does not exist in database. Cannot create playlist.`);
    }
    console.log(`  ✅ Verified user exists: ${userExists.name} (${userExists.email})`);

    // Check if playlist already exists (by project name, since we're using GUIDs now)
    // We'll check by name and userId to avoid duplicates
    const existingPlaylist = await db.query.playlists.findFirst({
      where: and(
        eq(schema.playlists.name, playlistName),
        eq(schema.playlists.userId, env.USER_ID)
      ),
    });

    if (!existingPlaylist) {
      console.log(`  Creating new playlist...`);
      try {
        const createdPlaylist = await createPlaylist(db, {
          id: playlistId,
          name: playlistName,
          userId: env.USER_ID,
          description: `All families used in project: ${projectName}`,
        });
        console.log(`  ✅ Created playlist: ${playlistName} (ID: ${createdPlaylist.id})`);
        console.log(`  Playlist details:`, JSON.stringify({
          id: createdPlaylist.id,
          name: createdPlaylist.name,
          userId: createdPlaylist.userId,
          description: createdPlaylist.description,
          createdAt: createdPlaylist.createdAt,
        }, null, 2));
        
        finalPlaylistId = createdPlaylist.id;
        
        // Verify playlist was created by querying it back
        const verifyPlaylist = await db.query.playlists.findFirst({
          where: eq(schema.playlists.id, finalPlaylistId),
        });
        if (verifyPlaylist) {
          console.log(`  ✅ Verified playlist exists in database (ID: ${verifyPlaylist.id})`);
        } else {
          console.error(`  ❌ WARNING: Playlist not found in database after creation!`);
          throw new Error(`Playlist creation failed - playlist not found after insert`);
        }
      } catch (error) {
        console.error(`  ❌ Error creating playlist:`, error);
        if (error instanceof Error) {
          console.error(`  Error message: ${error.message}`);
          console.error(`  Error stack: ${error.stack}`);
        }
        throw error;
      }
    } else {
      console.log(`  ℹ️  Playlist already exists: ${playlistName} (ID: ${existingPlaylist.id})`);
      finalPlaylistId = existingPlaylist.id;
    }

    // Add all families to playlist
    for (let i = 0; i < processedFamilies.length; i++) {
      const family = processedFamilies[i];
      try {
        await addFamilyToPlaylist(db, finalPlaylistId, family.id, i);
        console.log(`  ✅ Added ${family.name} (ID: ${family.id}) to playlist at order ${i}`);
      } catch (error: unknown) {
        if (error instanceof Error && error.message === "Family already in playlist") {
          console.log(`  ℹ️  ${family.name} (ID: ${family.id}) already in playlist`);
        } else {
          console.error(`  ❌ Error adding ${family.name} (ID: ${family.id}) to playlist:`, error);
          if (error instanceof Error) {
            console.error(`  Error details: ${error.message}`);
          }
        }
      }
    }
    
    // Final verification: check playlist and families count
    const finalPlaylist = await db.query.playlists.findFirst({
      where: eq(schema.playlists.id, finalPlaylistId),
    });
    
    if (!finalPlaylist) {
      console.error(`  ❌ CRITICAL: Playlist not found in database! (ID: ${finalPlaylistId})`);
    } else {
      console.log(`  ✅ Final verification: Playlist exists (ID: ${finalPlaylist.id}, Name: ${finalPlaylist.name})`);
    }
    
    const playlistFamiliesCount = await db.query.playlistFamilies.findMany({
      where: eq(schema.playlistFamilies.playlistId, finalPlaylistId),
    });
    console.log(`  📊 Total families in playlist: ${playlistFamiliesCount.length}`);
  } catch (error) {
    console.error(`  ❌ Error creating playlist:`, error);
    if (error instanceof Error) {
      console.error(`  Error message: ${error.message}`);
      console.error(`  Error stack:`, error.stack);
    }
    throw error;
  }

  console.log(`\n✅ Ingest completed successfully!`);
  console.log(`   - Processed ${processedFamilies.length} families`);
  console.log(`   - Created/updated project: ${projectName} (ID: ${projectId})`);
  console.log(`   - Created playlist: ${playlistName} (ID: ${finalPlaylistId})`);
}

// Run the script
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error("Usage: tsx scripts/ingest-usage-export.ts <path-to-json-file>");
  process.exit(1);
}

ingestUsageExport(jsonFilePath)
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

