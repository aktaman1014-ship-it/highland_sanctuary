import { auth } from '../firebase';
import { BookingRecord } from '../data/sanctuaries';
import { GeneratedItineraryPlan } from '../components/AIChatbox';
import type { UserProfile } from './dataStore';

async function getAuthHeaders(): Promise<Record<string, string> | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const idToken = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    };
  } catch {
    return null;
  }
}

export async function bootstrapSqlUser(): Promise<{
  savedIds: string[];
  bookings: BookingRecord[];
} | null> {
  const headers = await getAuthHeaders();
  if (!headers) return null;
  try {
    const res = await fetch('/api/sql/bootstrap', { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      savedIds: Array.isArray(data.savedIds) ? data.savedIds : [],
      bookings: Array.isArray(data.bookings) ? data.bookings : [],
    };
  } catch {
    return null;
  }
}

export async function syncProfileToSql(profile: UserProfile): Promise<void> {
  const headers = await getAuthHeaders();
  if (!headers) return;
  try {
    await fetch('/api/sql/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        phone: profile.phone,
        location: profile.location,
        isHost: profile.isHost,
        hostEarningsInr: profile.hostEarningsInr,
      }),
    });
  } catch {
    // silent cloud sql background sync
  }
}

export async function syncSavedToggleToSql(
  sanctuaryId: string,
  shouldSave: boolean
): Promise<void> {
  const headers = await getAuthHeaders();
  if (!headers) return;
  try {
    await fetch('/api/sql/saved', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sanctuaryId, shouldSave }),
    });
  } catch {
    // silent cloud sql background sync
  }
}

export async function syncBookingToSql(booking: BookingRecord): Promise<void> {
  const headers = await getAuthHeaders();
  if (!headers) return;
  try {
    await fetch('/api/sql/bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify({ booking }),
    });
  } catch {
    // silent cloud sql background sync
  }
}

export async function syncCancelBookingToSql(bookingRef: string): Promise<void> {
  const headers = await getAuthHeaders();
  if (!headers) return;
  try {
    await fetch(`/api/sql/bookings/${encodeURIComponent(bookingRef)}/cancel`, {
      method: 'PATCH',
      headers,
    });
  } catch {
    // silent cloud sql background sync
  }
}

export async function syncItineraryToSql(plan: GeneratedItineraryPlan): Promise<void> {
  const headers = await getAuthHeaders();
  if (!headers) return;
  try {
    await fetch('/api/sql/itineraries', {
      method: 'POST',
      headers,
      body: JSON.stringify({ plan }),
    });
  } catch {
    // silent cloud sql background sync
  }
}
