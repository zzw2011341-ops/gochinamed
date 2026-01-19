import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["patient", "admin", "staff"]);
export const languageEnum = pgEnum("language", ["en", "de", "fr", "zh"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "processing", "completed", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published", "archived"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const doctorAppointmentStatusEnum = pgEnum("doctor_appointment_status", ["pending", "confirmed", "cancelled", "completed"]);
export const serviceReservationStatusEnum = pgEnum("service_reservation_status", ["pending", "confirmed", "cancelled", "completed"]);
export const serviceTypeEnum = pgEnum("service_type", ["flight", "train", "hotel", "car_rental", "ticket", "visa", "insurance"]);
export const serviceFeeTypeEnum = pgEnum("service_fee_type", ["medical", "flight", "hotel", "ticket", "general"]);

// Users Table
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull(),
    password: text("password"),
    name: varchar("name", { length: 128 }).notNull(),
    passportNumber: varchar("passport_number", { length: 50 }),
    passportCountry: varchar("passport_country", { length: 10 }),
    preferredLanguage: languageEnum("preferred_language").notNull().default("en"),
    role: userRoleEnum("role").notNull().default("patient"),
    avatarUrl: text("avatar_url"),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    points: integer("points").default(0).notNull(),
    originCity: varchar("origin_city", { length: 100 }), // User's departure city mentioned in conversation
    destinationCity: varchar("destination_city", { length: 100 }), // User's destination city mentioned in conversation
    budget: decimal("budget", { precision: 10, scale: 2 }), // User's budget for medical travel
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    phoneIdx: index("users_phone_idx").on(table.phone),
  })
);

// Hospitals Table
export const hospitals = pgTable(
  "hospitals",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameZh: varchar("name_zh", { length: 255 }),
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    level: varchar("level", { length: 50 }), // Grade 3A, Grade 3B, etc.
    specialties: jsonb("specialties"), // Array of specialty names
    location: varchar("location", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    imageUrl: text("image_url"),
    website: text("website"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    locationIdx: index("hospitals_location_idx").on(table.location),
    levelIdx: index("hospitals_level_idx").on(table.level),
  })
);

// Doctors Table
export const doctors = pgTable(
  "doctors",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    hospitalId: varchar("hospital_id", { length: 36 })
      .references(() => hospitals.id, { onDelete: "cascade" })
      .notNull(),
    nameEn: varchar("name_en", { length: 128 }).notNull(),
    nameZh: varchar("name_zh", { length: 128 }),
    title: varchar("title", { length: 100 }), // Professor, Associate Professor, etc.
    gender: genderEnum("gender"), // male, female, other
    specialtiesEn: text("specialties_en").notNull(), // JSON array of specialties
    specialtiesZh: text("specialties_zh"),
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    experienceYears: integer("experience_years"),
    imageUrl: text("image_url"),
    consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    hospitalIdIdx: index("doctors_hospital_id_idx").on(table.hospitalId),
  })
);

// Diseases Table
export const diseases = pgTable(
  "diseases",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameZh: varchar("name_zh", { length: 255 }),
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    category: varchar("category", { length: 100 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }
);

// Flights Table
export const flights = pgTable(
  "flights",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    flightNumber: varchar("flight_number", { length: 20 }).notNull(),
    airline: varchar("airline", { length: 100 }).notNull(),
    origin: varchar("origin", { length: 10 }).notNull(), // Airport code (e.g., PEK, JFK)
    destination: varchar("destination", { length: 10 }).notNull(), // Airport code
    departureTime: timestamp("departure_time", { withTimezone: true }).notNull(),
    arrivalTime: timestamp("arrival_time", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    availableSeats: integer("available_seats").notNull(),
    classType: varchar("class_type", { length: 20 }).notNull(), // economy, business, first
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    originDestIdx: index("flights_origin_dest_idx").on(table.origin, table.destination),
    airlineIdx: index("flights_airline_idx").on(table.airline),
    departureTimeIdx: index("flights_departure_time_idx").on(table.departureTime),
  })
);

