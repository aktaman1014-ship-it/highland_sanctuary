import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  CreditCard,
  Home,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { generateThreeDayItinerary } from '../data/itineraries';
import {
  BookingRecord,
  CheckoutDraft,
  formatInr,
  ItineraryDayPlan,
  PaymentMethod,
} from '../data/sanctuaries';
import { generateNextBookingId, UserProfile } from '../services/dataStore';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface PaymentViewProps {
  draft: CheckoutDraft;
  currentUser: UserProfile | null;
  onBack: () => void;
  onPaymentConfirmed: (booking: BookingRecord) => Promise<void>;
  onOpenProfileBookings: () => void;
  onOpenItinerary: () => void;
}

const CONFETTI_PIECES = [
  { x: -160, y: -90, rotate: -45, color: '#FF8E8B', delay: 0.02 },
  { x: -110, y: -130, rotate: 35, color: '#4A8FB7', delay: 0.06 },
  { x: -65, y: -110, rotate: 80, color: '#F7AFA6', delay: 0.04 },
  { x: -20, y: -145, rotate: -20, color: '#10B981', delay: 0.08 },
  { x: 25, y: -135, rotate: 55, color: '#FF8E8B', delay: 0.03 },
  { x: 75, y: -115, rotate: -65, color: '#7BB8D4', delay: 0.07 },
  { x: 120, y: -125, rotate: 40, color: '#D9C5A5', delay: 0.05 },
  { x: 165, y: -85, rotate: -30, color: '#4A8FB7', delay: 0.09 },
  { x: -140, y: 40, rotate: 70, color: '#10B981', delay: 0.1 },
  { x: 145, y: 45, rotate: -70, color: '#FF8E8B', delay: 0.1 },
  { x: -85, y: 75, rotate: 25, color: '#7BB8D4', delay: 0.12 },
  { x: 90, y: 70, rotate: -25, color: '#F7AFA6', delay: 0.11 },
];

const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'] as const;

const NET_BANKING_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Assam Gramin Vikash Bank',
  'Kotak Mahindra Bank',
] as const;

