import { pgTable, text, serial, integer, timestamp, real, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Validation helpers
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be less than 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
  .refine(val => val.trim().length > 0, "Username cannot be empty or just spaces");

const passwordSchema = z.string()
  .min(6, "Password must be at least 6 characters")
  .refine(val => val.trim().length > 0, "Password cannot be empty or just spaces")
  .refine(val => !/^\s+$/.test(val), "Password cannot be only spaces");

const emailSchema = z.string()
  .email("Please enter a valid email address")
  .refine(val => val.trim().length > 0, "Email cannot be empty");

const instagramHandleSchema = z.string()
  .min(1, "Instagram handle is required")
  .max(30, "Instagram handle must be less than 30 characters")
  .regex(/^[a-zA-Z0-9._]+$/, "Instagram handle can only contain letters, numbers, dots, and underscores")
  .refine(val => val.trim().length > 0, "Instagram handle cannot be empty")
  .refine(val => !val.startsWith('.') && !val.endsWith('.'), "Instagram handle cannot start or end with a dot")
  .refine(val => !/\.\./.test(val), "Instagram handle cannot have consecutive dots");

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  instagramHandle: text("instagram_handle").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
}));

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  brands: many(brands),
}));

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  instagramHandle: text("instagram_handle").notNull().unique(),
  description: text("description"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandsRelations = relations(brands, ({ one, many }) => ({
  category: one(categories, {
    fields: [brands.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
}));

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  brandId: integer("brand_id").notNull().references(() => brands.id),
  rating: real("rating").notNull(),
  reviewText: text("review_text").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userBrandIdx: uniqueIndex("user_brand_idx").on(table.userId, table.brandId),
  };
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [reviews.brandId],
    references: [brands.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  instagramHandle: true,
}).extend({
  username: usernameSchema,
  password: passwordSchema,
  instagramHandle: instagramHandleSchema,
});

export const insertBrandSchema = createInsertSchema(brands).pick({
  name: true,
  instagramHandle: true,
  description: true,
  logoUrl: true,
  websiteUrl: true,
  categoryId: true,
}).extend({
  name: z.string().min(1, "Brand name is required").refine(val => val.trim().length > 0, "Brand name cannot be empty"),
  instagramHandle: instagramHandleSchema,
  description: z.string().optional().refine(val => !val || val.trim().length > 0, "Description cannot be just spaces"),
});

export const updateBrandStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  brandId: true,
  rating: true,
  reviewText: true,
  imageUrl: true,
}).extend({
  reviewText: z.string().min(10, "Review must be at least 10 characters").refine(val => val.trim().length > 0, "Review cannot be empty"),
  rating: z.number().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateBrandStatus = z.infer<typeof updateBrandStatusSchema>;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  message: true,
}).extend({
  name: z.string().min(1, "Name is required").refine(val => val.trim().length > 0, "Name cannot be empty"),
  email: emailSchema,
  message: z.string().min(10, "Message must be at least 10 characters").refine(val => val.trim().length > 0, "Message cannot be empty"),
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export type User = typeof users.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Category = typeof categories.$inferSelect;

// Extended review type that includes user Instagram handle
export type ReviewWithUser = Review & {
  userInstagramHandle: string;
};