export type Flight = typeof flights.$inferSelect;

// Hotels Table
export const hotels = pgTable(
  "hotels",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameZh: varchar("name_zh", { length: 255 }),
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    location: varchar("location", { length: 255 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    city: varchar("city", { length: 100 }).notNull(),
    starRating: integer("star_rating"), // 1-5 stars
    roomTypes: jsonb("room_types"), // Array of {type, price, available}
    amenities: jsonb("amenities"), // Array of amenity names
    imageUrl: text("image_url"),
    website: text("website"),
    distanceToHospital: decimal("distance_to_hospital", { precision: 10, scale: 2 }), // km
    basePricePerNight: decimal("base_price_per_night", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    cityIdx: index("hotels_city_idx").on(table.city),
    starRatingIdx: index("hotels_star_rating_idx").on(table.starRating),
    locationIdx: index("hotels_location_idx").on(table.location),
  })
);

export type Hotel = typeof hotels.$inferSelect;

// Attractions Table
export const attractions = pgTable(
  "attractions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameZh: varchar("name_zh", { length: 255 }),
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    category: varchar("category", { length: 100 }), // e.g., Cultural, Historical, Natural, Entertainment
    location: varchar("location", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    imageUrl: text("image_url"),
    website: text("website"),
    openingHours: text("opening_hours"), // JSON string or text description
    averageDuration: varchar("average_duration", { length: 50 }), // e.g., "2-3 hours"
    ticketPrice: decimal("ticket_price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    rating: decimal("rating", { precision: 3, scale: 2 }), // 1.0-5.0
    isRecommendedForPatients: boolean("is_recommended_for_patients").default(false),
    distanceToHospital: decimal("distance_to_hospital", { precision: 10, scale: 2 }), // km
    tipsEn: text("tips_en"), // Tips for visitors
    tipsZh: text("tips_zh"),
    accessibilityFeatures: jsonb("accessibility_features"), // Array of features for disabled patients
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    cityIdx: index("attractions_city_idx").on(table.city),
    categoryIdx: index("attractions_category_idx").on(table.category),
    locationIdx: index("attractions_location_idx").on(table.location),
  })
);

export type Attraction = typeof attractions.$inferSelect;

// Medical Records Table
export const medicalRecords = pgTable(
  "medical_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    doctorId: varchar("doctor_id", { length: 36 })
      .references(() => doctors.id, { onDelete: "set null" }),
    diagnosis: text("diagnosis"),
    symptoms: text("symptoms"),
    medicalReportUrl: text("medical_report_url"), // MRI, CT scans, etc.
    aiAnalysisResult: text("ai_analysis_result"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("medical_records_user_id_idx").on(table.userId),
    doctorIdIdx: index("medical_records_doctor_id_idx").on(table.doctorId),
  })
);

// Orders Table
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    doctorId: varchar("doctor_id", { length: 36 })
      .references(() => doctors.id, { onDelete: "set null" }),
    hospitalId: varchar("hospital_id", { length: 36 })
      .references(() => hospitals.id, { onDelete: "set null" }),
    diseaseId: varchar("disease_id", { length: 36 })
      .references(() => diseases.id, { onDelete: "set null" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    doctorAppointmentStatus: doctorAppointmentStatusEnum("doctor_appointment_status").notNull().default("pending"),
    doctorAppointmentDate: timestamp("doctor_appointment_date", { withTimezone: true }),
    serviceReservationStatus: serviceReservationStatusEnum("service_reservation_status").notNull().default("pending"),
    medicalFee: decimal("medical_fee", { precision: 10, scale: 2 }),
    hotelFee: decimal("hotel_fee", { precision: 10, scale: 2 }),
    flightFee: decimal("flight_fee", { precision: 10, scale: 2 }),
    ticketFee: decimal("ticket_fee", { precision: 10, scale: 2 }),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
    serviceFeeRate: decimal("service_fee_rate", { precision: 5, scale: 4 }).notNull().default("0.05"),
    serviceFeeAmount: decimal("service_fee_amount", { precision: 10, scale: 2 }),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    travelNotes: text("travel_notes"), // Travel tips and warnings
    weatherForecast: jsonb("weather_forecast"), // Weather data for each stage
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    doctorIdIdx: index("orders_doctor_id_idx").on(table.doctorId),
    statusIdx: index("orders_status_idx").on(table.status),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  })
);

