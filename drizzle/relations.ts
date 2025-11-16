import { relations } from "drizzle-orm/relations";
import { user, account, session, projects, families, familyUsage, familyReactions } from "./schema";

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	familyReactions: many(familyReactions),
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