export const PaymentView: React.FC<PaymentViewProps> = ({
  draft,
  currentUser,
  onBack,
  onPaymentConfirmed,
  onOpenProfileBookings,
  onOpenItinerary,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('Google Pay');
  const [upiId, setUpiId] = useState<string>('traveler@okicici');

  const [cardNumber, setCardNumber] = useState<string>('4532 8810 2419 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/29');
  const [cardCvv, setCardCvv] = useState<string>('842');
  const [cardHolder, setCardHolder] = useState<string>(currentUser?.name || '');

  const [selectedBank, setSelectedBank] = useState<string>(NET_BANKING_BANKS[0]);

  const [guestName, setGuestName] = useState<string>(currentUser?.name || '');
  const [guestEmail, setGuestEmail] = useState<string>(currentUser?.email || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [generatedDays, setGeneratedDays] = useState<ItineraryDayPlan[]>([]);

  const totalGuests = draft.adults + draft.children;

  const qrCells = useMemo(() => {
    // Crisp deterministic decorative 9x9 QR matrix with corner finder squares
    const size = 9;
    const cells: boolean[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const isTopLeft = r < 3 && c < 3;
        const isTopRight = r < 3 && c >= size - 3;
        const isBottomLeft = r >= size - 3 && c < 3;
        if (isTopLeft || isTopRight || isBottomLeft) {
          const lr = r % 6;
          const lc = c % 6;
          cells.push(!(lr === 1 && lc === 1));
        } else {
          cells.push((r * 7 + c * 5 + draft.sanctuary.title.length) % 2 === 0);
        }
      }
    }
    return cells;
  }, [draft.sanctuary.title]);

  const handlePayAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = guestName.trim();
    const trimmedEmail = guestEmail.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter the primary traveler name for your trail pass.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address for receipt and itinerary delivery.');
      return;
    }

    if (paymentMethod === 'Card') {
      const digits = cardNumber.replace(/\s+/g, '');
      if (digits.length < 12 || cardExpiry.trim().length < 4 || cardCvv.trim().length < 3) {
        setErrorMsg('Please enter valid card details (card number, MM/YY, CVV).');
        return;
      }
    }

    setErrorMsg(null);
    setProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 700));

    const bookingId = generateNextBookingId();
    const paymentId = `pay_HS${Math.floor(100000 + Math.random() * 899999)}`;
    const itineraryDays = generateThreeDayItinerary(draft.sanctuary, draft.checkIn);

    const record: BookingRecord = {
      id: bookingId,
      sanctuaryId: draft.sanctuary.id,
      sanctuaryTitle: draft.sanctuary.title,
      location: draft.sanctuary.location,
      state: draft.sanctuary.state,
      artworkTheme: draft.sanctuary.artworkTheme,
      photoUrl: draft.sanctuary.photoUrl,
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      nights: draft.nights,
      guests: totalGuests,
      adults: draft.adults,
      children: draft.children,
      guestName: trimmedName,
      guestEmail: trimmedEmail,
      selectedAddonIds: draft.selectedAddonIds,
      baseAmountInr: draft.baseAmountInr,
      cleaningFeeInr: draft.cleaningFeeInr,
      highlandFeeInr: draft.highlandFeeInr,
      totalInr: draft.totalInr,
      paymentId,
      paymentMethod,
      itineraryDays,
      bookedAt: new Date().toISOString().slice(0, 10),
      status: 'Confirmed',
    };

    await onPaymentConfirmed(record);
    setGeneratedDays(itineraryDays);
    setConfirmedBooking(record);
    setProcessing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-[1040px] mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Success Hero Card with Confetti Burst */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-cream rounded-3xl border border-oak pinterest-shadow p-6 sm:p-10 text-center space-y-5"
        >
          {/* Confetti Particles */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2"
          >
            {CONFETTI_PIECES.map((piece, idx) => (
              <motion.span
                key={idx}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                animate={{
                  x: piece.x,
                  y: piece.y,
                  opacity: [1, 1, 0],
                  scale: [0.7, 1.15, 0.9],
                  rotate: piece.rotate,
                }}
                transition={{
                  duration: 1.45,
                  delay: piece.delay,
                  ease: 'easeOut',
                }}
                className="absolute block w-3 h-2 rounded-xs"
                style={{ backgroundColor: piece.color }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="w-9 h-9" />
          </motion.div>

          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wide text-emerald-800">
              Payment Confirmed · #{confirmedBooking.id}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-ink">
              Your {confirmedBooking.state} Sanctuary is Reserved
            </h1>
            <p className="text-sm text-slate-muted max-w-xl mx-auto">
              Confirmed for <strong>{confirmedBooking.guestName}</strong> ({confirmedBooking.checkIn}{' '}
              to {confirmedBooking.checkOut} · {confirmedBooking.nights} nights). Saved to Bookings,
              Cloud Sync, and Admin Analytics.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-sand rounded-2xl border border-oak p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left text-xs">
            <div>
              <span className="text-slate-subtle block">Booking ID</span>
              <span className="font-bold text-slate-ink tabular-nums">
                #{confirmedBooking.id}
              </span>
            </div>
            <div>
              <span className="text-slate-subtle block">Payment ID</span>
              <span className="font-bold text-lake-deep tabular-nums">
                {confirmedBooking.paymentId}
              </span>
            </div>
            <div>
              <span className="text-slate-subtle block">Method</span>
              <span className="font-bold text-slate-ink">{confirmedBooking.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-subtle block">Amount Paid</span>
              <span className="font-bold text-slate-ink tabular-nums">
                {formatInr(confirmedBooking.totalInr)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenItinerary}
              className="px-6 py-3 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-sm font-bold transition-colors cursor-pointer"
            >
              Open Full Itinerary
            </button>
            <button
              type="button"
              onClick={onOpenProfileBookings}
              className="px-6 py-3 rounded-full border border-lake bg-white hover:bg-lake-mist text-lake-deep text-sm font-bold transition-colors cursor-pointer"
            >
              View Bookings in Profile
            </button>
          </div>
        </motion.section>

        {/* Auto-Generated 3-Day State Itinerary */}
        <section className="bg-cream rounded-3xl border border-oak pinterest-shadow p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-oak">
            <div>
              <p className="text-xs font-bold text-lake-deep flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-coral" />
                <span>Auto-Generated {confirmedBooking.state} Expedition</span>
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-ink">
                Your 3-Day {confirmedBooking.state} Itinerary
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-subtle tabular-nums">
              Starts {confirmedBooking.checkIn}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {generatedDays.map((day) => (
              <div
                key={day.day}
                className="bg-sand rounded-2xl border border-oak p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-lake-deep">Day 0{day.day}</span>
                    <span className="text-slate-subtle tabular-nums">{day.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-ink leading-snug">{day.title}</h3>
                  <div className="space-y-2 text-xs text-slate-muted leading-relaxed">
                    <p>
                      <strong className="text-slate-ink">Morning:</strong> {day.morning}
                    </p>
                    <p>
                      <strong className="text-slate-ink">Afternoon:</strong> {day.afternoon}
                    </p>
                    <p>
                      <strong className="text-slate-ink">Evening:</strong> {day.evening}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-lake-deep hover:text-slate-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sanctuary</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-muted">
          <Lock className="w-3.5 h-3.5 text-lake" />
          <span>256-bit Encrypted Highland Checkout</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Booking Summary */}
        <section
          aria-label="Booking summary"
          className="lg:col-span-5 bg-cream rounded-3xl border border-oak pinterest-shadow overflow-hidden"
        >
          <div className="relative aspect-[16/9] bg-sand">
            <SanctuaryArtwork
              theme={draft.sanctuary.artworkTheme}
              variant="photo"
              photoUrl={draft.sanctuary.photoUrl}
              photoAlt={draft.sanctuary.photoAlt}
              className="w-full h-full"
            />
            <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
              <span className="text-xs font-bold text-lake-deep">{draft.sanctuary.state}</span>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-xl font-bold text-slate-ink leading-snug">
                  {draft.sanctuary.title}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-ink tabular-nums shrink-0 pt-1">
                  <Star className="w-3.5 h-3.5 fill-coral text-coral" />
                  {draft.sanctuary.rating.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-muted flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-lake shrink-0" />
                <span>
                  {draft.sanctuary.location}, {draft.sanctuary.state}
                </span>
              </p>
              <p className="text-xs text-slate-subtle">
                Hosted by <strong className="text-slate-ink">{draft.sanctuary.host.name}</strong>
              </p>
            </div>

            {/* Stay Dates & Guest Count */}
            <div className="grid grid-cols-2 gap-3 bg-sand rounded-2xl p-4 border border-oak text-xs">
              <div>
                <span className="text-slate-subtle flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-lake" />
                  Check-in
                </span>
                <span className="font-bold text-slate-ink tabular-nums block mt-0.5">
                  {draft.checkIn}
                </span>
              </div>
              <div>
                <span className="text-slate-subtle flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-lake" />
                  Check-out
                </span>
                <span className="font-bold text-slate-ink tabular-nums block mt-0.5">
                  {draft.checkOut}
                </span>
              </div>
              <div>
                <span className="text-slate-subtle block">Stay Duration</span>
                <span className="font-bold text-slate-ink tabular-nums">
                  {draft.nights} {draft.nights === 1 ? 'night' : 'nights'}
                </span>
              </div>
              <div>
                <span className="text-slate-subtle flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-lake" />
                  Guests
                </span>
                <span className="font-bold text-slate-ink tabular-nums">
                  {draft.adults} {draft.adults === 1 ? 'Adult' : 'Adults'}
                  {draft.children > 0
                    ? `, ${draft.children} ${draft.children === 1 ? 'Child' : 'Children'}`
                    : ''}
                </span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 pt-2 border-t border-oak text-sm">
              <div className="flex justify-between text-slate-muted">
                <span>
                  Base price ({formatInr(draft.sanctuary.pricePerNightInr)} × {draft.nights}n)
                </span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(draft.baseAmountInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>Cleaning fee</span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(draft.cleaningFeeInr)}
                </span>
              </div>
              <div className="flex justify-between text-slate-muted">
                <span>Highland fee (10%)</span>
                <span className="font-semibold text-slate-ink tabular-nums">
                  {formatInr(draft.highlandFeeInr)}
                </span>
              </div>
              {draft.addonsTotalInr > 0 && (
                <div className="flex justify-between text-slate-muted">
                  <span>Guided experiences ({draft.selectedAddonIds.length})</span>
                  <span className="font-semibold text-slate-ink tabular-nums">
                    {formatInr(draft.addonsTotalInr)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-oak text-base font-bold text-slate-ink">
                <span>Total Payable</span>
                <span className="text-xl text-lake-deep tabular-nums">
                  {formatInr(draft.totalInr)}
                </span>
              </div>
            </div>

            <div className="bg-lake-mist/60 rounded-xl p-3.5 border border-lake-light/40 flex items-start gap-2.5 text-xs text-slate-muted">
              <Compass className="w-4 h-4 text-lake shrink-0 mt-0.5" />
              <span>
                Includes an auto-generated <strong>3-Day {draft.sanctuary.state} Itinerary</strong>{' '}
                immediately after confirmation.
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Razorpay-Style Payment Gateway UI */}
        <section
          aria-label="Payment gateway"
          className="lg:col-span-7 bg-cream rounded-3xl border border-oak pinterest-shadow overflow-hidden"
        >
          {/* Razorpay-Inspired Merchant Header Bar */}
          <div className="bg-slate-ink text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl gradient-coral-peach text-slate-ink font-bold text-sm flex items-center justify-center shrink-0">
                HS
              </div>
              <div>
                <p className="text-sm font-bold">Highland Sanctuary Pay</p>
                <p className="text-xs text-white/75 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-coral" />
                  <span>Razorpay Trusted Business · North East India</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/70">Amount Payable</p>
              <p className="text-xl font-bold tabular-nums">{formatInr(draft.totalInr)}</p>
            </div>
          </div>

          <form onSubmit={handlePayAndConfirm} noValidate className="p-6 sm:p-8 space-y-6">
            {/* Traveler Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="pay-guest-name"
                  className="block text-xs font-bold text-slate-ink mb-1.5"
                >
                  Lead Traveler Name
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
                  <User className="w-4 h-4 text-lake shrink-0" />
                  <input
                    id="pay-guest-name"
                    type="text"
                    placeholder="Full name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="pay-guest-email"
                  className="block text-xs font-bold text-slate-ink mb-1.5"
                >
                  Receipt & Pass Email
                </label>
                <input
                  id="pay-guest-email"
                  type="email"
                  placeholder="you@domain.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-sand border border-oak text-sm font-medium text-slate-ink focus:border-lake focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-ink">Select Payment Method</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(
                  [
                    { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'Net Banking', label: 'Net Banking', icon: Building2 },
                    { id: 'Pay at Property', label: 'Pay at Property', icon: Home },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(opt.id);
                        setErrorMsg(null);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        active
                          ? 'bg-lake-mist border-lake ring-2 ring-lake/20 text-slate-ink'
                          : 'bg-sand border-oak text-slate-muted hover:border-lake-light'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-lake-deep' : 'text-lake'}`} />
                      <span className="text-xs font-bold whitespace-nowrap">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method-Specific Payment Panel */}
            {paymentMethod === 'UPI' && (
              <div className="bg-sand rounded-2xl border border-oak p-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-5 flex flex-col items-center gap-2">
                  <div className="bg-white p-3 rounded-2xl border border-oak pinterest-shadow">
                    <div
                      aria-label="UPI Scan and Pay QR Code"
                      className="grid grid-cols-9 gap-1 w-32 h-32"
                    >
                      {qrCells.map((filled, i) => (
                        <span
                          key={i}
                          className={`rounded-[2px] ${
                            filled ? 'bg-slate-ink' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-lake-deep tabular-nums">
                    UPI: highlandsanctuary@okaxis
                  </span>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <p className="text-xs font-bold text-slate-ink mb-2">
                      Instant Pay via UPI App
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {UPI_APPS.map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSelectedUpiApp(app)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            selectedUpiApp === app
                              ? 'bg-cream border-coral text-slate-ink ring-1 ring-coral'
                              : 'bg-cream/60 border-oak text-slate-muted hover:border-lake'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pay-upi-id"
                      className="block text-[11px] font-bold text-slate-subtle mb-1"
                    >
                      Or enter your UPI ID ({selectedUpiApp})
                    </label>
                    <input
                      id="pay-upi-id"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okaxis"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-oak text-xs font-semibold text-slate-ink focus:border-lake focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="bg-sand rounded-2xl border border-oak p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-ink">Visa · Mastercard · RuPay</span>
                  <span className="text-slate-subtle">Demo cards enabled</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="card-number"
                      className="block text-xs font-bold text-slate-ink mb-1"
                    >
                      Card Number
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 8810 2419 4242"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-oak text-sm font-semibold text-slate-ink tabular-nums focus:border-lake focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="card-expiry"
                        className="block text-xs font-bold text-slate-ink mb-1"
                      >
                        Expiry (MM/YY)
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="08/29"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-oak text-sm font-semibold text-slate-ink tabular-nums focus:border-lake focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="card-cvv"
                        className="block text-xs font-bold text-slate-ink mb-1"
                      >
                        CVV
                      </label>
                      <input
                        id="card-cvv"
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="842"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-oak text-sm font-semibold text-slate-ink tabular-nums focus:border-lake focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="card-holder"
                      className="block text-xs font-bold text-slate-ink mb-1"
                    >
                      Name on Card
                    </label>
                    <input
                      id="card-holder"
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Cardholder Name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-oak text-sm font-semibold text-slate-ink focus:border-lake focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'Net Banking' && (
              <div className="bg-sand rounded-2xl border border-oak p-5 space-y-3">
                <p className="text-xs font-bold text-slate-ink">Select Your Bank</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {NET_BANKING_BANKS.map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-bold transition-colors cursor-pointer ${
                        selectedBank === bank
                          ? 'bg-cream border-lake text-lake-deep ring-1 ring-lake'
                          : 'bg-white border-oak text-slate-ink hover:border-lake-light'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'Pay at Property' && (
              <div className="bg-sand rounded-2xl border border-oak p-5 space-y-2">
                <p className="text-sm font-bold text-slate-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-lake" />
                  <span>North East Host Trust Guarantee</span>
                </p>
                <p className="text-xs text-slate-muted leading-relaxed">
                  Reserve your dates immediately with ₹0 charged online today. Settle{' '}
                  <strong className="text-slate-ink tabular-nums">
                    {formatInr(draft.totalInr)}
                  </strong>{' '}
                  via cash or UPI directly with {draft.sanctuary.host.name} upon arrival in{' '}
                  {draft.sanctuary.state}.
                </p>
              </div>
            )}

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl"
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-4 px-6 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-sm sm:text-base font-bold transition-all shadow-sm cursor-pointer disabled:opacity-65 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>
                {processing
                  ? 'Confirming Payment...'
                  : paymentMethod === 'Pay at Property'
                  ? `Confirm Booking (${formatInr(draft.totalInr)} at Property)`
                  : `Pay ${formatInr(draft.totalInr)} & Confirm`}
              </span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
