import { relations } from "drizzle-orm/relations";
import { user, familyDefinitionUserShares, familyDefinitions, account, session, familyDefinitionUserLikes, families, projects } from "./schema";

export const familyDefinitionUserSharesRelations = relations(familyDefinitionUserShares, ({one}) => ({
	user: one(user, {
		fields: [familyDefinitionUserShares.userId],
		references: [user.id]
	}),
	familyDefinition: one(familyDefinitions, {
		fields: [familyDefinitionUserShares.familyDefinitionId],
		references: [familyDefinitions.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	familyDefinitionUserShares: many(familyDefinitionUserShares),
	accounts: many(account),
	sessions: many(session),
	familyDefinitionUserLikes: many(familyDefinitionUserLikes),
}));

export const familyDefinitionsRelations = relations(familyDefinitions, ({many}) => ({
	familyDefinitionUserShares: many(familyDefinitionUserShares),
	familyDefinitionUserLikes: many(familyDefinitionUserLikes),
	families: many(families),
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

export const familyDefinitionUserLikesRelations = relations(familyDefinitionUserLikes, ({one}) => ({
	user: one(user, {
		fields: [familyDefinitionUserLikes.userId],
		references: [user.id]
	}),
	familyDefinition: one(familyDefinitions, {
		fields: [familyDefinitionUserLikes.familyDefinitionId],
		references: [familyDefinitions.id]
	}),
}));

export const familiesRelations = relations(families, ({one}) => ({
	familyDefinition: one(familyDefinitions, {
		fields: [families.definitionId],
		references: [familyDefinitions.id]
	}),
	project: one(projects, {
		fields: [families.projectId],
		references: [projects.id]
	}),
}));

export const projectsRelations = relations(projects, ({many}) => ({
	families: many(families),
}));