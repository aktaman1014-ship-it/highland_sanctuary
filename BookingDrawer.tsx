import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Users,
  X,
} from 'lucide-react';
import {
  addDaysIso,
  calculateBookingBreakdown,
  CheckoutDraft,
  diffDaysIso,
  formatInr,
  Sanctuary,
} from '../data/sanctuaries';
import {
  findNearestAvailableRange,
  formatShortDateLabel,
  getBookedDateSetForSanctuary,
  getMonthGridCells,
  rangeHasBookedNight,
} from '../utils/availability';
import { TranslationBundle, TRANSLATIONS } from '../data/translations';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface BookingDrawerProps {
  sanctuary: Sanctuary | null;
  isSaved: boolean;
  initialCheckIn: string;
  initialNights: number;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onReserveNow: (draft: CheckoutDraft) => void;
  onViewFullDetails: (sanctuary: Sanctuary) => void;
  labels?: TranslationBundle['booking'];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MIN_VIEW_YEAR = 2026;
const MIN_VIEW_MONTH = 10; // Nov 2026 (0-indexed)

function parseYearMonth(isoDate: string): { year: number; month: number } {
  const parts = isoDate.split('-').map(Number);
  if (parts.length === 3 && !parts.some(Number.isNaN)) {
    return { year: parts[0], month: parts[1] - 1 };
  }
  return { year: 2026, month: 11 };
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  sanctuary,
  isSaved,
  initialCheckIn,
  initialNights,
  onClose,
  onToggleSave,
  onReserveNow,
  onViewFullDetails,
  labels = TRANSLATIONS.en.booking,
}) => {
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(() =>
    addDaysIso(initialCheckIn, Math.max(1, initialNights))
  );
  const [selectingMode, setSelectingMode] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number>(() => parseYearMonth(initialCheckIn).year);
  const [viewMonth, setViewMonth] = useState<number>(() => parseYearMonth(initialCheckIn).month);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const bookedDates = useMemo(() => {
    if (!sanctuary) return new Set<string>();
    return getBookedDateSetForSanctuary(sanctuary.id);
  }, [sanctuary]);

  useEffect(() => {
    if (!sanctuary) return;
    const booked = getBookedDateSetForSanctuary(sanctuary.id);
    const availableRange = findNearestAvailableRange(
      initialCheckIn,
      Math.max(1, initialNights),
      booked
    );
    setCheckIn(availableRange.checkIn);
    setCheckOut(availableRange.checkOut);
    setSelectingMode('checkIn');
    setRangeError(null);
    const ym = parseYearMonth(availableRange.checkIn);
    setViewYear(ym.year);
    setViewMonth(ym.month);
    setAdults(Math.min(2, sanctuary.maxGuests));
    setChildren(0);
  }, [sanctuary, initialCheckIn, initialNights]);

  useEffect(() => {
    if (!sanctuary) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sanctuary, onClose]);

  const monthCells = useMemo(
    () => getMonthGridCells(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthStats = useMemo(() => {
    let totalDays = 0;
    let bookedCount = 0;
    for (const cell of monthCells) {
      if (!cell) continue;
      totalDays += 1;
      if (bookedDates.has(cell)) bookedCount += 1;
    }
    return {
      openCount: totalDays - bookedCount,
      bookedCount,
    };
  }, [monthCells, bookedDates]);

  if (!sanctuary) return null;

  const nights = diffDaysIso(checkIn, checkOut);
  const totalGuests = adults + children;
  const breakdown = calculateBookingBreakdown(sanctuary, nights, totalGuests, []);
  const currentRangeBlocked = rangeHasBookedNight(checkIn, checkOut, bookedDates);

  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const canGoPrevMonth =
    viewYear > MIN_VIEW_YEAR || (viewYear === MIN_VIEW_YEAR && viewMonth > MIN_VIEW_MONTH);

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dayIso: string) => {
    if (bookedDates.has(dayIso)) {
      setRangeError(`${formatShortDateLabel(dayIso)} is Fully Booked. Please pick an open date.`);
      return;
    }

    if (selectingMode === 'checkIn' || dayIso <= checkIn) {
      // Pick new check-in; auto-pick next available 1-night checkout if possible
      const candidateOut = addDaysIso(dayIso, 1);
      setCheckIn(dayIso);
      setCheckOut(candidateOut);
      setSelectingMode('checkOut');
      setRangeError(null);
      return;
    }

    // Selecting check-out after checkIn
    if (rangeHasBookedNight(checkIn, dayIso, bookedDates)) {
      setRangeError(
        'Selected dates include Fully Booked days in red. Pick an earlier check-out or choose a new check-in.'
      );
      return;
    }

    setCheckOut(dayIso);
    setSelectingMode('checkIn');
    setRangeError(null);
  };

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRangeBlocked) {
      setRangeError('Please select available dates without Fully Booked days.');
      return;
    }
    onReserveNow({
      sanctuary,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      selectedAddonIds: [],
      ...breakdown,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-ink/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-drawer-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-full bg-cream border-l border-oak pinterest-shadow overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Top Sticky Drawer Header */}
          <div className="sticky top-0 z-20 glass-warm border-b border-oak px-5 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-lake-deep truncate">
                {sanctuary.state} · {labels.sanctuaryBooking}
              </p>
              <h2
                id="booking-drawer-title"
                className="text-base font-bold text-slate-ink truncate"
              >
                {sanctuary.title}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onToggleSave(sanctuary.id)}
                aria-label={isSaved ? 'Remove from saved' : 'Save sanctuary'}
                className="w-9 h-9 rounded-full bg-sand border border-oak flex items-center justify-center hover:border-coral transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-4 h-4 ${isSaved ? 'fill-coral text-coral' : 'text-slate-ink'}`}
                />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close booking drawer"
                className="w-9 h-9 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-coral transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <form onSubmit={handleReserve} className="p-5 sm:p-6 space-y-5">
            {/* Sanctuary Photo + Title + Location + Host + Rating */}
            <div className="rounded-2xl overflow-hidden border border-oak bg-sand">
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <SanctuaryArtwork
                  theme={sanctuary.artworkTheme}
                  variant="photo"
                  photoUrl={sanctuary.photoUrl}
                  photoAlt={sanctuary.photoAlt}
                  className="w-full h-full"
                />
                <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
                  <span className="text-xs font-bold text-lake-deep tabular-nums">
                    {formatInr(sanctuary.pricePerNightInr)} {labels.perNight}
                  </span>
                </div>
                <div className="absolute top-3 right-3 glass-warm px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-coral text-coral" />
                  <span className="text-xs font-bold text-slate-ink tabular-nums">
                    {sanctuary.rating.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2.5 bg-cream">
                <h3 className="text-lg font-bold text-slate-ink leading-snug">
                  {sanctuary.title}
                </h3>
                <p className="text-xs font-medium text-slate-muted flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-lake shrink-0" />
                  <span>
                    {sanctuary.location}, {sanctuary.state}
                  </span>
                </p>

                <div className="pt-2.5 border-t border-oak flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full gradient-coral-peach text-slate-ink text-xs font-bold flex items-center justify-center shrink-0">
                      {sanctuary.host.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-ink truncate">
                        {labels.hostedBy} {sanctuary.host.name}
                      </p>
                      <p className="text-[11px] text-slate-subtle truncate">
                        {sanctuary.host.craft}
                      </p>
                    </div>
                  </div>
                  {sanctuary.host.verifiedEcoGuide && (
                    <ShieldCheck
                      className="w-4 h-4 text-lake shrink-0"
                      aria-label="Verified Eco-Guide"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Visual Monthly Availability Calendar Picker */}
            <div className="bg-sand rounded-2xl p-4 border border-oak space-y-3.5">
              {/* Selected Check-in / Check-out Readout Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectingMode('checkIn')}
                  className={`text-left rounded-xl p-2.5 border transition-colors cursor-pointer ${
                    selectingMode === 'checkIn'
                      ? 'bg-white border-coral ring-2 ring-coral/35'
                      : 'bg-cream border-oak hover:border-lake'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-lake-deep">
                    <Calendar className="w-3.5 h-3.5 text-lake" />
                    <span>{labels.checkIn}</span>
                  </span>
                  <span className="block text-xs sm:text-sm font-bold text-slate-ink tabular-nums mt-0.5">
                    {formatShortDateLabel(checkIn)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectingMode('checkOut')}
                  className={`text-left rounded-xl p-2.5 border transition-colors cursor-pointer ${
                    selectingMode === 'checkOut'
                      ? 'bg-white border-coral ring-2 ring-coral/35'
                      : 'bg-cream border-oak hover:border-lake'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-lake-deep">
                    <Calendar className="w-3.5 h-3.5 text-lake" />
                    <span>{labels.checkOut}</span>
                  </span>
                  <span className="block text-xs sm:text-sm font-bold text-slate-ink tabular-nums mt-0.5">
                    {formatShortDateLabel(checkOut)}
                  </span>
                </button>
              </div>

              {/* Month Navigation Header */}
              <div className="bg-cream rounded-xl border border-oak p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-ink">{monthLabel}</h4>
                    <p className="text-[11px] text-slate-subtle tabular-nums">
                      <span className="text-emerald-700 font-semibold">
                        {monthStats.openCount} {labels.availableCount}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-red-700 font-semibold">
                        {monthStats.bookedCount} {labels.bookedCount}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      disabled={!canGoPrevMonth}
                      aria-label="Previous month"
                      className="w-8 h-8 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-coral disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      aria-label="Next month"
                      className="w-8 h-8 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-coral cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {WEEKDAYS.map((wd) => (
                    <span
                      key={wd}
                      className="text-[11px] font-bold text-slate-subtle py-1"
                    >
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Availability for ${monthLabel}`}>
                  {monthCells.map((dayIso, idx) => {
                    if (!dayIso) {
                      return <div key={`empty-${idx}`} className="h-10" aria-hidden="true" />;
                    }

                    const dayNumber = Number(dayIso.slice(-2));
                    const isBooked = bookedDates.has(dayIso);
                    const isStart = dayIso === checkIn;
                    const isEnd = dayIso === checkOut;
                    const isInRange = dayIso > checkIn && dayIso < checkOut;

                    return (
                      <button
                        key={dayIso}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleDayClick(dayIso)}
                        title={
                          isBooked
                            ? `${formatShortDateLabel(dayIso)} — Fully Booked`
                            : isStart
                            ? 'Selected Check-in'
                            : isEnd
                            ? 'Selected Check-out'
                            : `${formatShortDateLabel(dayIso)} — Available`
                        }
                        aria-label={`${formatShortDateLabel(dayIso)}${
                          isBooked ? ', Fully Booked' : ', Available'
                        }`}
                        aria-pressed={isStart || isEnd || isInRange}
                        className={`relative h-10 rounded-xl border text-xs font-bold tabular-nums flex flex-col items-center justify-center transition-all ${
                          isBooked
                            ? 'bg-red-100 border-red-300 text-red-700 cursor-not-allowed'
                            : isStart || isEnd
                            ? 'bg-coral border-slate-ink/30 text-slate-ink shadow-xs cursor-pointer'
                            : isInRange
                            ? 'bg-coral-tint border-coral/50 text-slate-ink cursor-pointer'
                            : 'bg-white border-oak/80 text-slate-ink hover:border-coral hover:bg-coral-tint/40 cursor-pointer'
                        }`}
                      >
                        <span className={isBooked ? 'line-through leading-none' : 'leading-none'}>
                          {dayNumber}
                        </span>
                        {isBooked && (
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-red-700 leading-none mt-0.5">
                            Full
                          </span>
                        )}
                        {(isStart || isEnd) && !isBooked && (
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-slate-ink leading-none mt-0.5">
                            {isStart ? 'In' : 'Out'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Availability Legend */}
                <div className="pt-2 border-t border-oak flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-muted">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-coral border border-slate-ink/20 inline-block" />
                      <span>{labels.selected}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
                      <span className="text-red-700 font-bold">{labels.fullyBooked}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-white border border-oak inline-block" />
                      <span>{labels.available}</span>
                    </span>
                  </div>
                  <span className="text-lake-deep font-bold tabular-nums">
                    {nights} {nights === 1 ? labels.night : labels.nights}
                  </span>
                </div>
              </div>

              {(rangeError || currentRangeBlocked) && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {rangeError ??
                      'Your selected dates include Fully Booked nights in red. Choose an uninterrupted open range.'}
                  </span>
                </div>
              )}
            </div>

            {/* Guests: Adults & Children Counters */}
            <div className="bg-sand rounded-xl p-4 border border-oak space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-lake-deep flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-lake" />
                  <span>{labels.guests}</span>
                </span>
                <span className="text-slate-subtle tabular-nums">
                  {labels.maxGuests}: {sanctuary.maxGuests}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream rounded-xl p-3 border border-oak flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-ink">{labels.adults}</p>
                    <p className="text-[11px] text-slate-subtle">{labels.ages13}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdults((a) => Math.max(1, a - 1))}
                      aria-label="Decrease adults"
                      className="w-7 h-7 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-slate-ink tabular-nums w-4 text-center">
                      {adults}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdults((a) => (a + children < sanctuary.maxGuests ? a + 1 : a))
                      }
                      aria-label="Increase adults"
                      className="w-7 h-7 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-cream rounded-xl p-3 border border-oak flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-ink">{labels.children}</p>
                    <p className="text-[11px] text-slate-subtle">{labels.ages2to12}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChildren((c) => Math.max(0, c - 1))}
                      aria-label="Decrease children"
                      className="w-7 h-7 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-slate-ink tabular-nums w-4 text-center">
                      {children}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setChildren((c) => (adults + c < sanctuary.maxGuests ? c + 1 : c))
                      }
                      aria-label="Increase children"
                      className="w-7 h-7 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-sand rounded-2xl p-4 border border-oak space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-muted">
                <span>
                  {labels.basePrice} ({formatInr(sanctuary.pricePerNightInr)} × {nights}{' '}
                  {nights === 1 ? labels.night : labels.nights})
                </span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(breakdown.baseAmountInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>{labels.cleaningFee}</span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(breakdown.cleaningFeeInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>{labels.highlandFee}</span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(breakdown.highlandFeeInr)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2.5 border-t border-oak text-base font-bold text-slate-ink">
                <span>
                  {labels.totalFor} {nights} {nights === 1 ? labels.night : labels.nights}
                </span>
                <span className="text-lg text-slate-ink tabular-nums">
                  {formatInr(breakdown.totalInr)}
                </span>
              </div>
            </div>

            {/* Primary Reserve Now Button in Coral #FF8E8B */}
            <button
              type="submit"
              disabled={currentRangeBlocked}
              className="w-full py-3.5 px-6 rounded-full bg-coral hover:bg-coral-soft disabled:opacity-50 disabled:cursor-not-allowed text-slate-ink text-sm sm:text-base font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lake"
            >
              <span>{labels.reserveNow}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onViewFullDetails(sanctuary)}
              className="w-full py-2.5 px-4 rounded-full border border-oak bg-cream hover:border-lake text-lake-deep text-xs font-bold transition-colors cursor-pointer"
            >
              {labels.viewFullDetails}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
