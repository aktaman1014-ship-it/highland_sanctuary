import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatar: text('avatar').default('').notNull(),
  phone: text('phone').default('').notNull(),
  location: text('location').default('Assam').notNull(),
  isHost: boolean('is_host').default(false).notNull(),
  hostEarningsInr: integer('host_earnings_inr').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingRef: text('booking_ref').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  sanctuaryId: text('sanctuary_id').notNull(),
  sanctuaryTitle: text('sanctuary_title').notNull(),
  location: text('location').notNull(),
  state: text('state').notNull(),
  artworkTheme: text('artwork_theme').notNull(),
  photoUrl: text('photo_url').notNull(),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out'),
  nights: integer('nights').notNull(),
  guests: integer('guests').notNull(),
  adults: integer('adults').default(2).notNull(),
  children: integer('children').default(0).notNull(),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  selectedAddonIds: jsonb('selected_addon_ids').$type<string[]>().default([]).notNull(),
  totalInr: integer('total_inr').notNull(),
  paymentId: text('payment_id'),
  paymentMethod: text('payment_method'),
  status: text('status').default('Confirmed').notNull(),
  bookedAt: text('booked_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedSanctuaries = pgTable(
  'saved_sanctuaries',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    sanctuaryId: text('sanctuary_id').notNull(),
    savedAt: timestamp('saved_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('saved_user_sanctuary_idx').on(table.userId, table.sanctuaryId)]
);

export const aiItineraries = pgTable('ai_itineraries', {
  id: serial('id').primaryKey(),
  planRef: text('plan_ref').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  state: text('state').notNull(),
  daysCount: integer('days_count').notNull(),
  budgetLabel: text('budget_label').notNull(),
  totalInr: integer('total_inr').notNull(),
  breakdownText: text('breakdown_text').notNull(),
  daysJson: jsonb('days_json').$type<unknown[]>().default([]).notNull(),
  promptUsed: text('prompt_used').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  savedSanctuaries: many(savedSanctuaries),
  aiItineraries: many(aiItineraries),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));

export const savedSanctuariesRelations = relations(savedSanctuaries, ({ one }) => ({
  user: one(users, {
    fields: [savedSanctuaries.userId],
    references: [users.id],
  }),
}));

export const aiItinerariesRelations = relations(aiItineraries, ({ one }) => ({
  user: one(users, {
    fields: [aiItineraries.userId],
    references: [users.id],
  }),
}));
