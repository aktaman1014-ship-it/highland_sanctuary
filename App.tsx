import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  RotateCcw,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AdminDashboardView } from './components/AdminDashboardView';
import {
  AIChatbox,
  GeneratedItineraryPlan,
  loadSavedAIItineraries,
  removeAIItineraryFromLocal,
} from './components/AIChatbox';
import { AuthModal } from './components/AuthModal';
import { BookingDrawer } from './components/BookingDrawer';
import { ExploreFilterBar } from './components/ExploreFilterBar';
import { HostsView } from './components/HostsView';
import { PaymentView } from './components/PaymentView';
import { ProfileSection, ProfileView } from './components/ProfileView';
import { SanctuaryArtwork } from './components/SanctuaryArtwork';
import { SearchDock } from './components/SearchDock';
import { StayCard } from './components/StayCard';
import { StayDetailView } from './components/StayDetailView';
import { TopBar, AppScreen } from './components/TopBar';
import { TrailMapView } from './components/TrailMapView';
import { ItineraryView, SavedView } from './components/TripsAndSavedView';
import { VoiceConciergeModal } from './components/VoiceConciergeModal';
import {
  addDaysIso,
  BookingRecord,
  calculateBookingBreakdown,
  CheckoutDraft,
  ExperienceCategory,
  SANCTUARIES,
  Sanctuary,
  STATE_SPOTLIGHTS,
} from './data/sanctuaries';
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  loadStoredLanguage,
  saveStoredLanguage,
  TRANSLATIONS,
} from './data/translations';
import { auth } from './firebase';
import {
  cancelBookingRecord,
  createBookingRecord,
  getActiveDemoUser,
  getLocalBookings,
  getLocalSavedIds,
  isAdminEmail,
  loadUserBookings,
  loadUserSavedIds,
  logoutDemoSession,
  saveLocalBookings,
  saveLocalSavedIds,
  syncFirebaseUserProfile,
  toggleSavedRecord,
  updateUserProfileRecord,
  UserProfile,
} from './services/dataStore';
import {
  DEFAULT_FILTER_STATE,
  describeActiveFilters,
  filterAndSortSanctuaries,
  FilterState,
  hasActiveFilters,
  MAX_PRICE_BOUND,
  MIN_PRICE_BOUND,
  ParsedSmartChip,
  parseFiltersFromUrl,
  parseSmartSearchQuery,
  serializeFiltersToUrl,
} from './utils/smartSearch';

const GUEST_UID = 'guest';
const CHECKOUT_DRAFT_KEY = 'hs_checkout_draft_v1';

function getScreenFromPath(): AppScreen {
  if (typeof window === 'undefined') return 'discover';
  if (window.location.pathname === '/profile') return 'profile';
  if (window.location.pathname === '/admin') return 'admin';
  if (window.location.pathname === '/payment') return 'payment';
  return 'discover';
}