// Itineraries Table
export const itineraries = pgTable(
  "itineraries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: varchar("order_id", { length: 36 })
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    type: serviceTypeEnum("type").notNull(), // flight, train, hotel, car_rental, ticket, visa, insurance
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    location: varchar("location", { length: 255 }),
    price: decimal("price", { precision: 10, scale: 2 }),
    bookingConfirmation: text("booking_confirmation"),
    status: serviceReservationStatusEnum("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
    notificationSent: boolean("notification_sent").default(false).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    orderIdIdx: index("itineraries_order_id_idx").on(table.orderId),
    typeIdx: index("itineraries_type_idx").on(table.type),
  })
);

// Service Fees Table (中介费率配置表)
export const serviceFees = pgTable(
  "service_fees",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: serviceFeeTypeEnum("type").notNull().unique(), // medical, flight, hotel, ticket, general
    rate: decimal("rate", { precision: 5, scale: 4 }).notNull(), // Fee rate (e.g., 0.05 for 5%)
    minFee: decimal("min_fee", { precision: 10, scale: 2 }), // Minimum fee amount
    maxFee: decimal("max_fee", { precision: 10, scale: 2 }), // Maximum fee amount
    descriptionEn: text("description_en"),
    descriptionZh: text("description_zh"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    typeIdx: index("service_fees_type_idx").on(table.type),
  })
);

export type ServiceFee = typeof serviceFees.$inferSelect;

// Service Reservations Table (服务预订表)
export const serviceReservations = pgTable(
  "service_reservations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: varchar("order_id", { length: 36 })
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    itineraryId: varchar("itinerary_id", { length: 36 })
      .references(() => itineraries.id, { onDelete: "set null" }),
    type: serviceTypeEnum("type").notNull(), // flight, train, hotel, car_rental, ticket, visa, insurance
    providerName: varchar("provider_name", { length: 255 }), // Service provider name
    providerReference: varchar("provider_reference", { length: 255 }), // Booking reference from provider
    status: serviceReservationStatusEnum("status").notNull().default("pending"),
    reservationDate: timestamp("reservation_date", { withTimezone: true }), // When the reservation was made
    confirmationDate: timestamp("confirmation_date", { withTimezone: true }), // When the reservation was confirmed
    cancellationDate: timestamp("cancellation_date", { withTimezone: true }),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    details: jsonb("details"), // Detailed reservation data
    remarks: text("remarks"),
    notificationSent: boolean("notification_sent").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    orderIdIdx: index("service_reservations_order_id_idx").on(table.orderId),
    itineraryIdIdx: index("service_reservations_itinerary_id_idx").on(table.itineraryId),
    typeIdx: index("service_reservations_type_idx").on(table.type),
    statusIdx: index("service_reservations_status_idx").on(table.status),
  })
);

export type ServiceReservation = typeof serviceReservations.$inferSelect;

// Payments Table
export const payments = pgTable(
  "payments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: varchar("order_id", { length: 36 })
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // stripe, paypal, wechat, alipay
    paymentIntentId: varchar("payment_intent_id", { length: 255 }), // Stripe/PayPal payment ID
    status: paymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    orderIdIdx: index("payments_order_id_idx").on(table.orderId),
    userIdIdx: index("payments_user_id_idx").on(table.userId),
    paymentIntentIdIdx: index("payments_payment_intent_id_idx").on(table.paymentIntentId),
    statusIdx: index("payments_status_idx").on(table.status),
  })
);

