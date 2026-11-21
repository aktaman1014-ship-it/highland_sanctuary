import { and, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { aiItineraries, bookings, savedSanctuaries, users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  defaults: { name?: string; email: string; avatar?: string }
) {
  try {
    const safeName = (defaults.name || 'Highland Traveler').trim().slice(0, 100);
    const safeEmail = defaults.email.trim().slice(0, 150);
    const safeAvatar = (defaults.avatar || '').slice(0, 250000);

    const result = await db
      .insert(users)
      .values({
        uid,
        name: safeName,
        email: safeEmail,
        avatar: safeAvatar,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: safeEmail,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Unable to synchronize user record.', { cause: error });
  }
}

export async function updateUserProfileSql(
  uid: string,
  input: {
    name: string;
    email: string;
    avatar: string;
    phone: string;
    location: string;
    isHost: boolean;
    hostEarningsInr: number;
  }
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        name: input.name.trim().slice(0, 100) || 'Highland Traveler',
        email: input.email.trim().slice(0, 150),
        avatar: input.avatar.slice(0, 250000),
        phone: input.phone.trim().slice(0, 30),
        location: input.location.trim().slice(0, 60) || 'Assam',
        isHost: Boolean(input.isHost),
        hostEarningsInr: Math.max(0, Math.round(input.hostEarningsInr || 0)),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          name: input.name.trim().slice(0, 100) || 'Highland Traveler',
          avatar: input.avatar.slice(0, 250000),
          phone: input.phone.trim().slice(0, 30),
          location: input.location.trim().slice(0, 60) || 'Assam',
          isHost: Boolean(input.isHost),
          hostEarningsInr: Math.max(0, Math.round(input.hostEarningsInr || 0)),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in updateUserProfileSql:', error);
    throw new Error('Unable to update profile.', { cause: error });
  }
}

export async function getUserSavedIdsSql(uid: string): Promise<string[]> {
  try {
    const rows = await db
      .select({ sanctuaryId: savedSanctuaries.sanctuaryId })
      .from(savedSanctuaries)
      .innerJoin(users, eq(savedSanctuaries.userId, users.id))
      .where(eq(users.uid, uid));
    return rows.map((r) => r.sanctuaryId);
  } catch (error) {
    console.error('Database query failed in getUserSavedIdsSql:', error);
    throw new Error('Unable to load saved stays.', { cause: error });
  }
}

export async function toggleSavedSql(
  uid: string,
  email: string,
  sanctuaryId: string,
  shouldSave: boolean
): Promise<void> {
  try {
    const userRow = await getOrCreateUser(uid, { email });
    if (shouldSave) {
      await db
        .insert(savedSanctuaries)
        .values({
          userId: userRow.id,
          sanctuaryId: sanctuaryId.slice(0, 80),
        })
        .onConflictDoNothing();
    } else {
      await db
        .delete(savedSanctuaries)
        .where(
          and(
            eq(savedSanctuaries.userId, userRow.id),
            eq(savedSanctuaries.sanctuaryId, sanctuaryId.slice(0, 80))
          )
        );
    }
  } catch (error) {
    console.error('Database query failed in toggleSavedSql:', error);
    throw new Error('Unable to update saved sanctuary.', { cause: error });
  }
}

export async function getUserBookingsSql(uid: string) {
  try {
    return await db
      .select({
        id: bookings.bookingRef,
        sanctuaryId: bookings.sanctuaryId,
        sanctuaryTitle: bookings.sanctuaryTitle,
        location: bookings.location,
        state: bookings.state,
        artworkTheme: bookings.artworkTheme,
        photoUrl: bookings.photoUrl,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        nights: bookings.nights,
        guests: bookings.guests,
        adults: bookings.adults,
        children: bookings.children,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        selectedAddonIds: bookings.selectedAddonIds,
        totalInr: bookings.totalInr,
        paymentId: bookings.paymentId,
        paymentMethod: bookings.paymentMethod,
        status: bookings.status,
        bookedAt: bookings.bookedAt,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(bookings.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserBookingsSql:', error);
    throw new Error('Unable to load bookings.', { cause: error });
  }
}

export async function createBookingSql(
  uid: string,
  email: string,
  input: {
    id: string;
    sanctuaryId: string;
    sanctuaryTitle: string;
    location: string;
    state: string;
    artworkTheme: string;
    photoUrl: string;
    checkIn: string;
    checkOut?: string;
    nights: number;
    guests: number;
    adults?: number;
    children?: number;
    guestName: string;
    guestEmail: string;
    selectedAddonIds: string[];
    totalInr: number;
    paymentId?: string;
    paymentMethod?: string;
    bookedAt: string;
  }
) {
  try {
    const userRow = await getOrCreateUser(uid, { email, name: input.guestName });
    const inserted = await db
      .insert(bookings)
      .values({
        bookingRef: input.id.slice(0, 64),
        userId: userRow.id,
        sanctuaryId: input.sanctuaryId.slice(0, 80),
        sanctuaryTitle: input.sanctuaryTitle.slice(0, 140),
        location: input.location.slice(0, 100),
        state: input.state.slice(0, 60),
        artworkTheme: input.artworkTheme.slice(0, 40),
        photoUrl: input.photoUrl.slice(0, 300),
        checkIn: input.checkIn.slice(0, 20),
        checkOut: input.checkOut ? input.checkOut.slice(0, 20) : null,
        nights: Math.max(1, Math.min(30, input.nights)),
        guests: Math.max(1, Math.min(12, input.guests)),
        adults: Math.max(1, Math.min(12, input.adults ?? input.guests)),
        children: Math.max(0, Math.min(10, input.children ?? 0)),
        guestName: input.guestName.slice(0, 100),
        guestEmail: input.guestEmail.slice(0, 150),
        selectedAddonIds: input.selectedAddonIds.slice(0, 10),
        totalInr: Math.max(0, Math.round(input.totalInr)),
        paymentId: input.paymentId ? input.paymentId.slice(0, 64) : null,
        paymentMethod: input.paymentMethod ? input.paymentMethod.slice(0, 40) : null,
        status: 'Confirmed',
        bookedAt: input.bookedAt.slice(0, 20),
      })
      .onConflictDoNothing()
      .returning();

    return inserted[0] ?? null;
  } catch (error) {
    console.error('Database query failed in createBookingSql:', error);
    throw new Error('Unable to save booking.', { cause: error });
  }
}

export async function cancelBookingSql(uid: string, bookingRef: string) {
  try {
    const [userRow] = await db.select().from(users).where(eq(users.uid, uid));
    if (!userRow) return null;

    const updated = await db
      .update(bookings)
      .set({ status: 'Cancelled' })
      .where(and(eq(bookings.userId, userRow.id), eq(bookings.bookingRef, bookingRef)))
      .returning();

    return updated[0] ?? null;
  } catch (error) {
    console.error('Database query failed in cancelBookingSql:', error);
    throw new Error('Unable to cancel booking.', { cause: error });
  }
}

export async function saveAiItinerarySql(
  uid: string,
  email: string,
  plan: {
    id: string;
    title: string;
    state: string;
    daysCount: number;
    budgetLabel: string;
    totalInr: number;
    breakdownText: string;
    days: unknown[];
    promptUsed: string;
  }
) {
  try {
    const userRow = await getOrCreateUser(uid, { email });
    const inserted = await db
      .insert(aiItineraries)
      .values({
        planRef: plan.id.slice(0, 80),
        userId: userRow.id,
        title: plan.title.slice(0, 140),
        state: plan.state.slice(0, 60),
        daysCount: Math.max(1, Math.min(30, plan.daysCount)),
        budgetLabel: plan.budgetLabel.slice(0, 60),
        totalInr: Math.max(0, Math.round(plan.totalInr)),
        breakdownText: plan.breakdownText.slice(0, 240),
        daysJson: plan.days,
        promptUsed: plan.promptUsed.slice(0, 400),
      })
      .onConflictDoNothing()
      .returning();

    return inserted[0] ?? null;
  } catch (error) {
    console.error('Database query failed in saveAiItinerarySql:', error);
    throw new Error('Unable to save itinerary.', { cause: error });
  }
}

export async function getUserItinerariesSql(uid: string) {
  try {
    const rows = await db
      .select({
        id: aiItineraries.planRef,
        title: aiItineraries.title,
        state: aiItineraries.state,
        daysCount: aiItineraries.daysCount,
        budgetLabel: aiItineraries.budgetLabel,
        totalInr: aiItineraries.totalInr,
        breakdownText: aiItineraries.breakdownText,
        days: aiItineraries.daysJson,
        promptUsed: aiItineraries.promptUsed,
        createdAt: aiItineraries.createdAt,
      })
      .from(aiItineraries)
      .innerJoin(users, eq(aiItineraries.userId, users.id))
      .where(eq(users.uid, uid))
      .orderBy(desc(aiItineraries.createdAt));

    return rows;
  } catch (error) {
    console.error('Database query failed in getUserItinerariesSql:', error);
    throw new Error('Unable to load itineraries.', { cause: error });
  }
}
