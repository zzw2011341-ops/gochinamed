CREATE TYPE "public"."doctor_appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'de', 'fr', 'zh');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."service_fee_type" AS ENUM('medical', 'flight', 'hotel', 'ticket', 'general');--> statement-breakpoint
CREATE TYPE "public"."service_reservation_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('flight', 'train', 'hotel', 'car_rental', 'ticket', 'visa', 'insurance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'admin', 'staff');--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"messages" jsonb NOT NULL,
	"medical_record_id" varchar(36),
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attractions" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_zh" varchar(255),
	"description_en" text,
	"description_zh" text,
	"category" varchar(100),
	"location" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"image_url" text,
	"website" text,
	"opening_hours" text,
	"average_duration" varchar(50),
	"ticket_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"rating" numeric(3, 2),
	"is_recommended_for_patients" boolean DEFAULT false,
	"distance_to_hospital" numeric(10, 2),
	"tips_en" text,
	"tips_zh" text,
	"accessibility_features" jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"title_en" varchar(255),
	"title_zh" varchar(255),
	"link_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"parent_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"order_id" varchar(36),
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"images" jsonb,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"status" "post_status" DEFAULT 'published' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "diseases" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_zh" varchar(255),
	"description_en" text,
	"description_zh" text,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" varchar(36) NOT NULL,
	"name_en" varchar(128) NOT NULL,
	"name_zh" varchar(128),
	"title" varchar(100),
	"gender" "gender",
	"specialties_en" text NOT NULL,
	"specialties_zh" text,
	"description_en" text,
	"description_zh" text,
	"experience_years" integer,
	"image_url" text,
	"consultation_fee" numeric(10, 2),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flight_number" varchar(20) NOT NULL,
	"airline" varchar(100) NOT NULL,
	"origin" varchar(10) NOT NULL,
	"destination" varchar(10) NOT NULL,
	"departure_time" timestamp with time zone NOT NULL,
	"arrival_time" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"available_seats" integer NOT NULL,
	"class_type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_zh" varchar(255),
	"description_en" text,
	"description_zh" text,
	"level" varchar(50),
	"specialties" jsonb,
	"location" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"image_url" text,
	"website" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_zh" varchar(255),
	"description_en" text,
	"description_zh" text,
	"location" varchar(255) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"city" varchar(100) NOT NULL,
	"star_rating" integer,
	"room_types" jsonb,
	"amenities" jsonb,
	"image_url" text,
	"website" text,
	"distance_to_hospital" numeric(10, 2),
	"base_price_per_night" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"type" "service_type" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"location" varchar(255),
	"price" numeric(10, 2),
	"booking_confirmation" text,
	"status" "service_reservation_status" DEFAULT 'pending' NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"doctor_id" varchar(36),
	"diagnosis" text,
	"symptoms" text,
	"medical_report_url" text,
	"ai_analysis_result" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"doctor_id" varchar(36),
	"hospital_id" varchar(36),
	"disease_id" varchar(36),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"doctor_appointment_status" "doctor_appointment_status" DEFAULT 'pending' NOT NULL,
	"doctor_appointment_date" timestamp with time zone,
	"service_reservation_status" "service_reservation_status" DEFAULT 'pending' NOT NULL,
	"medical_fee" numeric(10, 2),
	"hotel_fee" numeric(10, 2),
	"flight_fee" numeric(10, 2),
	"ticket_fee" numeric(10, 2),
	"subtotal" numeric(10, 2),
	"service_fee_rate" numeric(5, 4) DEFAULT '0.05' NOT NULL,
	"service_fee_amount" numeric(10, 2),
	"total_amount" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"travel_notes" text,
	"weather_forecast" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_number" varchar(255) NOT NULL,
	"bank_name" varchar(255),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"api_key" text,
	"api_secret" text,
	"webhook_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_intent_id" varchar(255),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_amount" numeric(10, 2),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_fees" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "service_fee_type" NOT NULL,
	"rate" numeric(5, 4) NOT NULL,
	"min_fee" numeric(10, 2),
	"max_fee" numeric(10, 2),
	"description_en" text,
	"description_zh" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "service_fees_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "service_reservations" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(36) NOT NULL,
	"itinerary_id" varchar(36),
	"type" "service_type" NOT NULL,
	"provider_name" varchar(255),
	"provider_reference" varchar(255),
	"status" "service_reservation_status" DEFAULT 'pending' NOT NULL,
	"reservation_date" timestamp with time zone,
	"confirmation_date" timestamp with time zone,
	"cancellation_date" timestamp with time zone,
	"price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"details" jsonb,
	"remarks" text,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"password" text,
	"name" varchar(128) NOT NULL,
	"passport_number" varchar(50),
	"passport_country" varchar(10),
	"preferred_language" "language" DEFAULT 'en' NOT NULL,
	"role" "user_role" DEFAULT 'patient' NOT NULL,
	"avatar_url" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"origin_city" varchar(100),
	"destination_city" varchar(100),
	"budget" numeric(10, 2),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_medical_record_id_medical_records_id_fk" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reservations" ADD CONSTRAINT "service_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reservations" ADD CONSTRAINT "service_reservations_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_conversations_created_at_idx" ON "ai_conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "attractions_city_idx" ON "attractions" USING btree ("city");--> statement-breakpoint
CREATE INDEX "attractions_category_idx" ON "attractions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "attractions_location_idx" ON "attractions" USING btree ("location");--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "comments_user_id_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_parent_id_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "community_posts_user_id_idx" ON "community_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_posts_order_id_idx" ON "community_posts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "community_posts_status_idx" ON "community_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_posts_created_at_idx" ON "community_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "doctors_hospital_id_idx" ON "doctors" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "flights_origin_dest_idx" ON "flights" USING btree ("origin","destination");--> statement-breakpoint
CREATE INDEX "flights_airline_idx" ON "flights" USING btree ("airline");--> statement-breakpoint
CREATE INDEX "flights_departure_time_idx" ON "flights" USING btree ("departure_time");--> statement-breakpoint
CREATE INDEX "hospitals_location_idx" ON "hospitals" USING btree ("location");--> statement-breakpoint
CREATE INDEX "hospitals_level_idx" ON "hospitals" USING btree ("level");--> statement-breakpoint
CREATE INDEX "hotels_city_idx" ON "hotels" USING btree ("city");--> statement-breakpoint
CREATE INDEX "hotels_star_rating_idx" ON "hotels" USING btree ("star_rating");--> statement-breakpoint
CREATE INDEX "hotels_location_idx" ON "hotels" USING btree ("location");--> statement-breakpoint
CREATE INDEX "itineraries_order_id_idx" ON "itineraries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "itineraries_type_idx" ON "itineraries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "likes_post_id_idx" ON "likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "likes_user_id_idx" ON "likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "likes_unique_post_user" ON "likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "medical_records_user_id_idx" ON "medical_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_records_doctor_id_idx" ON "medical_records" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_doctor_id_idx" ON "orders" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_accounts_type_idx" ON "payment_accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "payment_accounts_is_active_idx" ON "payment_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_payment_intent_id_idx" ON "payments" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "service_fees_type_idx" ON "service_fees" USING btree ("type");--> statement-breakpoint
CREATE INDEX "service_reservations_order_id_idx" ON "service_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "service_reservations_itinerary_id_idx" ON "service_reservations" USING btree ("itinerary_id");--> statement-breakpoint
CREATE INDEX "service_reservations_type_idx" ON "service_reservations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "service_reservations_status_idx" ON "service_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");