// Community Posts Table
export const communityPosts = pgTable(
  "community_posts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    orderId: varchar("order_id", { length: 36 })
      .references(() => orders.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    language: languageEnum("language").notNull().default("en"),
    images: jsonb("images"), // Array of image URLs
    likesCount: integer("likes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    status: postStatusEnum("status").notNull().default("published"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("community_posts_user_id_idx").on(table.userId),
    orderIdIdx: index("community_posts_order_id_idx").on(table.orderId),
    statusIdx: index("community_posts_status_idx").on(table.status),
    createdAtIdx: index("community_posts_created_at_idx").on(table.createdAt),
  })
);

// Comments Table
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: varchar("post_id", { length: 36 })
      .references(() => communityPosts.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    parentId: varchar("parent_id", { length: 36 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    postIdIdx: index("comments_post_id_idx").on(table.postId),
    userIdIdx: index("comments_user_id_idx").on(table.userId),
    parentIdIdx: index("comments_parent_id_idx").on(table.parentId),
  })
);

// Likes Table
export const likes = pgTable(
  "likes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: varchar("post_id", { length: 36 })
      .references(() => communityPosts.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdIdx: index("likes_post_id_idx").on(table.postId),
    userIdIdx: index("likes_user_id_idx").on(table.userId),
    uniquePostUser: index("likes_unique_post_user").on(table.postId, table.userId),
  })
);

// Settings Table (System-wide settings)
export const settings = pgTable(
  "settings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    key: varchar("key", { length: 100 }).notNull().unique(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    keyIdx: index("settings_key_idx").on(table.key),
  })
);

// Payment Accounts Table (收款账户表)
export const paymentAccounts = pgTable(
  "payment_accounts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 50 }).notNull(), // stripe, paypal, bank_transfer, wechat, alipay
    accountName: varchar("account_name", { length: 255 }).notNull(), // 账户名称
    accountNumber: varchar("account_number", { length: 255 }).notNull(), // 账号
    bankName: varchar("bank_name", { length: 255 }), // 银行名称（如果是银行转账）
    currency: varchar("currency", { length: 3 }).notNull().default("USD"), // 货币
    isActive: boolean("is_active").default(true).notNull(), // 是否启用
    isDefault: boolean("is_default").default(false).notNull(), // 是否默认账户
    apiKey: text("api_key"), // API密钥（如Stripe密钥）
    apiSecret: text("api_secret"), // API密钥（加密存储）
    webhookUrl: text("webhook_url"), // Webhook URL
    metadata: jsonb("metadata"), // 其他配置信息
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    typeIdx: index("payment_accounts_type_idx").on(table.type),
    isActiveIdx: index("payment_accounts_is_active_idx").on(table.isActive),
  })
);

export type PaymentAccount = typeof paymentAccounts.$inferSelect;

// Banner Ads Table
export const banners = pgTable(
  "banners",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    imageUrl: text("image_url").notNull(),
    titleEn: varchar("title_en", { length: 255 }),
    titleZh: varchar("title_zh", { length: 255 }),
    linkUrl: text("link_url"),
    order: integer("order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }
);

// AI Conversation History Table
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    messages: jsonb("messages").notNull(), // Array of {role, content} objects
    medicalRecordId: varchar("medical_record_id", { length: 36 })
      .references(() => medicalRecords.id, { onDelete: "set null" }),
    summary: text("summary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("ai_conversations_user_id_idx").on(table.userId),
    createdAtIdx: index("ai_conversations_created_at_idx").on(table.createdAt),
  })
);

