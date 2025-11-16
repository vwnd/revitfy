import { pgTable, foreignKey, text, timestamp, unique, boolean, json, integer, index } from "drizzle-orm/pg-core"

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const projects = pgTable("projects", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	cityName: text("city_name"),
	location: json(),
	harvestedAt: timestamp("harvested_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const families = pgTable("families", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	userId: text("user_id").notNull(),
	previewImageStorageKey: text("preview_image_storage_key"),
	rfaFileStorageKey: text("rfa_file_storage_key"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("families_category_idx").on(table.category),
	index("families_user_id_idx").on(table.userId),
]);

export const familyUsage = pgTable("family_usage", {
	id: text().primaryKey().notNull(),
	familyId: text("family_id").notNull(),
	projectId: text("project_id").notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	lastUsed: timestamp("last_used", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.familyId],
		foreignColumns: [families.id],
		name: "family_usage_family_id_families_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "family_usage_project_id_projects_id_fk"
	}).onDelete("cascade"),
	unique("family_usage_family_project_unique").on(table.familyId, table.projectId),
	index("family_usage_family_id_idx").on(table.familyId),
	index("family_usage_project_id_idx").on(table.projectId),
	index("family_usage_last_used_idx").on(table.lastUsed),
]);

export const familyReactions = pgTable("family_reactions", {
	id: text().primaryKey().notNull(),
	familyId: text("family_id").notNull(),
	userId: text("user_id").notNull(),
	reactionType: text("reaction_type").notNull(), // 'like' or 'dislike'
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.familyId],
		foreignColumns: [families.id],
		name: "family_reactions_family_id_families_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "family_reactions_user_id_user_id_fk"
	}).onDelete("cascade"),
	unique("family_reactions_family_user_unique").on(table.familyId, table.userId),
	index("family_reactions_family_id_idx").on(table.familyId),
]);

export const playlists = pgTable("playlists", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	previewImageStorageKey: text("preview_image_storage_key"),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "playlists_user_id_user_id_fk"
	}).onDelete("cascade"),
	index("playlists_user_id_idx").on(table.userId),
]);

export const playlistFamilies = pgTable("playlist_families", {
	id: text().primaryKey().notNull(),
	playlistId: text("playlist_id").notNull(),
	familyId: text("family_id").notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.playlistId],
		foreignColumns: [playlists.id],
		name: "playlist_families_playlist_id_playlists_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.familyId],
		foreignColumns: [families.id],
		name: "playlist_families_family_id_families_id_fk"
	}).onDelete("cascade"),
	unique("playlist_families_playlist_family_unique").on(table.playlistId, table.familyId),
	index("playlist_families_playlist_id_idx").on(table.playlistId),
	index("playlist_families_family_id_idx").on(table.familyId),
]);

export const playlistReactions = pgTable("playlist_reactions", {
	id: text().primaryKey().notNull(),
	playlistId: text("playlist_id").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [table.playlistId],
		foreignColumns: [playlists.id],
		name: "playlist_reactions_playlist_id_playlists_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.userId],
		foreignColumns: [user.id],
		name: "playlist_reactions_user_id_user_id_fk"
	}).onDelete("cascade"),
	unique("playlist_reactions_playlist_user_unique").on(table.playlistId, table.userId),
	index("playlist_reactions_playlist_id_idx").on(table.playlistId),
]);