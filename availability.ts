import { addDaysIso, diffDaysIso } from '../data/sanctuaries';
import { getAllConfirmedBookingsForSanctuary } from '../services/dataStore';

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function toIsoDate(year: number, monthZeroBased: number, day: number): string {
  const mm = String(monthZeroBased + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Generates deterministic peak occupancy blocks per sanctuary for upcoming months
 * and merges them with all live confirmed bookings stored in dataStore.
 */
export function getBookedDateSetForSanctuary(sanctuaryId: string): Set<string> {
  const booked = new Set<string>();
  const seed = hashString(sanctuaryId);

  // 1. Live confirmed bookings from seeded & newly booked user records
  const liveBookings = getAllConfirmedBookingsForSanctuary(sanctuaryId);
  for (const booking of liveBookings) {
    const nights = Math.max(1, booking.nights || 1);
    for (let i = 0; i < nights; i++) {
      booked.add(addDaysIso(booking.checkIn, i));
    }
  }

  // 2. Deterministic festival / peak weekend reservations across Nov 2026 - Jun 2027
  const months: [number, number][] = [
    [2026, 10], // Nov 2026
    [2026, 11], // Dec 2026
    [2027, 0],  // Jan 2027
    [2027, 1],  // Feb 2027
    [2027, 2],  // Mar 2027
    [2027, 3],  // Apr 2027
    [2027, 4],  // May 2027
    [2027, 5],  // Jun 2027
  ];

  months.forEach(([year, monthIdx], mOffset) => {
    const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    const blockStartA = 4 + ((seed + mOffset * 5) % 8); // day 4..11
    const blockStartB = 21 + ((seed + mOffset * 3) % 5); // day 21..25

    for (let len = 0; len < 2; len++) {
      const dA = blockStartA + len;
      if (dA <= daysInMonth) {
        booked.add(toIsoDate(year, monthIdx, dA));
      }
      const dB = blockStartB + len;
      if (dB <= daysInMonth) {
        booked.add(toIsoDate(year, monthIdx, dB));
      }
    }
  });

  return booked;
}

export function rangeHasBookedNight(
  checkInIso: string,
  checkOutIso: string,
  bookedDates: Set<string>
): boolean {
  const nights = diffDaysIso(checkInIso, checkOutIso);
  for (let i = 0; i < nights; i++) {
    if (bookedDates.has(addDaysIso(checkInIso, i))) {
      return true;
    }
  }
  return false;
}

export function findNearestAvailableRange(
  preferredCheckInIso: string,
  desiredNights: number,
  bookedDates: Set<string>
): { checkIn: string; checkOut: string } {
  const safeNights = Math.max(1, Math.min(14, desiredNights));
  for (let shift = 0; shift < 45; shift++) {
    const candidateStart = addDaysIso(preferredCheckInIso, shift);
    const candidateEnd = addDaysIso(candidateStart, safeNights);
    if (!rangeHasBookedNight(candidateStart, candidateEnd, bookedDates)) {
      return { checkIn: candidateStart, checkOut: candidateEnd };
    }
  }
  return {
    checkIn: preferredCheckInIso,
    checkOut: addDaysIso(preferredCheckInIso, safeNights),
  };
}

export function formatShortDateLabel(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getMonthGridCells(year: number, monthZeroBased: number): (string | null)[] {
  const firstDayWeekday = new Date(Date.UTC(year, monthZeroBased, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIsoDate(year, monthZeroBased, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}
