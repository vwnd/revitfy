import { relations } from "drizzle-orm/relations";
import {
  user,
  account,
  session,
  projects,
  families,
  familyUsage,
  familyReactions,
  playlists,
  playlistFamilies,
  playlistReactions,
} from "./schema";

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	familyReactions: many(familyReactions),
	playlists: many(playlists),
	playlistReactions: many(playlistReactions),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	familyUsage: many(familyUsage),
}));

export const familiesRelations = relations(families, ({many}) => ({
	usage: many(familyUsage),
	reactions: many(familyReactions),
	playlistFamilies: many(playlistFamilies),
}));

export const familyUsageRelations = relations(familyUsage, ({one}) => ({
	family: one(families, {
		fields: [familyUsage.familyId],
		references: [families.id]
	}),
	project: one(projects, {
		fields: [familyUsage.projectId],
		references: [projects.id]
	}),
}));

export const familyReactionsRelations = relations(familyReactions, ({one}) => ({
	family: one(families, {
		fields: [familyReactions.familyId],
		references: [families.id]
	}),
	user: one(user, {
		fields: [familyReactions.userId],
		references: [user.id]
	}),
}));

export const playlistsRelations = relations(playlists, ({one, many}) => ({
	user: one(user, {
		fields: [playlists.userId],
		references: [user.id]
	}),
	playlistFamilies: many(playlistFamilies),
	reactions: many(playlistReactions),
}));

export const playlistFamiliesRelations = relations(playlistFamilies, ({one}) => ({
	playlist: one(playlists, {
		fields: [playlistFamilies.playlistId],
		references: [playlists.id]
	}),
	family: one(families, {
		fields: [playlistFamilies.familyId],
		references: [families.id]
	}),
}));

export const playlistReactionsRelations = relations(playlistReactions, ({one}) => ({
	playlist: one(playlists, {
		fields: [playlistReactions.playlistId],
		references: [playlists.id]
	}),
	user: one(user, {
		fields: [playlistReactions.userId],
		references: [user.id]
	}),
}));