function getDefaultCheckoutDraft(): CheckoutDraft {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CheckoutDraft;
      if (parsed?.sanctuary?.id) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  const fallbackStay = SANCTUARIES[0];
  const checkIn = '2026-12-18';
  const nights = 3;
  const breakdown = calculateBookingBreakdown(fallbackStay, nights, 2, []);
  return {
    sanctuary: fallbackStay,
    checkIn,
    checkOut: addDaysIso(checkIn, nights),
    nights,
    adults: 2,
    children: 0,
    selectedAddonIds: [],
    ...breakdown,
  };
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<AppScreen>(getScreenFromPath);
  const [selectedSanctuary, setSelectedSanctuary] = useState<Sanctuary>(SANCTUARIES[0]);
  const [drawerSanctuary, setDrawerSanctuary] = useState<Sanctuary | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft>(getDefaultCheckoutDraft);
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileSection>('profile');
  const [heroIndex, setHeroIndex] = useState<number>(1);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getActiveDemoUser());
  const [language, setLanguage] = useState<LanguageCode>(() => loadStoredLanguage());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [aiToast, setAiToast] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(() =>
    typeof window === 'undefined'
      ? DEFAULT_FILTER_STATE
      : parseFiltersFromUrl(window.location.search)
  );
  const [smartQuery, setSmartQuery] = useState<string>(() =>
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('q') || ''
  );
  const [activeAiChips, setActiveAiChips] = useState<ParsedSmartChip[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>('2026-12-18');
  const [nights, setNights] = useState<number>(3);

  const searchSelectRef = useRef<HTMLSelectElement | null>(null);
  const gridRef = useRef<HTMLElement | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const aiToastTimerRef = useRef<number | null>(null);

  const activeUid = currentUser?.uid ?? GUEST_UID;

  const [savedIds, setSavedIds] = useState<string[]>(() => getLocalSavedIds(activeUid));
  const [bookings, setBookings] = useState<BookingRecord[]>(() => getLocalBookings(activeUid));
  const [savedAIItineraries, setSavedAIItineraries] = useState<GeneratedItineraryPlan[]>(() =>
    loadSavedAIItineraries()
  );

  const showSyncedFeedback = (label: string) => {
    setSyncBanner(label);
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      setSyncBanner(null);
    }, 3200);
  };

  const showAiToastMessage = (message: string) => {
    setAiToast(message);
    if (aiToastTimerRef.current) {
      window.clearTimeout(aiToastTimerRef.current);
    }
    aiToastTimerRef.current = window.setTimeout(() => {
      setAiToast(null);
    }, 4200);
  };

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    saveStoredLanguage(code);
    const opt = LANGUAGE_OPTIONS.find((item) => item.code === code);
    if (opt) {
      showAiToastMessage(`${opt.nativeName} · ${opt.englishName}`);
    }
  };

  const handleAIItinerarySaved = () => {
    setSavedAIItineraries(loadSavedAIItineraries());
    showAiToastMessage('Itinerary saved to Itinerary page!');
  };

  const handleRemoveAIItinerary = (planId: string) => {
    setSavedAIItineraries(removeAIItineraryFromLocal(planId));
  };

  const handleBookStateStays = (stateName: string) => {
    setFilters({
      ...DEFAULT_FILTER_STATE,
      states: [stateName],
    });
    setSmartQuery('');
    setActiveAiChips([]);
    navigateTo('discover');
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveScreen(getScreenFromPath());
      if (window.location.pathname === '/') {
        const parsed = parseFiltersFromUrl(window.location.search);
        setFilters(parsed);
        setSmartQuery(parsed.locationQuery);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || activeScreen !== 'discover') return;
    const nextSearch = serializeFiltersToUrl(filters);
    const nextUrl = `/${nextSearch}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [filters, activeScreen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await syncFirebaseUserProfile(fbUser.uid, {
            name: fbUser.displayName || 'Highland Explorer',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || '',
          });
          setCurrentUser(profile);
          const [cloudSaved, cloudBookings] = await Promise.all([
            loadUserSavedIds(profile.uid),
            loadUserBookings(profile.uid),
          ]);
          setSavedIds(cloudSaved);
          setBookings(cloudBookings);
        } catch {
          // fallback to local storage seamlessly
        }
      } else {
        const demoUser = getActiveDemoUser();
        setCurrentUser(demoUser);
        const uid = demoUser?.uid ?? GUEST_UID;
        setSavedIds(getLocalSavedIds(uid));
        setBookings(getLocalBookings(uid));
      }
    });
    return () => unsub();
  }, []);

  const navigateTo = (screen: AppScreen) => {
    setActiveScreen(screen);
    if (typeof window !== 'undefined') {
      const targetUrl =
        screen === 'profile'
          ? '/profile'
          : screen === 'admin'
          ? '/admin'
          : screen === 'payment'
          ? '/payment'
          : `/${serializeFiltersToUrl(filters)}`;
      if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    setCurrentUser(profile);
    if (profile.authMode === 'firebase-google') {
      const [cloudSaved, cloudBookings] = await Promise.all([
        loadUserSavedIds(profile.uid),
        loadUserBookings(profile.uid),
      ]);
      setSavedIds(cloudSaved);
      setBookings(cloudBookings);
    } else {
      setSavedIds(getLocalSavedIds(profile.uid));
      setBookings(getLocalBookings(profile.uid));
    }
    showSyncedFeedback('Synced to Cloud');
    if (isAdminEmail(profile.email)) {
      navigateTo('admin');
    }
  };

  const handleLogout = async () => {
    logoutDemoSession();
    if (auth.currentUser) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setSavedIds(getLocalSavedIds(GUEST_UID));
    setBookings(getLocalBookings(GUEST_UID));
    navigateTo('discover');
  };

  const handleSelectSanctuary = (sanctuary: Sanctuary) => {
    setDrawerSanctuary(sanctuary);
  };

  const handleOpenFullDetail = (sanctuary: Sanctuary) => {
    setDrawerSanctuary(null);
    setSelectedSanctuary(sanctuary);
    navigateTo('detail');
  };

  const handleProceedToPayment = (draft: CheckoutDraft) => {
    setDrawerSanctuary(null);
    setCheckoutDraft(draft);
    try {
      sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage errors
    }
    navigateTo('payment');
  };

  const handleToggleSave = async (id: string) => {
    const shouldSave = !savedIds.includes(id);
    const nextIds = shouldSave ? [...savedIds, id] : savedIds.filter((item) => item !== id);
    setSavedIds(nextIds);
    saveLocalSavedIds(activeUid, nextIds);
    await toggleSavedRecord(
      activeUid,
      currentUser?.name ?? 'Guest Traveler',
      id,
      shouldSave,
      nextIds
    );
    showSyncedFeedback('Synced to Cloud');
  };

  const handleConfirmBooking = async (record: BookingRecord) => {
    const nextList = [record, ...bookings];
    setBookings(nextList);
    saveLocalBookings(activeUid, nextList);
    await createBookingRecord(activeUid, record, nextList);
    showSyncedFeedback('Synced to Cloud');
  };

  const handleCancelBooking = async (id: string) => {
    const nextList = bookings.map((item) =>
      item.id === id ? { ...item, status: 'Cancelled' as const } : item
    );
    setBookings(nextList);
    saveLocalBookings(activeUid, nextList);
    await cancelBookingRecord(activeUid, id, nextList);
    showSyncedFeedback('Synced to Cloud');
  };

  const handleUpdateProfile = async (next: UserProfile) => {
    setCurrentUser(next);
    await updateUserProfileRecord(next);
    showSyncedFeedback('Synced to Cloud');
  };

  const handleStateCardClick = (stateName: string) => {
    setFilters((prev) => ({
      ...prev,
      states: [stateName],
      category: 'All Stays',
    }));
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTER_STATE);
    setSmartQuery('');
    setActiveAiChips([]);
  };

  const handleRegionChange = (region: string) => {
    setFilters((prev) => ({
      ...prev,
      states: region === 'All 8 States' ? [] : [region],
    }));
  };

  const handleCategoryChange = (cat: ExperienceCategory) => {
    setFilters((prev) => ({ ...prev, category: cat }));
  };

  const handleInstantOnlyChange = (val: boolean) => {
    setFilters((prev) => ({ ...prev, instantOnly: val }));
  };

  const handleSmartQuerySubmit = (rawQuery: string) => {
    const trimmed = rawQuery.trim();
    setSmartQuery(trimmed);
    if (!trimmed) {
      setFilters(DEFAULT_FILTER_STATE);
      setActiveAiChips([]);
      return;
    }
    const { nextFilters, chips, appliedCount } = parseSmartSearchQuery(trimmed);
    setFilters(nextFilters);
    setActiveAiChips(chips);
    showAiToastMessage(
      `AI applied ${appliedCount} ${appliedCount === 1 ? 'filter' : 'filters'} ✨`
    );
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleRemoveAiChip = (chipKey: string) => {
    setActiveAiChips((prev) => prev.filter((c) => c.key !== chipKey));
    setFilters((prev) => {
      switch (chipKey) {
        case 'location':
          return { ...prev, locationQuery: '' };
        case 'states':
          return { ...prev, states: [] };
        case 'propertyTypes':
          return { ...prev, propertyTypes: [] };
        case 'amenities':
          return { ...prev, amenities: [] };
        case 'hostTypes':
          return { ...prev, hostTypes: [] };
        case 'price':
          return { ...prev, priceMin: MIN_PRICE_BOUND, priceMax: MAX_PRICE_BOUND };
        case 'rating':
          return { ...prev, minRating: null };
        case 'sort':
          return { ...prev, sortBy: 'recommended' };
        default:
          return prev;
      }
    });
  };

  const selectedRegion =
    filters.states.length === 1 ? filters.states[0] : 'All 8 States';

  const filteredSanctuaries = useMemo(
    () => filterAndSortSanctuaries(SANCTUARIES, filters, savedIds),
    [filters, savedIds]
  );

  const activeFilterSummaryParts = useMemo(
    () => describeActiveFilters(filters),
    [filters]
  );
  const filtersAreActive = useMemo(() => hasActiveFilters(filters), [filters]);

  const activeBookingsCount = bookings.filter((b) => b.status === 'Confirmed').length;
  const heroSpotlight = STATE_SPOTLIGHTS[heroIndex];
  const heroSanctuary =
    SANCTUARIES.find((s) => s.state === heroSpotlight.state) ?? SANCTUARIES[0];
  const isAdmin = isAdminEmail(currentUser?.email);
  const t = TRANSLATIONS[language];

  const syncStatusDescription =
    currentUser?.authMode === 'firebase-google'
      ? 'Connected to Cloud Firestore (users, bookings, saved) with offline localStorage mirror.'
      : 'Persisted in localStorage for instant testing + ready for Cloud Firestore sync via Google Sign-In.';

  return (
    <div className="min-h-screen flex flex-col bg-sand text-slate-ink">
      <TopBar
        activeScreen={activeScreen}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        savedCount={savedIds.length}
        tripsCount={activeBookingsCount}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {syncBanner && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-5 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold pinterest-shadow"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{syncBanner}</span>
        </div>
      )}

      {aiToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral border border-slate-ink/20 text-slate-ink text-xs sm:text-sm font-bold pinterest-shadow"
        >
          <Sparkles className="w-4 h-4 text-slate-ink" />
          <span>{aiToast}</span>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <VoiceConciergeModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />

      <BookingDrawer
        sanctuary={drawerSanctuary}
        isSaved={drawerSanctuary ? savedIds.includes(drawerSanctuary.id) : false}
        initialCheckIn={checkInDate}
        initialNights={nights}
        onClose={() => setDrawerSanctuary(null)}
        onToggleSave={handleToggleSave}
        onReserveNow={handleProceedToPayment}
        onViewFullDetails={handleOpenFullDetail}
        labels={t.booking}
      />

      <main className="flex-1">
        {activeScreen === 'discover' && (
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 pb-8 md:pb-12 space-y-10">
            {/* Sticky Explore Filter Bar right below header */}
            <ExploreFilterBar
              filters={filters}
              allStays={SANCTUARIES}
              resultCount={filteredSanctuaries.length}
              onChange={(updater) => {
                setFilters(updater);
                setActiveAiChips([]);
              }}
              onClearAll={resetFilters}
              labels={t.filters}
            />

            {/* Big Vibrant Hero Section */}
            <section className="relative rounded-3xl bg-cream border border-oak pinterest-shadow p-6 sm:p-8 lg:p-10 overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-coral/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-lake-light/25 blur-3xl"
              />

              <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-bold tracking-wide text-lake-deep">
                      Assam · Meghalaya · Arunachal · Nagaland · Sikkim · Manipur · Mizoram · Tripura
                    </p>
                    <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-slate-ink leading-[1.12]">
                      {t.hero.title}
                    </h1>
                    {t.hero.transliterationHint && (
                      <p className="text-xs sm:text-sm font-medium italic text-lake-deep/90">
                        {t.hero.transliterationHint}
                      </p>
                    )}
                    <p className="text-base sm:text-lg text-slate-muted leading-relaxed max-w-xl">
                      {t.hero.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <a
                      href="#sanctuary-grid"
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm sm:text-base font-bold transition-all shadow-sm whitespace-nowrap"
                    >
                      <span>{t.hero.ctaExplore}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => navigateTo('map')}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-lake bg-white/80 hover:bg-lake-mist text-lake-deep text-sm sm:text-base font-bold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-lake" />
                      <span>{t.hero.ctaAtlas}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoiceModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-oak bg-white hover:border-coral text-slate-ink text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <AudioLines className="w-4 h-4 text-coral" />
                      <span>{t.hero.ctaVoice}</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-oak grid grid-cols-3 gap-4 max-w-lg">
                    <div>
                      <p className="text-xl font-bold text-slate-ink tabular-nums">8 States</p>
                      <p className="text-xs text-slate-subtle">{t.hero.statStatesLabel}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-ink tabular-nums">4.94★</p>
                      <p className="text-xs text-slate-subtle">{t.hero.statRatingLabel}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-ink tabular-nums">42m–3,753m</p>
                      <p className="text-xs text-slate-subtle">{t.hero.statElevLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Right Vibrant Photo Showcase Carousel */}
                <div className="lg:col-span-6 relative min-h-[320px] lg:min-h-[430px] rounded-2xl overflow-hidden bg-sand border border-oak pinterest-shadow">
                  <img
                    src={heroSpotlight.imageUrl}
                    alt={heroSpotlight.imageAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                  />

                  <div className="absolute top-4 left-4 glass-warm px-3.5 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-lake-deep">
                      {heroSpotlight.state} · {heroSpotlight.accentLabel}
                    </span>
                  </div>

                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous destination photo"
                      onClick={() =>
                        setHeroIndex((prev) =>
                          prev === 0 ? STATE_SPOTLIGHTS.length - 1 : prev - 1
                        )
                      }
                      className="w-9 h-9 rounded-full glass-warm flex items-center justify-center text-slate-ink hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next destination photo"
                      onClick={() =>
                        setHeroIndex((prev) =>
                          prev === STATE_SPOTLIGHTS.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="w-9 h-9 rounded-full glass-warm flex items-center justify-center text-slate-ink hover:bg-white transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{heroSpotlight.highlights}</span>
                      </p>
                      <p className="text-base sm:text-lg font-bold text-white mt-0.5">
                        {heroSpotlight.tagline}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectSanctuary(heroSanctuary)}
                      className="px-4 py-2 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                    >
                      View {heroSpotlight.state} Stay
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <SearchDock
              selectedRegion={selectedRegion}
              onRegionChange={handleRegionChange}
              checkInDate={checkInDate}
              onCheckInDateChange={setCheckInDate}
              nights={nights}
              onNightsChange={setNights}
              selectedCategory={filters.category}
              onCategoryChange={handleCategoryChange}
              instantOnly={filters.instantOnly}
              onInstantOnlyChange={handleInstantOnlyChange}
              resultCount={filteredSanctuaries.length}
              smartQuery={smartQuery}
              onSmartQuerySubmit={handleSmartQuerySubmit}
              activeAiChips={activeAiChips}
              onRemoveAiChip={handleRemoveAiChip}
              onOpenVoiceConcierge={() => setVoiceModalOpen(true)}
              searchInputRef={searchSelectRef}
            />

            {/* All 8 States Photo Card Showcase */}
            <section aria-label="Explore by state" className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold tracking-wide text-lake-deep mb-1">
                    Destination Gallery
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-ink">
                    Explore All Eight North East States
                  </h2>
                </div>
                {filters.states.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, states: [] }))}
                    className="text-xs font-bold text-lake-deep hover:text-slate-ink underline underline-offset-4 cursor-pointer"
                  >
                    Show All 8 States
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STATE_SPOTLIGHTS.map((item) => {
                  const isActiveState = filters.states.includes(item.state);
                  return (
                    <button
                      key={item.state}
                      type="button"
                      onClick={() => handleStateCardClick(item.state)}
                      className={`group text-left bg-cream rounded-2xl border overflow-hidden pinterest-shadow hover:pinterest-shadow-hover transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col ${
                        isActiveState ? 'border-coral ring-2 ring-coral/40' : 'border-oak'
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
                        <img
                          src={item.imageUrl}
                          alt={item.imageAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
                          <span className="text-[11px] font-bold text-lake-deep">
                            {item.accentLabel}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="text-base font-bold text-slate-ink group-hover:text-lake-deep transition-colors">
                          {item.state}
                        </h3>
                        <p className="text-xs font-semibold text-lake-deep truncate">
                          {item.highlights}
                        </p>
                        <p className="text-xs text-slate-muted line-clamp-1 pt-0.5">
                          {item.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Featured Sanctuaries Grid */}
            <section id="sanctuary-grid" ref={gridRef} className="space-y-6 scroll-mt-32">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-ink">
                    {filters.states.length === 0
                      ? 'Curated Highland Sanctuaries'
                      : `${filters.states.map((s) => (s === 'Arunachal Pradesh' ? 'Arunachal' : s)).join(', ')} Sanctuaries`}
                  </h2>
                  <p className="text-sm text-slate-subtle mt-1">
                    Showing{' '}
                    <span className="font-bold text-slate-ink tabular-nums">
                      {filteredSanctuaries.length} of {SANCTUARIES.length} stays
                    </span>
                    {activeFilterSummaryParts.length > 0 && (
                      <span className="text-lake-deep font-semibold">
                        {' - '}
                        {activeFilterSummaryParts.join(' - ')}
                      </span>
                    )}
                  </p>
                </div>

                {filtersAreActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>

              {filteredSanctuaries.length === 0 ? (
                <div className="bg-cream rounded-2xl border border-oak p-10 text-center space-y-4 pinterest-shadow">
                  <p className="text-lg font-bold text-slate-ink">
                    No stays found - Try adjusting filters
                  </p>
                  <p className="text-sm text-slate-muted max-w-md mx-auto">
                    Widen your nightly budget, clear amenity constraints, or reset back to all
                    eight North East states.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-6 py-2.5 rounded-full gradient-coral-peach text-slate-ink text-sm font-bold hover:opacity-95 transition-all cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSanctuaries.map((sanctuary) => (
                    <StayCard
                      key={sanctuary.id}
                      sanctuary={sanctuary}
                      isSaved={savedIds.includes(sanctuary.id)}
                      onToggleSave={handleToggleSave}
                      onSelect={handleSelectSanctuary}
                      nights={nights}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Editorial Host Chronicle Band */}
            <section className="bg-cream rounded-3xl border border-oak pinterest-shadow overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-5 relative min-h-[260px] bg-sand">
                <SanctuaryArtwork
                  theme="manipur"
                  variant="photo"
                  photoUrl="/src/assets/images/manipur_loktak_lake_1795236949260.jpg"
                  photoAlt="Loktak Lake sunrise wooden canoe in Manipur"
                  className="w-full h-full"
                />
              </div>
              <div className="lg:col-span-7 p-7 md:p-10 flex flex-col justify-center space-y-4">
                <p className="text-xs font-bold tracking-wide text-lake-deep">
                  Community-Hosted Hospitality
                </p>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-ink">
                  Stewarded by Assamese, Khasi, Monpa, Angami, Lepcha, Meitei, Mizo & Tripuri hosts
                </h2>
                <p
                  className="text-base italic text-slate-ink leading-relaxed"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  "On Loktak, our islands drift gently with the breeze while the hills keep watch."
                </p>
                <p className="text-sm text-slate-muted leading-relaxed">
                  Every stay supports local weaving guilds, eco-conservation villages, and
                  certified mountain guides across all eight North East states.
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo('hosts')}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold transition-all cursor-pointer"
                  >
                    <span>Meet All 8 State Hosts</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('map')}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-lake text-lake-deep hover:bg-lake-mist text-sm font-bold transition-colors cursor-pointer"
                  >
                    <span>Explore Trail Atlas</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeScreen === 'detail' && (
          <StayDetailView
            sanctuary={selectedSanctuary}
            isSaved={savedIds.includes(selectedSanctuary.id)}
            onToggleSave={handleToggleSave}
            onBack={() => navigateTo('discover')}
            initialCheckIn={checkInDate}
            initialNights={nights}
            currentUser={currentUser}
            onProceedToPayment={handleProceedToPayment}
          />
        )}

        {activeScreen === 'payment' && (
          <PaymentView
            draft={checkoutDraft}
            currentUser={currentUser}
            onBack={() => handleOpenFullDetail(checkoutDraft.sanctuary)}
            onPaymentConfirmed={handleConfirmBooking}
            onOpenProfileBookings={() => {
              setProfileInitialTab('trips');
              if (currentUser) {
                navigateTo('profile');
              } else {
                setAuthModalOpen(true);
              }
            }}
            onOpenItinerary={() => navigateTo('itinerary')}
          />
        )}

        {activeScreen === 'map' && (
          <TrailMapView
            sanctuaries={SANCTUARIES}
            onSelectSanctuary={handleSelectSanctuary}
          />
        )}

        {activeScreen === 'hosts' && (
          <HostsView
            sanctuaries={SANCTUARIES}
            onSelectSanctuary={handleSelectSanctuary}
          />
        )}

        {activeScreen === 'saved' && (
          <SavedView
            sanctuaries={SANCTUARIES}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onSelectSanctuary={handleSelectSanctuary}
            onExplore={() => navigateTo('discover')}
            nights={nights}
          />
        )}

        {activeScreen === 'itinerary' && (
          <ItineraryView
            bookings={bookings}
            sanctuaries={SANCTUARIES}
            savedAIItineraries={savedAIItineraries}
            onRemoveAIItinerary={handleRemoveAIItinerary}
            onBookStateStays={handleBookStateStays}
            onCancelBooking={handleCancelBooking}
            onSelectSanctuary={handleSelectSanctuary}
            onExplore={() => navigateTo('discover')}
          />
        )}

        {activeScreen === 'profile' && (
          currentUser ? (
            <ProfileView
              user={currentUser}
              sanctuaries={SANCTUARIES}
              savedIds={savedIds}
              bookings={bookings}
              syncStatusText={syncStatusDescription}
              onUpdateProfile={handleUpdateProfile}
              onToggleSave={handleToggleSave}
              onSelectSanctuary={handleSelectSanctuary}
              onCancelBooking={handleCancelBooking}
              onLogout={handleLogout}
              onExplore={() => navigateTo('discover')}
              initialTab={profileInitialTab}
            />
          ) : (
            <div className="max-w-lg mx-auto px-4 py-16">
              <div className="bg-cream rounded-3xl border border-oak pinterest-shadow p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-coral-tint text-slate-ink flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-ink">Sign in to view your profile</h1>
                <p className="text-sm text-slate-muted leading-relaxed">
                  Access your saved sanctuaries, upcoming North East trips, host earnings, and
                  cloud sync settings.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-7 py-3 rounded-full gradient-coral-peach text-slate-ink text-sm font-bold cursor-pointer"
                >
                  Login or Sign Up
                </button>
              </div>
            </div>
          )
        )}

        {activeScreen === 'admin' && (
          isAdmin ? (
            <AdminDashboardView />
          ) : (
            <div className="max-w-lg mx-auto px-4 py-16">
              <div className="bg-cream rounded-3xl border border-oak pinterest-shadow p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-lake-mist text-lake-deep flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-ink">Admin Access Required</h1>
                <p className="text-sm text-slate-muted leading-relaxed">
                  Sign in with the head administrator account (<strong>admin@highland.com</strong>)
                  to view all users, revenue, live activity, and 8-state analytics.
                </p>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-7 py-3 rounded-full gradient-coral-peach text-slate-ink text-sm font-bold cursor-pointer"
                >
                  Admin Login
                </button>
              </div>
            </div>
          )
        )}
      </main>

      <footer className="border-t border-oak bg-cream mt-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-ink">Highland Sanctuary</p>
            <p className="text-xs text-slate-subtle">
              Assam · Meghalaya · Arunachal Pradesh · Nagaland · Sikkim · Manipur · Mizoram · Tripura
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-lake-deep">
            <button
              type="button"
              onClick={() => navigateTo('discover')}
              className="hover:text-slate-ink cursor-pointer"
            >
              Explore Stays
            </button>
            <button
              type="button"
              onClick={() => navigateTo('map')}
              className="hover:text-slate-ink cursor-pointer"
            >
              8-State Atlas
            </button>
            <button
              type="button"
              onClick={() => navigateTo('hosts')}
              className="hover:text-slate-ink cursor-pointer"
            >
              Artisan Hosts
            </button>
            <button
              type="button"
              onClick={() => navigateTo('saved')}
              className="hover:text-slate-ink cursor-pointer"
            >
              Saved ({savedIds.length})
            </button>
            <button
              type="button"
              onClick={() => (currentUser ? navigateTo('profile') : setAuthModalOpen(true))}
              className="hover:text-slate-ink cursor-pointer"
            >
              {currentUser ? 'My Profile' : 'Login'}
            </button>
          </div>
        </div>
      </footer>

      {/* Always-visible Floating AI Itinerary Chatbox */}
      <AIChatbox
        onItinerarySaved={handleAIItinerarySaved}
        onBookStaysForState={handleBookStateStays}
      />
    </div>
  );
}

