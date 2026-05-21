CREATE TABLE "cities" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"name_zh" varchar(100) NOT NULL,
	"country" varchar(50) DEFAULT 'China' NOT NULL,
	"description_en" text,
	"description_zh" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD COLUMN "city_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "hospitals" ADD COLUMN "city_id" varchar(50) NOT NULL;--> statement-breakpoint
CREATE INDEX "cities_name_idx" ON "cities" USING btree ("name_en","name_zh");--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doctors_city_id_idx" ON "doctors" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "hospitals_city_id_idx" ON "hospitals" USING btree ("city_id");