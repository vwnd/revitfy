CREATE TABLE "family_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_reactions_family_user_unique" UNIQUE("family_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "family_type_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"type_id" text NOT NULL,
	"project_id" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_type_usage_type_project_unique" UNIQUE("type_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "family_types" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "family_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"project_id" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "family_usage_family_project_unique" UNIQUE("family_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "family_definition_user_shares" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "family_definition_user_likes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "family_definitions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "family_definition_user_shares" CASCADE;--> statement-breakpoint
DROP TABLE "family_definition_user_likes" CASCADE;--> statement-breakpoint
DROP TABLE "family_definitions" CASCADE;--> statement-breakpoint
ALTER TABLE "families" DROP CONSTRAINT "families_definition_id_family_definitions_id_fk";
--> statement-breakpoint
ALTER TABLE "families" DROP CONSTRAINT "families_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE "families" ADD COLUMN "preview_image_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "city_name" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "harvested_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "family_reactions" ADD CONSTRAINT "family_reactions_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_reactions" ADD CONSTRAINT "family_reactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_type_usage" ADD CONSTRAINT "family_type_usage_type_id_family_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."family_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_type_usage" ADD CONSTRAINT "family_type_usage_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_types" ADD CONSTRAINT "family_types_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_usage" ADD CONSTRAINT "family_usage_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_usage" ADD CONSTRAINT "family_usage_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "family_reactions_family_id_idx" ON "family_reactions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_type_usage_type_id_idx" ON "family_type_usage" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "family_type_usage_project_id_idx" ON "family_type_usage" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "family_types_family_id_idx" ON "family_types" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_usage_family_id_idx" ON "family_usage" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "family_usage_project_id_idx" ON "family_usage" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "family_usage_last_used_idx" ON "family_usage" USING btree ("last_used");--> statement-breakpoint
CREATE INDEX "families_category_idx" ON "families" USING btree ("category");--> statement-breakpoint
ALTER TABLE "families" DROP COLUMN "definition_id";--> statement-breakpoint
ALTER TABLE "families" DROP COLUMN "project_id";