CREATE TABLE "shelf" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"perfume_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shelf_user_perfume" UNIQUE("user_id","perfume_id")
);
--> statement-breakpoint
ALTER TABLE "shelf" ADD CONSTRAINT "shelf_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;