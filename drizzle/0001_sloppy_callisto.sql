CREATE TABLE "composition" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"notes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "composition_user_slug" UNIQUE("user_id","slug")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "patron" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "composition" ADD CONSTRAINT "composition_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;