// Zod Schemas with date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// User schemas
export const insertUserSchema = createCoercedInsertSchema(users).pick({
  email: true,
  phone: true,
  password: true,
  name: true,
  passportNumber: true,
  passportCountry: true,
  preferredLanguage: true,
  role: true,
  avatarUrl: true,
});

export const updateUserSchema = createCoercedInsertSchema(users)
  .pick({
    email: true,
    phone: true,
    name: true,
    passportNumber: true,
    passportCountry: true,
    preferredLanguage: true,
    avatarUrl: true,
    isBlocked: true,
    points: true,
  })
  .partial();

// Hospital schemas
export const insertHospitalSchema = createCoercedInsertSchema(hospitals).pick({
  nameEn: true,
  nameZh: true,
  descriptionEn: true,
  descriptionZh: true,
  level: true,
  specialties: true,
  location: true,
  latitude: true,
  longitude: true,
  imageUrl: true,
  website: true,
  isFeatured: true,
  isActive: true,
});

export const updateHospitalSchema = createCoercedInsertSchema(hospitals)
  .pick({
    nameEn: true,
    nameZh: true,
    descriptionEn: true,
    descriptionZh: true,
    level: true,
    specialties: true,
    location: true,
    latitude: true,
    longitude: true,
    imageUrl: true,
    website: true,
    isFeatured: true,
    isActive: true,
  })
  .partial();

// Doctor schemas
export const insertDoctorSchema = createCoercedInsertSchema(doctors).pick({
  hospitalId: true,
  nameEn: true,
  nameZh: true,
  title: true,
  specialtiesEn: true,
  specialtiesZh: true,
  descriptionEn: true,
  descriptionZh: true,
  experienceYears: true,
  imageUrl: true,
  consultationFee: true,
  isFeatured: true,
  isActive: true,
});

export const updateDoctorSchema = createCoercedInsertSchema(doctors)
  .pick({
    hospitalId: true,
    nameEn: true,
    nameZh: true,
    title: true,
    specialtiesEn: true,
    specialtiesZh: true,
    descriptionEn: true,
    descriptionZh: true,
    experienceYears: true,
    imageUrl: true,
    consultationFee: true,
    isFeatured: true,
    isActive: true,
  })
  .partial();

// Order schemas
export const insertOrderSchema = createCoercedInsertSchema(orders).pick({
  userId: true,
  doctorId: true,
  hospitalId: true,
  diseaseId: true,
  medicalFee: true,
  hotelFee: true,
  flightFee: true,
  ticketFee: true,
  subtotal: true,
  serviceFeeRate: true,
  serviceFeeAmount: true,
  totalAmount: true,
  currency: true,
  notes: true,
});

export const updateOrderSchema = createCoercedInsertSchema(orders)
  .pick({
    doctorId: true,
    hospitalId: true,
    diseaseId: true,
    status: true,
    medicalFee: true,
    hotelFee: true,
    flightFee: true,
    ticketFee: true,
    subtotal: true,
    serviceFeeRate: true,
    serviceFeeAmount: true,
    totalAmount: true,
    notes: true,
  })
  .partial();

// Community Post schemas
export const insertCommunityPostSchema = createCoercedInsertSchema(communityPosts).pick({
  userId: true,
  orderId: true,
  title: true,
  content: true,
  language: true,
  images: true,
  status: true,
});

export const updateCommunityPostSchema = createCoercedInsertSchema(communityPosts)
  .pick({
    title: true,
    content: true,
    images: true,
    status: true,
  })
  .partial();

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type UpdateHospital = z.infer<typeof updateHospitalSchema>;

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type UpdateDoctor = z.infer<typeof updateDoctorSchema>;

export type Disease = typeof diseases.$inferSelect;

export type MedicalRecord = typeof medicalRecords.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;

export type Itinerary = typeof itineraries.$inferSelect;

export type Payment = typeof payments.$inferSelect;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type UpdateCommunityPost = z.infer<typeof updateCommunityPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type AIConversation = typeof aiConversations.$inferSelect;




