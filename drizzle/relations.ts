import { relations } from "drizzle-orm/relations";
import { user, account, session, projects, families, familyTypes, familyUsage, familyTypeUsage, familyReactions } from "./schema";

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
	familyTypeUsage: many(familyTypeUsage),
}));

export const familiesRelations = relations(families, ({many}) => ({
	types: many(familyTypes),
	usage: many(familyUsage),
	reactions: many(familyReactions),
}));

export const familyTypesRelations = relations(familyTypes, ({one, many}) => ({
	family: one(families, {
		fields: [familyTypes.familyId],
		references: [families.id]
	}),
	usage: many(familyTypeUsage),
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

export const familyTypeUsageRelations = relations(familyTypeUsage, ({one}) => ({
	type: one(familyTypes, {
		fields: [familyTypeUsage.typeId],
		references: [familyTypes.id]
	}),
	project: one(projects, {
		fields: [familyTypeUsage.projectId],
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