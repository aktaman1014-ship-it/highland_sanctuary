import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cloud,
  Heart,
  LogOut,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { BookingRecord, formatInr, REGIONS, Sanctuary } from '../data/sanctuaries';
import { compressAvatarFile, UserProfile } from '../services/dataStore';
import { SanctuaryArtwork } from './SanctuaryArtwork';
import { StayCard } from './StayCard';

interface ProfileViewProps {
  user: UserProfile;
  sanctuaries: Sanctuary[];
  savedIds: string[];
  bookings: BookingRecord[];
  syncStatusText: string;
  onUpdateProfile: (next: UserProfile) => Promise<void>;
  onToggleSave: (id: string) => void;
  onSelectSanctuary: (sanctuary: Sanctuary) => void;
  onCancelBooking: (id: string) => void;
  onLogout: () => void;
  onExplore: () => void;
  initialTab?: ProfileSection;
}

export type ProfileSection = 'profile' | 'trips' | 'saved' | 'host' | 'settings';

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  sanctuaries,
  savedIds,
  bookings,
  syncStatusText,
  onUpdateProfile,
  onToggleSave,
  onSelectSanctuary,
  onCancelBooking,
  onLogout,
  onExplore,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<ProfileSection>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location || 'Assam');
  const [avatar, setAvatar] = useState(user.avatar);
  const [isHost, setIsHost] = useState(user.isHost);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const statesOnly = REGIONS.filter((r) => r !== 'All 8 States');
  const savedStays = sanctuaries.filter((s) => savedIds.includes(s.id));

  const todayIso = new Date().toISOString().slice(0, 10);
  const upcomingTrips = bookings.filter(
    (b) => b.status === 'Confirmed' && b.checkIn >= todayIso
  );
  const pastTrips = bookings.filter(
    (b) => b.status === 'Cancelled' || b.checkIn < todayIso
  );

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarFile(file);
      setAvatar(compressed);
      await onUpdateProfile({
        ...user,
        name,
        phone,
        location,
        avatar: compressed,
        isHost,
      });
      setSaveMessage('Avatar updated and synced.');
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'Failed to process avatar.');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    await onUpdateProfile({
      ...user,
      name: name.trim() || user.name,
      phone: phone.trim(),
      location,
      avatar,
      isHost,
      hostEarningsInr: isHost && user.hostEarningsInr === 0 ? 18400 : user.hostEarningsInr,
    });
    setSaving(false);
    setSaveMessage('Profile saved.');
  };

  const handleToggleHostMode = async () => {
    const nextHost = !isHost;
    setIsHost(nextHost);
    await onUpdateProfile({
      ...user,
      name,
      phone,
      location,
      avatar,
      isHost: nextHost,
      hostEarningsInr: nextHost && user.hostEarningsInr === 0 ? 18400 : user.hostEarningsInr,
    });
  };

  const sectionTabs: { id: ProfileSection; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'trips', label: `Bookings (${bookings.length})` },
    { id: 'saved', label: `Saved (${savedStays.length})` },
    { id: 'host', label: 'Host Mode' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      {/* Top Profile Banner */}
      <section className="bg-cream rounded-3xl border border-oak pinterest-shadow p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-2 border-coral shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-coral-peach text-slate-ink text-2xl font-bold flex items-center justify-center border-2 border-oak shrink-0">
              {initials || 'HS'}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-ink">{name}</h1>
              {/* Synced to Cloud Green Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Synced to Cloud</span>
              </span>
            </div>
            <p className="text-sm text-slate-muted">
              {user.email}
              <span aria-hidden="true"> · </span>
              <span>{location}, North East India</span>
            </p>
            <p className="text-xs text-slate-subtle flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-lake" />
              <span>{syncStatusText}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExplore}
            className="px-5 py-2.5 rounded-full border border-lake text-lake-deep hover:bg-lake-mist text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Explore Sanctuaries
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </section>

      {/* Section Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex items-center gap-2 overflow-x-auto pb-1"
      >
        {sectionTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-coral border-coral text-slate-ink shadow-sm'
                  : 'bg-cream border-oak text-slate-muted hover:border-lake hover:text-slate-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section A: My Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSave}
          className="bg-cream rounded-2xl border border-oak pinterest-shadow p-6 sm:p-8 max-w-3xl space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-oak">
            <div>
              <h2 className="text-xl font-bold text-slate-ink">My Profile</h2>
              <p className="text-xs text-slate-subtle mt-1">
                Update your traveler details, avatar photo, and home North East state.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lake-mist border border-lake text-lake-deep text-xs font-bold hover:bg-lake hover:text-white transition-colors cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>Upload Avatar</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-bold text-slate-ink mb-1.5">
                Full Name
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
                <User className="w-4 h-4 text-lake shrink-0" />
                <input
                  id="prof-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-ink focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-bold text-slate-ink mb-1.5">
                Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-sand/60 border border-oak text-sm text-slate-subtle cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-bold text-slate-ink mb-1.5">
                Phone Number
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
                <Phone className="w-4 h-4 text-lake shrink-0" />
                <input
                  id="prof-phone"
                  type="tel"
                  placeholder="+91 98640 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-ink focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div>
              <label htmlFor="prof-state" className="block text-xs font-bold text-slate-ink mb-1.5">
                Location (North East State)
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-sand border border-oak focus-within:border-lake focus-within:bg-white">
                <MapPin className="w-4 h-4 text-lake shrink-0" />
                <select
                  id="prof-state"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-ink focus:outline-none cursor-pointer"
                >
                  {statesOnly.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {saveMessage ? (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </span>
            ) : (
              <span className="text-xs text-slate-subtle">
                Member since {user.createdAt}
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-7 py-3 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Section B: My Trips (Upcoming + Past) */}
      {activeTab === 'trips' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-ink">
              Upcoming Sanctuaries ({upcomingTrips.length})
            </h2>
            {upcomingTrips.length === 0 ? (
              <div className="bg-cream rounded-2xl border border-oak p-6 text-sm text-slate-muted">
                No upcoming reservations. Explore our 8-state sanctuaries to book your next stay.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcomingTrips.map((b) => {
                  const stay = sanctuaries.find((s) => s.id === b.sanctuaryId);
                  return (
                    <article
                      key={b.id}
                      className="bg-cream rounded-2xl border border-oak pinterest-shadow overflow-hidden flex flex-col sm:flex-row"
                    >
                      <div className="sm:w-40 aspect-[4/3] sm:aspect-auto bg-sand shrink-0">
                        <SanctuaryArtwork
                          theme={b.artworkTheme}
                          variant="photo"
                          photoUrl={b.photoUrl}
                          photoAlt={b.sanctuaryTitle}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-lake-deep tabular-nums">
                              #{b.id} · {b.status}
                            </span>
                            <span className="font-bold text-slate-ink tabular-nums">
                              {formatInr(b.totalInr)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-ink mt-1">
                            {b.sanctuaryTitle}
                          </h3>
                          <p className="text-xs text-slate-muted mt-0.5 tabular-nums">
                            {b.checkIn} {b.checkOut ? `→ ${b.checkOut}` : ''} · {b.nights}n · {b.guests} guests
                          </p>
                          {b.paymentId && (
                            <p className="text-[11px] text-slate-subtle mt-0.5 tabular-nums">
                              {b.paymentMethod} · {b.paymentId}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-oak">
                          {stay && (
                            <button
                              type="button"
                              onClick={() => onSelectSanctuary(stay)}
                              className="text-xs font-bold text-lake-deep hover:underline cursor-pointer"
                            >
                              View Stay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onCancelBooking(b.id)}
                            className="text-xs font-bold text-slate-muted hover:text-red-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-ink">
              Past & Cancelled Trips ({pastTrips.length})
            </h2>
            {pastTrips.length === 0 ? (
              <div className="bg-cream rounded-2xl border border-oak p-6 text-sm text-slate-muted">
                No past or cancelled trips recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pastTrips.map((b) => (
                  <article
                    key={b.id}
                    className="bg-cream rounded-2xl border border-oak p-5 flex items-center justify-between gap-4 opacity-85"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-subtle tabular-nums">
                        {b.id} · {b.status === 'Cancelled' ? 'Cancelled' : 'Completed'}
                      </p>
                      <h3 className="text-base font-bold text-slate-ink mt-0.5">
                        {b.sanctuaryTitle}
                      </h3>
                      <p className="text-xs text-slate-muted tabular-nums">
                        {b.state} · {b.checkIn} ({b.nights} nights)
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-ink tabular-nums">
                      {formatInr(b.totalInr)}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section C: Saved Sanctuaries */}
      {activeTab === 'saved' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-ink">
              Saved Sanctuaries ({savedStays.length})
            </h2>
          </div>

          {savedStays.length === 0 ? (
            <div className="bg-cream rounded-2xl border border-oak p-8 text-center space-y-3">
              <Heart className="w-6 h-6 text-coral mx-auto" />
              <p className="text-sm text-slate-muted">
                Tap the heart icon on any stay on the homepage to save it here.
              </p>
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
                  nights={3}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section D: Host Mode */}
      {activeTab === 'host' && (
        <div className="bg-cream rounded-2xl border border-oak pinterest-shadow p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-oak">
            <div>
              <h2 className="text-xl font-bold text-slate-ink flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-lake" />
                <span>Highland Host Mode</span>
              </h2>
              <p className="text-xs text-slate-muted mt-1">
                Switch on Host Mode to track homestay payouts and eco-guide sessions across {location}.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isHost}
              onClick={handleToggleHostMode}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                isHost
                  ? 'bg-lake text-white'
                  : 'bg-sand border border-oak text-slate-ink hover:border-coral'
              }`}
            >
              {isHost ? 'Host Mode: Active' : 'Enable Host Mode'}
            </button>
          </div>

          {isHost ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-sand rounded-2xl p-4 border border-oak">
                  <p className="text-xs font-semibold text-slate-subtle flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-lake" />
                    <span>Season Earnings</span>
                  </p>
                  <p className="text-2xl font-bold text-slate-ink mt-1 tabular-nums">
                    {formatInr(user.hostEarningsInr || 48600)}
                  </p>
                  <p className="text-xs text-lake-deep mt-0.5">Direct to village bank</p>
                </div>

                <div className="bg-sand rounded-2xl p-4 border border-oak">
                  <p className="text-xs font-semibold text-slate-subtle">Hosted Nights</p>
                  <p className="text-2xl font-bold text-slate-ink mt-1 tabular-nums">14</p>
                  <p className="text-xs text-slate-muted mt-0.5">Nov – Dec season</p>
                </div>

                <div className="bg-sand rounded-2xl p-4 border border-oak">
                  <p className="text-xs font-semibold text-slate-subtle">Steward Rating</p>
                  <p className="text-2xl font-bold text-slate-ink mt-1 tabular-nums">4.95 ★</p>
                  <p className="text-xs text-slate-muted mt-0.5">Verified Eco-Guide</p>
                </div>
              </div>

              <div className="bg-lake-mist rounded-2xl p-4 border border-lake-light/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-ink">
                    Active Listing: {location} Heritage Homestead
                  </p>
                  <p className="text-xs text-slate-muted">
                    Next payout scheduled via NEFT on the 1st of the month.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-coral text-slate-ink text-xs font-bold">
                  Accepting Guests
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-sand rounded-2xl p-6 border border-oak text-sm text-slate-muted leading-relaxed">
              Enable Host Mode above to view your sanctuary earnings dashboard, upcoming guest
              arrivals, and eco-guide payout summaries.
            </div>
          )}
        </div>
      )}

      {/* Section E: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-cream rounded-2xl border border-oak pinterest-shadow p-6 sm:p-8 max-w-2xl space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-oak">
            <Settings className="w-5 h-5 text-lake" />
            <h2 className="text-xl font-bold text-slate-ink">Account & Sync Settings</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-sand rounded-xl p-4 border border-oak">
              <div>
                <p className="font-bold text-slate-ink">Storage & Cloud Sync</p>
                <p className="text-xs text-slate-muted mt-0.5">{syncStatusText}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced to Cloud</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-sand rounded-xl p-4 border border-oak">
              <div>
                <p className="font-bold text-slate-ink">Signed-in Session</p>
                <p className="text-xs text-slate-muted mt-0.5">
                  {user.email} ({user.authMode === 'firebase-google' ? 'Google Firebase Auth' : 'Demo Local Account'})
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
