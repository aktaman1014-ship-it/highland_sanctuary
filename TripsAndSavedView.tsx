import React from 'react';
import {
  ArrowRight,
  Calendar,
  Compass,
  Heart,
  MapPin,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { generateThreeDayItinerary } from '../data/itineraries';
import { addDaysIso, BookingRecord, formatInr, Sanctuary } from '../data/sanctuaries';
import { GeneratedItineraryPlan } from './AIChatbox';
import { SanctuaryArtwork } from './SanctuaryArtwork';
import { StayCard } from './StayCard';

interface SavedViewProps {
  sanctuaries: Sanctuary[];
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onSelectSanctuary: (sanctuary: Sanctuary) => void;
  onExplore: () => void;
  nights: number;
}

export const SavedView: React.FC<SavedViewProps> = ({
  sanctuaries,
  savedIds,
  onToggleSave,
  onSelectSanctuary,
  onExplore,
  nights,
}) => {
  const savedStays = sanctuaries.filter((s) => savedIds.includes(s.id));

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-lake-deep mb-1.5">
            Personal Shortlist
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-ink">Saved Sanctuaries</h1>
        </div>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex items-center gap-2 text-sm font-bold text-lake-deep hover:text-slate-ink cursor-pointer self-start sm:self-auto"
        >
          <span>Browse All 8 States</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {savedStays.length === 0 ? (
        <div className="bg-cream rounded-2xl border border-oak p-10 text-center max-w-lg mx-auto space-y-4 pinterest-shadow">
          <div className="w-12 h-12 rounded-full bg-coral-tint text-coral flex items-center justify-center mx-auto">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-ink">No saved sanctuaries yet</h2>
          <p className="text-sm text-slate-muted leading-relaxed">
            Tap the heart icon on any stay across Assam, Meghalaya, Arunachal, Nagaland, Sikkim,
            Manipur, Mizoram, or Tripura to build your shortlist.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="px-6 py-2.5 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold transition-all cursor-pointer"
          >
            Explore North East Stays
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedStays.map((stay) => (
            <StayCard
              key={stay.id}
              sanctuary={stay}
              isSaved={true}
              onToggleSave={onToggleSave}
              onSelect={onSelectSanctuary}
              nights={nights}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ItineraryViewProps {
  bookings: BookingRecord[];
  sanctuaries: Sanctuary[];
  savedAIItineraries: GeneratedItineraryPlan[];
  onRemoveAIItinerary: (planId: string) => void;
  onBookStateStays: (state: string) => void;
  onCancelBooking: (id: string) => void;
  onSelectSanctuary: (sanctuary: Sanctuary) => void;
  onExplore: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  bookings,
  sanctuaries,
  savedAIItineraries,
  onRemoveAIItinerary,
  onBookStateStays,
  onCancelBooking,
  onSelectSanctuary,
  onExplore,
}) => {
  const hasAnything = bookings.length > 0 || savedAIItineraries.length > 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wide text-lake-deep mb-1.5">
            Active Trail Passes & AI Trip Plans
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-ink">
            Your North East Itinerary
          </h1>
        </div>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex items-center gap-2 text-sm font-bold text-lake-deep hover:text-slate-ink cursor-pointer self-start sm:self-auto"
        >
          <span>Add Another Sanctuary</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {!hasAnything ? (
        <div className="bg-cream rounded-2xl border border-oak p-10 text-center max-w-lg mx-auto space-y-4 pinterest-shadow">
          <div className="w-12 h-12 rounded-full bg-lake-mist text-lake flex items-center justify-center mx-auto">
            <Compass className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-ink">Your itinerary is open</h2>
          <p className="text-sm text-slate-muted leading-relaxed">
            Reserve any stay across the eight North East states or use Highland AI in the
            bottom-right corner to generate and save a multi-day plan.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="px-6 py-2.5 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold transition-all cursor-pointer"
          >
            Discover Sanctuaries
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Saved AI Trip Plans */}
          {savedAIItineraries.length > 0 && (
            <section aria-label="Saved AI Itineraries" className="space-y-4">
              <h2 className="text-lg font-bold text-slate-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-coral" />
                <span>Saved Highland AI Plans ({savedAIItineraries.length})</span>
              </h2>
              <div className="space-y-5">
                {savedAIItineraries.map((plan) => (
                  <article
                    key={plan.id}
                    className="bg-cream rounded-2xl border border-oak pinterest-shadow p-5 md:p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-lake-deep">
                          {plan.state} · {plan.daysCount} Days · {plan.budgetLabel}
                        </p>
                        <h3 className="text-xl font-bold text-slate-ink mt-0.5">{plan.title}</h3>
                        <p className="text-xs text-slate-subtle mt-1">
                          Prompt: “{plan.promptUsed}”
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-subtle">Estimated Budget</p>
                        <p className="text-xl font-bold text-slate-ink tabular-nums">
                          {formatInr(plan.totalInr)}
                        </p>
                        <p className="text-xs text-lake-deep font-semibold">{plan.breakdownText}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plan.days.map((d) => (
                        <div
                          key={d.day}
                          className="bg-white rounded-xl border border-oak p-3.5 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lake-deep">
                              Day {d.day}: {d.place}
                            </span>
                            <span className="font-bold text-slate-ink tabular-nums">
                              {formatInr(d.costInr)}
                            </span>
                          </div>
                          <p className="text-slate-muted leading-relaxed">{d.activities}</p>
                          <p className="font-semibold text-slate-ink">{d.stayLabel}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-oak">
                      <button
                        type="button"
                        onClick={() => onBookStateStays(plan.state)}
                        className="px-5 py-2 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs font-bold transition-colors cursor-pointer"
                      >
                        Book {plan.state === 'Arunachal Pradesh' ? 'Arunachal' : plan.state} Stays
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveAIItinerary(plan.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-oak text-xs font-bold text-slate-muted hover:text-red-700 hover:border-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Plan</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {bookings.length > 0 && (
            <div className="space-y-5">
              {savedAIItineraries.length > 0 && (
                <h2 className="text-lg font-bold text-slate-ink">Confirmed Stay Bookings</h2>
              )}
          {bookings.map((booking) => {
            const matchedSanctuary = sanctuaries.find((s) => s.id === booking.sanctuaryId);
            const isCancelled = booking.status === 'Cancelled';
            const daysPlan =
              booking.itineraryDays && booking.itineraryDays.length > 0
                ? booking.itineraryDays
                : matchedSanctuary
                ? generateThreeDayItinerary(matchedSanctuary, booking.checkIn)
                : [];

            return (
              <article
                key={booking.id}
                className={`bg-cream rounded-2xl border border-oak pinterest-shadow overflow-hidden ${
                  isCancelled ? 'opacity-70' : ''
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12">
                  <div className="md:col-span-3 relative aspect-[4/3] md:aspect-auto min-h-[180px] bg-sand">
                    <SanctuaryArtwork
                      theme={booking.artworkTheme}
                      variant="photo"
                      photoUrl={booking.photoUrl}
                      photoAlt={booking.sanctuaryTitle}
                      className="w-full h-full"
                    />
                  </div>

                  <div className="md:col-span-9 p-5 md:p-6 flex flex-col justify-between gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-subtle tabular-nums">
                          Booking #{booking.id}
                          <span aria-hidden="true"> · </span>
                          <span className={isCancelled ? 'text-red-700' : 'text-lake-deep'}>
                            {booking.status}
                          </span>
                          {booking.paymentMethod && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span>{booking.paymentMethod}</span>
                            </>
                          )}
                        </p>
                        <h2 className="text-xl font-bold text-slate-ink mt-1">
                          {booking.sanctuaryTitle}
                        </h2>
                        <p className="text-xs text-slate-muted flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-lake" />
                          <span>
                            {booking.location}, {booking.state}
                          </span>
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-subtle">Total Paid</p>
                        <p className="text-xl font-bold text-slate-ink tabular-nums">
                          {formatInr(booking.totalInr)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-oak text-xs">
                      <div>
                        <span className="text-slate-subtle flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-lake" />
                          Dates
                        </span>
                        <span className="font-bold text-slate-ink tabular-nums block mt-0.5">
                          {booking.checkIn} →{' '}
                          {booking.checkOut ?? addDaysIso(booking.checkIn, booking.nights)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-subtle">Duration</span>
                        <span className="font-bold text-slate-ink tabular-nums block mt-0.5">
                          {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-subtle flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-lake" />
                          Party
                        </span>
                        <span className="font-bold text-slate-ink tabular-nums block mt-0.5">
                          {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-subtle">Lead Guest</span>
                        <span className="font-bold text-slate-ink block mt-0.5 truncate">
                          {booking.guestName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {matchedSanctuary && (
                        <button
                          type="button"
                          onClick={() => onSelectSanctuary(matchedSanctuary)}
                          className="text-xs font-bold text-lake-deep hover:text-slate-ink underline underline-offset-4 cursor-pointer"
                        >
                          Open Booking & Trail Details
                        </button>
                      )}

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(booking.id)}
                          className="px-4 py-1.5 rounded-full border border-oak text-xs font-bold text-slate-muted hover:text-red-700 hover:border-red-300 transition-colors cursor-pointer"
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-Generated 3-Day State Itinerary */}
                {!isCancelled && daysPlan.length > 0 && (
                  <div className="border-t border-oak bg-sand/70 p-5 md:p-6 space-y-3">
                    <p className="text-xs font-bold text-lake-deep flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-coral" />
                      <span>Auto-Generated 3-Day {booking.state} Itinerary</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {daysPlan.map((d) => (
                        <div
                          key={d.day}
                          className="bg-cream rounded-xl border border-oak p-4 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-lake-deep">Day 0{d.day}</span>
                            <span className="text-slate-subtle tabular-nums">{d.date}</span>
                          </div>
                          <p className="font-bold text-slate-ink">{d.title}</p>
                          <p className="text-slate-muted leading-relaxed">
                            <strong className="text-slate-ink">AM:</strong> {d.morning}
                          </p>
                          <p className="text-slate-muted leading-relaxed">
                            <strong className="text-slate-ink">PM:</strong> {d.afternoon}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

