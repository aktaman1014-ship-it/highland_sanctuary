import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  CloudSun,
  Compass,
  Heart,
  MessageCircle,
  Minus,
  Mountain,
  Plus,
  ShieldCheck,
  Star,
  Sunrise,
  Users,
} from 'lucide-react';
import {
  addDaysIso,
  calculateBookingBreakdown,
  CheckoutDraft,
  diffDaysIso,
  formatInr,
  Sanctuary,
  SceneVariant,
} from '../data/sanctuaries';
import { UserProfile } from '../services/dataStore';
import { getHostConnectMessageCount, HostConnectModal } from './HostConnectModal';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface StayDetailViewProps {
  sanctuary: Sanctuary;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onBack: () => void;
  initialCheckIn: string;
  initialNights: number;
  currentUser?: UserProfile | null;
  onProceedToPayment: (draft: CheckoutDraft) => void;
}

export const StayDetailView: React.FC<StayDetailViewProps> = ({
  sanctuary,
  isSaved,
  onToggleSave,
  onBack,
  initialCheckIn,
  initialNights,
  currentUser,
  onProceedToPayment,
}) => {
  const [activeVariant, setActiveVariant] = useState<SceneVariant>('photo');
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(() =>
    addDaysIso(initialCheckIn, Math.max(1, initialNights))
  );
  const [adults, setAdults] = useState(Math.min(2, sanctuary.maxGuests));
  const [children, setChildren] = useState(0);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [hostConnectOpen, setHostConnectOpen] = useState(false);
  const [hostMsgCount, setHostMsgCount] = useState(() =>
    getHostConnectMessageCount(currentUser?.uid ?? 'guest', sanctuary.id)
  );

  useEffect(() => {
    setHostMsgCount(
      getHostConnectMessageCount(currentUser?.uid ?? 'guest', sanctuary.id)
    );
  }, [currentUser?.uid, sanctuary.id]);

  const activeScene =
    sanctuary.scenes.find((s) => s.variant === activeVariant) ?? sanctuary.scenes[0];

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const nights = diffDaysIso(checkIn, checkOut);
  const guests = adults + children;
  const breakdown = calculateBookingBreakdown(
    sanctuary,
    nights,
    guests,
    selectedAddonIds
  );

  const handleCheckInChange = (nextCheckIn: string) => {
    setCheckIn(nextCheckIn);
    if (nextCheckIn >= checkOut) {
      setCheckOut(addDaysIso(nextCheckIn, Math.max(1, nights)));
    }
  };

  const handleCheckOutChange = (nextCheckOut: string) => {
    if (nextCheckOut <= checkIn) {
      setCheckOut(addDaysIso(checkIn, 1));
    } else {
      setCheckOut(nextCheckOut);
    }
  };

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToPayment({
      sanctuary,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      selectedAddonIds,
      ...breakdown,
    });
  };

  const sceneLabel = (variant: SceneVariant) => {
    if (variant === 'photo') return 'Destination View';
    if (variant === 'interior') return 'Sanctuary Interior';
    return 'Trail Horizon';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 pb-28 lg:pb-14">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-lake-deep hover:text-slate-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Sanctuaries</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(sanctuary.id)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream border border-oak text-xs font-bold text-slate-ink hover:border-coral transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${isSaved ? 'fill-coral text-coral' : 'text-slate-ink'}`}
          />
          <span>{isSaved ? 'Saved Sanctuary' : 'Save Sanctuary'}</span>
        </button>
      </div>

      {/* Title & Unboxed Location Metadata */}
      <div className="mb-6 space-y-2">
        <p className="text-xs font-bold tracking-wide text-lake-deep">
          {sanctuary.state}
          <span aria-hidden="true"> · </span>
          <span>{sanctuary.highlights.join(' · ')}</span>
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-ink">
          {sanctuary.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-muted">
          <span className="inline-flex items-center gap-1 font-bold text-slate-ink tabular-nums">
            <Star className="w-4 h-4 fill-coral text-coral" />
            {sanctuary.rating.toFixed(2)} ({sanctuary.reviewCount} reviews)
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {sanctuary.location}, {sanctuary.state}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {sanctuary.elevationMeters.toLocaleString('en-IN')}m elevation
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Up to {sanctuary.maxGuests} guests · {sanctuary.bedrooms}{' '}
            {sanctuary.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
          </span>
        </div>
      </div>

      {/* Multi-Scene Visual Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-10">
        <div className="lg:col-span-3 relative aspect-[16/10] rounded-2xl overflow-hidden bg-cream border border-oak pinterest-shadow">
          <SanctuaryArtwork
            theme={sanctuary.artworkTheme}
            variant={activeVariant}
            photoUrl={sanctuary.photoUrl}
            photoAlt={sanctuary.photoAlt}
            className="w-full h-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 via-black/25 to-transparent"
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-white">{activeScene.caption}</p>
            <span className="glass-warm text-slate-ink text-xs font-bold px-3.5 py-1 rounded-full shrink-0">
              {sceneLabel(activeScene.variant)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
          {sanctuary.scenes.map((scene) => {
            const isCurrent = scene.variant === activeVariant;
            return (
              <button
                key={scene.variant}
                type="button"
                onClick={() => setActiveVariant(scene.variant)}
                className={`relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-full border-2 transition-all cursor-pointer text-left ${
                  isCurrent
                    ? 'border-coral ring-2 ring-coral/35'
                    : 'border-oak opacity-85 hover:opacity-100'
                }`}
              >
                <SanctuaryArtwork
                  theme={sanctuary.artworkTheme}
                  variant={scene.variant}
                  photoUrl={sanctuary.photoUrl}
                  photoAlt={sanctuary.photoAlt}
                  className="w-full h-full"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5">
                  <span className="text-xs font-bold text-white">
                    {sceneLabel(scene.variant)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Split + Sticky Booking Module */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-10 items-start">
        {/* Left Editorial & Host Column */}
        <div className="space-y-9">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-ink tracking-tight">
              The Sanctuary & Craft Architecture
            </h2>
            <p className="text-base text-slate-muted leading-relaxed">{sanctuary.summary}</p>
            <p className="text-sm text-slate-subtle leading-relaxed">
              {sanctuary.architectureNote}
            </p>
          </section>

          {/* Mountain Terrain Weather Strip */}
          <section
            aria-label="Mountain terrain conditions"
            className="bg-cream rounded-2xl p-5 border border-oak grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div>
              <p className="text-xs font-semibold text-lake-deep flex items-center gap-1.5 mb-1">
                <CloudSun className="w-4 h-4 text-lake" />
                <span>Terrain Temp</span>
              </p>
              <p className="text-lg font-bold text-slate-ink tabular-nums">
                {sanctuary.weather.tempC}°C
              </p>
              <p className="text-xs text-slate-muted">{sanctuary.weather.condition}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-lake-deep flex items-center gap-1.5 mb-1">
                <Compass className="w-4 h-4 text-lake" />
                <span>Visibility</span>
              </p>
              <p className="text-sm font-bold text-slate-ink">{sanctuary.weather.mistIndex}</p>
              <p className="text-xs text-slate-muted">{sanctuary.weather.trailStatus}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-lake-deep flex items-center gap-1.5 mb-1">
                <Mountain className="w-4 h-4 text-lake" />
                <span>Trail Circuit</span>
              </p>
              <p className="text-sm font-bold text-slate-ink tabular-nums">
                {sanctuary.trailDistanceKm} km
              </p>
              <p className="text-xs text-slate-muted">{sanctuary.trailDifficulty}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-lake-deep flex items-center gap-1.5 mb-1">
                <Sunrise className="w-4 h-4 text-coral" />
                <span>First Light</span>
              </p>
              <p className="text-sm font-bold text-slate-ink tabular-nums">
                {sanctuary.weather.sunrise}
              </p>
              <p className="text-xs text-slate-muted">Local solar dawn</p>
            </div>
          </section>

          {/* Host & Tribal Lineage Card */}
          <section className="bg-cream rounded-2xl p-6 border border-oak space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full gradient-coral-peach text-slate-ink flex items-center justify-center text-lg font-bold shrink-0">
                  {sanctuary.host.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-ink">{sanctuary.host.name}</h3>
                  <p className="text-xs font-medium text-slate-subtle">
                    {sanctuary.host.lineage}
                    <span aria-hidden="true"> · </span>
                    <span className="tabular-nums">{sanctuary.host.yearsHosting} yrs hosting</span>
                  </p>
                </div>
              </div>
              {sanctuary.host.verifiedEcoGuide && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-lake-deep bg-lake-mist px-3.5 py-1.5 rounded-full self-start sm:self-center">
                  <ShieldCheck className="w-4 h-4 text-lake" />
                  <span>Certified Eco-Guide</span>
                </div>
              )}
            </div>

            <blockquote
              className="text-base italic text-slate-ink leading-relaxed pt-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              "{sanctuary.host.quote}"
            </blockquote>

            <p className="text-sm text-slate-muted leading-relaxed">{sanctuary.host.bio}</p>

            <p className="text-xs text-slate-subtle pt-1">
              <span className="font-bold text-slate-ink">Craft & Tradition:</span>{' '}
              {sanctuary.host.craft}
              <span aria-hidden="true"> · </span>
              <span>Languages: {sanctuary.host.languages.join(', ')}</span>
            </p>

            <div className="pt-3 border-t border-oak flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-muted">
                Have questions for{' '}
                <span className="font-bold text-slate-ink">
                  {sanctuary.host.name.split(' ')[0]}
                </span>{' '}
                about{' '}
                <span className="font-semibold text-lake-deep tabular-nums">
                  {checkIn} – {checkOut}
                </span>
                ?
              </p>
              <button
                type="button"
                onClick={() => setHostConnectOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  Host Connect
                  {hostMsgCount > 0 ? ` (${hostMsgCount})` : ''}
                </span>
              </button>
            </div>
          </section>

          {/* Guided Trail Add-Ons */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-ink">
                Optional Guided Experiences
              </h2>
              <p className="text-sm text-slate-subtle mt-1">
                Hosted directly by {sanctuary.host.name} and local community guides.
              </p>
            </div>

            <div className="space-y-3">
              {sanctuary.addons.map((addon) => {
                const checked = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                      checked
                        ? 'bg-cream border-lake ring-2 ring-lake/20'
                        : 'bg-cream border-oak hover:border-lake-light'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? 'bg-lake border border-lake text-white'
                          : 'bg-sand border border-oak-deep'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-bold text-slate-ink">{addon.title}</span>
                        <span className="text-sm font-bold text-slate-ink tabular-nums">
                          {formatInr(addon.priceInr)} / guest
                        </span>
                      </div>
                      <p className="text-xs text-slate-subtle mt-1">
                        {addon.duration} · {addon.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Cultural Etiquette & Trail Notes */}
          <section className="pt-6 border-t border-oak space-y-3">
            <h2 className="text-xl font-bold text-slate-ink">
              Cultural Etiquette & Trail Stewardship
            </h2>
            <ul className="space-y-2.5">
              {sanctuary.etiquetteTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-muted">
                  <span className="text-xs font-bold text-lake-deep tabular-nums mt-0.5">
                    0{i + 1}.
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Sticky Booking Module */}
        <aside id="booking-panel" className="lg:sticky lg:top-24">
          <form
            onSubmit={handleReserve}
            noValidate
            className="bg-cream rounded-2xl p-6 border border-oak pinterest-shadow space-y-5"
          >
            <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-oak">
              <div>
                <span className="text-2xl font-bold text-slate-ink tabular-nums">
                  {formatInr(sanctuary.pricePerNightInr)}
                </span>
                <span className="text-sm text-slate-subtle"> / night</span>
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-bold text-slate-ink tabular-nums">
                <Star className="w-4 h-4 fill-coral text-coral" />
                <span>{sanctuary.rating.toFixed(2)}</span>
              </div>
            </div>

            {/* Check-in & Check-out Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sand rounded-xl p-3 border border-oak focus-within:border-lake transition-colors">
                <label
                  htmlFor="detail-checkin"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-lake-deep mb-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-lake" />
                  <span>Check-in</span>
                </label>
                <input
                  id="detail-checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-ink focus:outline-none tabular-nums"
                />
              </div>

              <div className="bg-sand rounded-xl p-3 border border-oak focus-within:border-lake transition-colors">
                <label
                  htmlFor="detail-checkout"
                  className="flex items-center gap-1.5 text-[11px] font-bold text-lake-deep mb-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-lake" />
                  <span>Check-out</span>
                </label>
                <input
                  id="detail-checkout"
                  type="date"
                  value={checkOut}
                  min={addDaysIso(checkIn, 1)}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-slate-ink focus:outline-none tabular-nums"
                />
              </div>

              {/* Adults Counter */}
              <div className="bg-sand rounded-xl p-3 border border-oak">
                <span className="flex items-center gap-1 text-[11px] font-bold text-lake-deep mb-1.5">
                  <Users className="w-3 h-3 text-lake" />
                  <span>Adults</span>
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAdults((a) => Math.max(1, a - 1))}
                    aria-label="Decrease adults"
                    className="w-7 h-7 rounded-full bg-white border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-ink tabular-nums">{adults}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAdults((a) => (a + children < sanctuary.maxGuests ? a + 1 : a))
                    }
                    aria-label="Increase adults"
                    className="w-7 h-7 rounded-full bg-white border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children Counter */}
              <div className="bg-sand rounded-xl p-3 border border-oak">
                <span className="block text-[11px] font-bold text-lake-deep mb-1.5">
                  Children
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setChildren((c) => Math.max(0, c - 1))}
                    aria-label="Decrease children"
                    className="w-7 h-7 rounded-full bg-white border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-slate-ink tabular-nums">{children}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setChildren((c) => (adults + c < sanctuary.maxGuests ? c + 1 : c))
                    }
                    aria-label="Increase children"
                    className="w-7 h-7 rounded-full bg-white border border-oak flex items-center justify-center text-slate-ink hover:border-lake cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="space-y-2 pt-2 border-t border-oak text-sm">
              <div className="flex justify-between text-slate-muted">
                <span>
                  Base price ({formatInr(sanctuary.pricePerNightInr)} × {nights}{' '}
                  {nights === 1 ? 'night' : 'nights'})
                </span>
                <span className="tabular-nums font-semibold text-slate-ink">
                  {formatInr(breakdown.baseAmountInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>Cleaning fee</span>
                <span className="tabular-nums font-semibold text-slate-ink">
                  {formatInr(breakdown.cleaningFeeInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>Highland fee (10%)</span>
                <span className="tabular-nums font-semibold text-slate-ink">
                  {formatInr(breakdown.highlandFeeInr)}
                </span>
              </div>
              {breakdown.addonsTotalInr > 0 && (
                <div className="flex justify-between text-slate-muted">
                  <span>
                    Guided experiences ({selectedAddonIds.length} × {guests}{' '}
                    {guests === 1 ? 'guest' : 'guests'})
                  </span>
                  <span className="tabular-nums font-semibold text-slate-ink">
                    {formatInr(breakdown.addonsTotalInr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-oak text-base font-bold text-slate-ink">
                <span>
                  Total for {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
                <span className="tabular-nums">{formatInr(breakdown.totalInr)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-sm font-bold transition-all shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lake"
            >
              Reserve Now
            </button>

            <button
              type="button"
              onClick={() => setHostConnectOpen(true)}
              className="w-full py-2.5 px-5 rounded-full bg-white hover:bg-sand border border-oak hover:border-lake text-slate-ink text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-lake" />
              <span>
                Host Connect · Message {sanctuary.host.name.split(' ')[0]}
                {hostMsgCount > 0 ? ` (${hostMsgCount})` : ''}
              </span>
            </button>

            <p className="text-[11px] text-center text-slate-subtle">
              Free rescheduling up to 7 days prior for mountain weather advisories.
            </p>
          </form>
        </aside>
      </div>

      {/* Compact Mobile Bottom Sticky Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-warm border-t border-oak px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-bold text-slate-ink tabular-nums">
            {formatInr(breakdown.totalInr)}
          </p>
          <p className="text-xs text-slate-subtle tabular-nums">
            {nights} {nights === 1 ? 'night' : 'nights'} · {guests}{' '}
            {guests === 1 ? 'guest' : 'guests'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReserve}
          className="px-5 py-2.5 rounded-full bg-coral text-slate-ink text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
        >
          Reserve Now
        </button>
      </div>

      <HostConnectModal
        isOpen={hostConnectOpen}
        onClose={() => setHostConnectOpen(false)}
        sanctuary={sanctuary}
        checkIn={checkIn}
        checkOut={checkOut}
        nights={nights}
        adults={adults}
        children={children}
        selectedAddonIds={selectedAddonIds}
        onCheckInChange={handleCheckInChange}
        onCheckOutChange={handleCheckOutChange}
        currentUser={currentUser}
        onMessagesChange={setHostMsgCount}
        onProceedToReserve={() =>
          onProceedToPayment({
            sanctuary,
            checkIn,
            checkOut,
            nights,
            adults,
            children,
            selectedAddonIds,
            ...breakdown,
          })
        }
      />
    </div>
  );
};
