import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { BookingRecord, formatInr, PaymentMethod, SANCTUARIES } from '../data/sanctuaries';
import {
  bootstrapSqlUser,
  syncBookingToSql,
  syncCancelBookingToSql,
  syncProfileToSql,
  syncSavedToggleToSql,
} from './sqlSync';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  location: string;
  isHost: boolean;
  hostEarningsInr: number;
  authMode: 'firebase-google' | 'demo-local';
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  type: 'save' | 'booking' | 'signup' | 'profile';
  message: string;
  state: string;
  timestampMs: number;
  relativeTime?: string;
}

export interface AdminUserSummary {
  profile: UserProfile;
  bookings: BookingRecord[];
  savedIds: string[];
  activeToday: boolean;
}

export interface AdminOverviewData {
  users: AdminUserSummary[];
  allBookings: BookingRecord[];
  totalSavedCount: number;
  totalRevenueInr: number;
  activeTodayCount: number;
  activityFeed: ActivityEvent[];
  firestoreSynced: boolean;
}

interface StoredDemoAccount {
  uid: string;
  name: string;
  email: string;
  password: string;
  avatar: string;
  phone: string;
  location: string;
  isHost: boolean;
  hostEarningsInr: number;
  createdAt: string;
}

const DEMO_ACCOUNTS_KEY = 'hs_demo_accounts_v2';
const ACTIVE_DEMO_SESSION_KEY = 'hs_active_demo_uid_v2';
const USER_PROFILES_KEY = 'hs_user_profiles_v2';
const USER_SAVED_KEY_PREFIX = 'hs_saved_';
const USER_BOOKINGS_KEY_PREFIX = 'hs_bookings_';
const ACTIVITY_FEED_KEY = 'hs_activity_feed_v1';

const ADMIN_UID = 'admin_highland_head';
const TEST_USER_UID = 'demo_user_test_highland';

const SEEDED_ACCOUNTS: StoredDemoAccount[] = [
  {
    uid: ADMIN_UID,
    name: 'Head Sanctuary Admin',
    email: 'admin@highland.com',
    password: 'admin123',
    avatar: '',
    phone: '+91 98640 10001',
    location: 'Meghalaya',
    isHost: true,
    hostEarningsInr: 124500,
    createdAt: '2026-08-01',
  },
  {
    uid: TEST_USER_UID,
    name: 'Aarav Borah',
    email: 'test@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 98640 21450',
    location: 'Assam',
    isHost: true,
    hostEarningsInr: 48600,
    createdAt: '2026-09-14',
  },
  {
    uid: 'demo_aman_thakur',
    name: 'Aman Thakur',
    email: 'aman.thakur@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 94360 55120',
    location: 'Nagaland',
    isHost: false,
    hostEarningsInr: 0,
    createdAt: '2026-10-03',
  },
  {
    uid: 'demo_priya_sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 98111 44320',
    location: 'Meghalaya',
    isHost: true,
    hostEarningsInr: 36200,
    createdAt: '2026-10-18',
  },
  {
    uid: 'demo_tenzin_dorjee',
    name: 'Tenzin Dorjee',
    email: 'tenzin.dorjee@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 94361 88740',
    location: 'Arunachal Pradesh',
    isHost: false,
    hostEarningsInr: 0,
    createdAt: '2026-11-02',
  },
  {
    uid: 'demo_ibemhal_devi',
    name: 'Ibemhal Devi',
    email: 'ibemhal.devi@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 96120 71090',
    location: 'Manipur',
    isHost: true,
    hostEarningsInr: 22900,
    createdAt: '2026-11-11',
  },
  {
    uid: 'demo_rohan_das',
    name: 'Rohan Das',
    email: 'rohan.das@highland.com',
    password: '123456',
    avatar: '',
    phone: '+91 99540 31820',
    location: 'Assam',
    isHost: false,
    hostEarningsInr: 0,
    createdAt: '2026-11-20',
  },
];

const SEEDED_USER_SAVED: Record<string, string[]> = {
  [ADMIN_UID]: ['dawki-sohra-sanctuary', 'kaziranga-majuli-haven'],
  [TEST_USER_UID]: ['dawki-sohra-sanctuary', 'kaziranga-majuli-haven', 'loktak-floating-sanctuary'],
  demo_aman_thakur: ['dzuko-hornbill-lodge', 'dawki-sohra-sanctuary'],
  demo_priya_sharma: ['dawki-sohra-sanctuary', 'tsomgo-nathula-retreat', 'neermahal-lake-residence'],
  demo_tenzin_dorjee: ['tawang-ziro-hermitage', 'tsomgo-nathula-retreat'],
  demo_ibemhal_devi: ['loktak-floating-sanctuary', 'phawngpui-blue-mountain'],
  demo_rohan_das: ['kaziranga-majuli-haven'],
};

const SEEDED_USER_BOOKINGS: Record<string, BookingRecord[]> = {
  [TEST_USER_UID]: [
    {
      id: 'HS-4190',
      sanctuaryId: 'tawang-ziro-hermitage',
      sanctuaryTitle: 'Tawang Snow Ridge & Ziro Pine Chalet',
      location: 'Tawang, Sela Pass & Ziro',
      state: 'Arunachal Pradesh',
      artworkTheme: 'arunachal',
      photoUrl: '/src/assets/images/arunachal_tawang_snow_1795236949484.jpg',
      checkIn: '2026-12-18',
      nights: 3,
      guests: 2,
      guestName: 'Aarav Borah',
      guestEmail: 'test@highland.com',
      selectedAddonIds: ['tawang-sela-excursion'],
      totalInr: 31616,
      bookedAt: '2026-11-18',
      status: 'Confirmed',
    },
    {
      id: 'HS-3082',
      sanctuaryId: 'dawki-sohra-sanctuary',
      sanctuaryTitle: 'Dawki Crystal Waters & Root Bridge Loft',
      location: 'Dawki & Sohra (Cherrapunji)',
      state: 'Meghalaya',
      artworkTheme: 'meghalaya',
      photoUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
      checkIn: '2026-10-12',
      nights: 2,
      guests: 2,
      guestName: 'Aarav Borah',
      guestEmail: 'test@highland.com',
      selectedAddonIds: ['dawki-glass-boat'],
      totalInr: 17160,
      bookedAt: '2026-09-25',
      status: 'Confirmed',
    },
  ],
  demo_aman_thakur: [
    {
      id: 'HS-5204',
      sanctuaryId: 'dzuko-hornbill-lodge',
      sanctuaryTitle: 'Dzuko Lily Meadow & Hornbill Lodge',
      location: 'Dzuko Valley & Kohima',
      state: 'Nagaland',
      artworkTheme: 'nagaland',
      photoUrl: '/src/assets/images/nagaland_dzuko_flowers_1795236949408.jpg',
      checkIn: '2026-12-05',
      nights: 2,
      guests: 2,
      guestName: 'Aman Thakur',
      guestEmail: 'aman.thakur@highland.com',
      selectedAddonIds: ['dzuko-lily-trek'],
      totalInr: 19552,
      bookedAt: '2026-11-19',
      status: 'Confirmed',
    },
  ],
  demo_priya_sharma: [
    {
      id: 'HS-6118',
      sanctuaryId: 'dawki-sohra-sanctuary',
      sanctuaryTitle: 'Dawki Crystal Waters & Root Bridge Loft',
      location: 'Dawki & Sohra (Cherrapunji)',
      state: 'Meghalaya',
      artworkTheme: 'meghalaya',
      photoUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
      checkIn: '2026-12-22',
      nights: 3,
      guests: 3,
      guestName: 'Priya Sharma',
      guestEmail: 'priya.sharma@highland.com',
      selectedAddonIds: ['nongriat-root-trek'],
      totalInr: 27144,
      bookedAt: '2026-11-19',
      status: 'Confirmed',
    },
    {
      id: 'HS-6044',
      sanctuaryId: 'neermahal-lake-residence',
      sanctuaryTitle: 'Neermahal Lakefront Heritage Villa',
      location: 'Melaghar & Unakoti Circuit',
      state: 'Tripura',
      artworkTheme: 'tripura',
      photoUrl: '/src/assets/images/tripura_neermahal_palace_1795236949140.jpg',
      checkIn: '2026-11-28',
      nights: 2,
      guests: 2,
      guestName: 'Priya Sharma',
      guestEmail: 'priya.sharma@highland.com',
      selectedAddonIds: ['neermahal-boat-tour'],
      totalInr: 16848,
      bookedAt: '2026-11-10',
      status: 'Confirmed',
    },
  ],
  demo_tenzin_dorjee: [
    {
      id: 'HS-7331',
      sanctuaryId: 'tsomgo-nathula-retreat',
      sanctuaryTitle: 'Tsomgo Sapphire Lake & Nathula Chalet',
      location: 'Tsomgo Lake & Nathula Corridor',
      state: 'Sikkim',
      artworkTheme: 'sikkim',
      photoUrl: '/src/assets/images/sikkim_tsomgo_lake_1795236949322.jpg',
      checkIn: '2026-12-10',
      nights: 2,
      guests: 2,
      guestName: 'Tenzin Dorjee',
      guestEmail: 'tenzin.dorjee@highland.com',
      selectedAddonIds: ['tsomgo-nathula-pass'],
      totalInr: 23712,
      bookedAt: '2026-11-15',
      status: 'Confirmed',
    },
    {
      id: 'HS-7102',
      sanctuaryId: 'kaziranga-majuli-haven',
      sanctuaryTitle: 'Kaziranga Tea & Majuli River Pavilion',
      location: 'Kaziranga & Majuli Circuit',
      state: 'Assam',
      artworkTheme: 'assam',
      photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
      checkIn: '2026-12-26',
      nights: 3,
      guests: 2,
      guestName: 'Tenzin Dorjee',
      guestEmail: 'tenzin.dorjee@highland.com',
      selectedAddonIds: ['kaziranga-jeep'],
      totalInr: 28080,
      bookedAt: '2026-11-16',
      status: 'Confirmed',
    },
  ],
  demo_ibemhal_devi: [
    {
      id: 'HS-8209',
      sanctuaryId: 'loktak-floating-sanctuary',
      sanctuaryTitle: 'Loktak Floating Phumdi Eco-Cottage',
      location: 'Loktak Lake, Moirang',
      state: 'Manipur',
      artworkTheme: 'manipur',
      photoUrl: '/src/assets/images/manipur_loktak_lake_1795236949260.jpg',
      checkIn: '2026-12-08',
      nights: 2,
      guests: 2,
      guestName: 'Ibemhal Devi',
      guestEmail: 'ibemhal.devi@highland.com',
      selectedAddonIds: ['loktak-sunrise-canoe'],
      totalInr: 15808,
      bookedAt: '2026-11-17',
      status: 'Confirmed',
    },
    {
      id: 'HS-8105',
      sanctuaryId: 'phawngpui-blue-mountain',
      sanctuaryTitle: 'Phawngpui Blue Mountain Ridge Cabin',
      location: 'Phawngpui & Reiek Hills',
      state: 'Mizoram',
      artworkTheme: 'mizoram',
      photoUrl: '/src/assets/images/mizoram_phawngpui_hills_1795236949939.jpg',
      checkIn: '2026-12-19',
      nights: 2,
      guests: 2,
      guestName: 'Ibemhal Devi',
      guestEmail: 'ibemhal.devi@highland.com',
      selectedAddonIds: ['phawngpui-cliff-hike'],
      totalInr: 16952,
      bookedAt: '2026-11-18',
      status: 'Confirmed',
    },
  ],
  demo_rohan_das: [
    {
      id: 'HS-9014',
      sanctuaryId: 'kaziranga-majuli-haven',
      sanctuaryTitle: 'Kaziranga Tea & Majuli River Pavilion',
      location: 'Kaziranga & Majuli Circuit',
      state: 'Assam',
      artworkTheme: 'assam',
      photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
      checkIn: '2026-12-14',
      nights: 2,
      guests: 2,
      guestName: 'Rohan Das',
      guestEmail: 'rohan.das@highland.com',
      selectedAddonIds: ['majuli-mask-boat'],
      totalInr: 18824,
      bookedAt: '2026-11-20',
      status: 'Confirmed',
    },
  ],
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore storage errors
  }
  return fallback;
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === 'admin@highland.com';
}

export function getDemoAccounts(): StoredDemoAccount[] {
  const existing = safeReadJson<StoredDemoAccount[]>(DEMO_ACCOUNTS_KEY, []);
  const existingByEmail = new Map(existing.map((a) => [a.email.toLowerCase(), a]));
  let changed = false;

  for (const seed of SEEDED_ACCOUNTS) {
    if (!existingByEmail.has(seed.email.toLowerCase())) {
      existing.push(seed);
      changed = true;
    }
    if (localStorage.getItem(`${USER_SAVED_KEY_PREFIX}${seed.uid}`) === null) {
      safeWriteJson(`${USER_SAVED_KEY_PREFIX}${seed.uid}`, SEEDED_USER_SAVED[seed.uid] ?? []);
    }
    if (localStorage.getItem(`${USER_BOOKINGS_KEY_PREFIX}${seed.uid}`) === null) {
      safeWriteJson(`${USER_BOOKINGS_KEY_PREFIX}${seed.uid}`, SEEDED_USER_BOOKINGS[seed.uid] ?? []);
    }
  }

  if (changed) {
    safeWriteJson(DEMO_ACCOUNTS_KEY, existing);
  }
  return existing;
}

function seedInitialActivity(): ActivityEvent[] {
  const now = Date.now();
  return [
    {
      id: 'act_aman_dzuko',
      userId: 'demo_aman_thakur',
      type: 'save',
      message: 'Aman Thakur saved Dzuko Valley',
      state: 'Nagaland',
      timestampMs: now - 2 * 60 * 1000,
    },
    {
      id: 'act_rohan_assam',
      userId: 'demo_rohan_das',
      type: 'signup',
      message: 'New user from Assam joined',
      state: 'Assam',
      timestampMs: now - 11 * 60 * 1000,
    },
    {
      id: 'act_priya_dawki',
      userId: 'demo_priya_sharma',
      type: 'booking',
      message: 'Priya Sharma booked Dawki Crystal Waters Loft',
      state: 'Meghalaya',
      timestampMs: now - 28 * 60 * 1000,
    },
    {
      id: 'act_ibemhal_loktak',
      userId: 'demo_ibemhal_devi',
      type: 'booking',
      message: 'Ibemhal Devi booked Loktak Floating Eco-Cottage',
      state: 'Manipur',
      timestampMs: now - 52 * 60 * 1000,
    },
    {
      id: 'act_tenzin_tsomgo',
      userId: 'demo_tenzin_dorjee',
      type: 'booking',
      message: 'Tenzin Dorjee booked Tsomgo Sapphire Lake Chalet',
      state: 'Sikkim',
      timestampMs: now - 95 * 60 * 1000,
    },
  ];
}

export function getLocalActivityFeed(): ActivityEvent[] {
  const stored = safeReadJson<ActivityEvent[]>(ACTIVITY_FEED_KEY, []);
  if (stored.length === 0) {
    const seeded = seedInitialActivity();
    safeWriteJson(ACTIVITY_FEED_KEY, seeded);
    return seeded;
  }
  return stored;
}

export async function recordActivityEvent(
  userId: string,
  type: ActivityEvent['type'],
  message: string,
  state: string
): Promise<void> {
  const event: ActivityEvent = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type,
    message: message.slice(0, 200),
    state: state.slice(0, 60),
    timestampMs: Date.now(),
  };

  const current = getLocalActivityFeed();
  safeWriteJson(ACTIVITY_FEED_KEY, [event, ...current].slice(0, 40));

  if (isFirebaseVerifiedUser(userId)) {
    try {
      await setDoc(doc(db, 'activity', event.id), {
        id: event.id,
        userId,
        type,
        message: event.message,
        state: event.state,
        createdAt: serverTimestamp(),
      });
    } catch {
      // keep local activity feed intact even if offline
    }
  }
}

export function formatRelativeTime(timestampMs: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'hr' : 'hrs'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function getActiveDemoUser(): UserProfile | null {
  getDemoAccounts();
  getLocalActivityFeed();
  const uid = localStorage.getItem(ACTIVE_DEMO_SESSION_KEY);
  if (!uid) return null;
  const profiles = safeReadJson<Record<string, UserProfile>>(USER_PROFILES_KEY, {});
  if (profiles[uid]) return profiles[uid];
  const acc = getDemoAccounts().find((a) => a.uid === uid);
  if (!acc) return null;
  const profile: UserProfile = {
    uid: acc.uid,
    name: acc.name,
    email: acc.email,
    avatar: acc.avatar,
    phone: acc.phone,
    location: acc.location,
    isHost: acc.isHost,
    hostEarningsInr: acc.hostEarningsInr,
    authMode: 'demo-local',
    createdAt: acc.createdAt,
  };
  profiles[uid] = profile;
  safeWriteJson(USER_PROFILES_KEY, profiles);
  return profile;
}

export function loginDemoEmail(email: string, password: string): UserProfile {
  const accounts = getDemoAccounts();
  const match = accounts.find(
    (a) => a.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
  if (!match || match.password !== password) {
    throw new Error('Invalid email or password. Try test@highland.com / 123456 or admin@highland.com / admin123.');
  }
  localStorage.setItem(ACTIVE_DEMO_SESSION_KEY, match.uid);
  return getActiveDemoUser()!;
}

export function signupDemoEmail(name: string, email: string, password: string): UserProfile {
  const accounts = getDemoAccounts();
  const normalizedEmail = email.trim().toLowerCase();
  if (accounts.some((a) => a.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email already exists. Please log in.');
  }
  const uid = `demo_${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString().slice(0, 10);
  const newAccount: StoredDemoAccount = {
    uid,
    name: name.trim(),
    email: normalizedEmail,
    password,
    avatar: '',
    phone: '',
    location: 'Assam',
    isHost: false,
    hostEarningsInr: 0,
    createdAt,
  };
  safeWriteJson(DEMO_ACCOUNTS_KEY, [...accounts, newAccount]);
  localStorage.setItem(ACTIVE_DEMO_SESSION_KEY, uid);
  const profile = getActiveDemoUser()!;
  void recordActivityEvent(uid, 'signup', `New user ${profile.name} from ${profile.location} joined`, profile.location);
  return profile;
}

export function logoutDemoSession(): void {
  localStorage.removeItem(ACTIVE_DEMO_SESSION_KEY);
}

export function getLocalProfile(uid: string): UserProfile | null {
  const profiles = safeReadJson<Record<string, UserProfile>>(USER_PROFILES_KEY, {});
  return profiles[uid] ?? null;
}

export function saveLocalProfile(profile: UserProfile): void {
  const profiles = safeReadJson<Record<string, UserProfile>>(USER_PROFILES_KEY, {});
  profiles[profile.uid] = profile;
  safeWriteJson(USER_PROFILES_KEY, profiles);
}

export function getLocalSavedIds(uid: string): string[] {
  return safeReadJson<string[]>(`${USER_SAVED_KEY_PREFIX}${uid}`, [
    'dawki-sohra-sanctuary',
    'tsomgo-nathula-retreat',
  ]);
}

export function saveLocalSavedIds(uid: string, ids: string[]): void {
  safeWriteJson(`${USER_SAVED_KEY_PREFIX}${uid}`, ids);
}

export function getLocalBookings(uid: string): BookingRecord[] {
  return safeReadJson<BookingRecord[]>(`${USER_BOOKINGS_KEY_PREFIX}${uid}`, []);
}

export function saveLocalBookings(uid: string, bookings: BookingRecord[]): void {
  safeWriteJson(`${USER_BOOKINGS_KEY_PREFIX}${uid}`, bookings);
}

export function getAllConfirmedBookingsForSanctuary(sanctuaryId: string): BookingRecord[] {
  getDemoAccounts();
  const byId = new Map<string, BookingRecord>();
  const collect = (list: BookingRecord[]) => {
    for (const rec of list) {
      if (rec.sanctuaryId === sanctuaryId && rec.status === 'Confirmed') {
        byId.set(rec.id, rec);
      }
    }
  };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(USER_BOOKINGS_KEY_PREFIX)) {
        const raw = localStorage.getItem(k);
        if (raw) collect(JSON.parse(raw) as BookingRecord[]);
      }
    }
  } catch {
    // ignore storage iteration errors
  }
  return Array.from(byId.values());
}

export function generateNextBookingId(): string {
  const accounts = getDemoAccounts();
  let maxSeq = 0;
  const checkList = (list: BookingRecord[]) => {
    for (const b of list) {
      const m = /^HS-2026-(\d+)$/.exec(b.id);
      if (m) {
        const num = Number(m[1]);
        if (!Number.isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
  };
  for (const acc of accounts) {
    checkList(getLocalBookings(acc.uid));
  }
  checkList(getLocalBookings('guest'));
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(USER_BOOKINGS_KEY_PREFIX)) {
        const raw = localStorage.getItem(k);
        if (raw) checkList(JSON.parse(raw) as BookingRecord[]);
      }
    }
  } catch {
    // ignore storage iteration errors
  }
  const next = String(maxSeq + 1).padStart(3, '0');
  return `HS-2026-${next}`;
}

function isFirebaseVerifiedUser(uid: string): boolean {
  return Boolean(
    auth.currentUser &&
      auth.currentUser.uid === uid &&
      auth.currentUser.emailVerified
  );
}

export async function syncFirebaseUserProfile(
  uid: string,
  defaults: { name: string; email: string; avatar: string }
): Promise<UserProfile> {
  const localExisting = getLocalProfile(uid);
  const baseProfile: UserProfile = localExisting ?? {
    uid,
    name: defaults.name.slice(0, 100) || 'Highland Traveler',
    email: defaults.email.slice(0, 150),
    avatar: defaults.avatar.slice(0, 250000),
    phone: '',
    location: 'Assam',
    isHost: false,
    hostEarningsInr: 0,
    authMode: 'firebase-google',
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (!isFirebaseVerifiedUser(uid)) {
    saveLocalProfile(baseProfile);
    return baseProfile;
  }

  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const merged: UserProfile = {
        uid,
        name: typeof data.name === 'string' ? data.name : baseProfile.name,
        email: typeof data.email === 'string' ? data.email : baseProfile.email,
        avatar: typeof data.avatar === 'string' ? data.avatar : baseProfile.avatar,
        phone: typeof data.phone === 'string' ? data.phone : '',
        location: typeof data.location === 'string' ? data.location : 'Assam',
        isHost: Boolean(data.isHost),
        hostEarningsInr:
          typeof data.hostEarningsInr === 'number' ? data.hostEarningsInr : 0,
        authMode: 'firebase-google',
        createdAt: baseProfile.createdAt,
      };
      saveLocalProfile(merged);
      void syncProfileToSql(merged);
      return merged;
    }

    await setDoc(userRef, {
      uid,
      name: baseProfile.name.slice(0, 100),
      email: baseProfile.email.slice(0, 150),
      avatar: baseProfile.avatar.slice(0, 250000),
      phone: baseProfile.phone.slice(0, 30),
      location: baseProfile.location.slice(0, 60),
      isHost: baseProfile.isHost,
      hostEarningsInr: baseProfile.hostEarningsInr,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    saveLocalProfile(baseProfile);
    void syncProfileToSql(baseProfile);
    void recordActivityEvent(uid, 'signup', `New user ${baseProfile.name} from ${baseProfile.location} joined`, baseProfile.location);
    return baseProfile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

export async function updateUserProfileRecord(profile: UserProfile): Promise<'cloud' | 'local'> {
  const sanitized: UserProfile = {
    ...profile,
    name: profile.name.trim().slice(0, 100) || 'Highland Traveler',
    phone: profile.phone.trim().slice(0, 30),
    location: profile.location.slice(0, 60),
    avatar: profile.avatar.slice(0, 250000),
  };
  saveLocalProfile(sanitized);

  if (!isFirebaseVerifiedUser(sanitized.uid)) {
    return 'local';
  }

  const userRef = doc(db, 'users', sanitized.uid);
  try {
    await updateDoc(userRef, {
      name: sanitized.name,
      avatar: sanitized.avatar,
      phone: sanitized.phone,
      location: sanitized.location,
      isHost: sanitized.isHost,
      hostEarningsInr: sanitized.hostEarningsInr,
      updatedAt: serverTimestamp(),
    });
    void syncProfileToSql(sanitized);
    return 'cloud';
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${sanitized.uid}`);
  }
}

export async function loadUserSavedIds(uid: string): Promise<string[]> {
  const localIds = getLocalSavedIds(uid);
  if (!isFirebaseVerifiedUser(uid)) {
    return localIds;
  }
  try {
    const q = query(collection(db, 'saved'), where('userId', '==', uid));
    const [snap, sqlData] = await Promise.all([getDocs(q), bootstrapSqlUser()]);
    const cloudIds = snap.docs
      .map((d) => d.data().sanctuaryId)
      .filter((id): id is string => typeof id === 'string');
    const sqlIds = sqlData?.savedIds ?? [];
    const merged = Array.from(new Set([...cloudIds, ...sqlIds, ...localIds]));
    saveLocalSavedIds(uid, merged);
    return merged;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'saved');
  }
}

export async function toggleSavedRecord(
  uid: string,
  actorName: string,
  sanctuaryId: string,
  shouldSave: boolean,
  nextIds: string[]
): Promise<'cloud' | 'local'> {
  saveLocalSavedIds(uid, nextIds);
  if (shouldSave) {
    const matched = SANCTUARIES.find((s) => s.id === sanctuaryId);
    const label = matched ? matched.title : sanctuaryId;
    const state = matched ? matched.state : 'Meghalaya';
    void recordActivityEvent(uid, 'save', `${actorName} saved ${label}`, state);
  }

  if (!isFirebaseVerifiedUser(uid)) {
    return 'local';
  }

  const savedDocId = `${uid}_${sanctuaryId}`;
  const savedRef = doc(db, 'saved', savedDocId);
  try {
    if (shouldSave) {
      await setDoc(savedRef, {
        userId: uid,
        sanctuaryId,
        savedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(savedRef);
    }
    void syncSavedToggleToSql(sanctuaryId, shouldSave);
    return 'cloud';
  } catch (err) {
    handleFirestoreError(
      err,
      shouldSave ? OperationType.CREATE : OperationType.DELETE,
      `saved/${savedDocId}`
    );
  }
}

export async function loadUserBookings(uid: string): Promise<BookingRecord[]> {
  const localBookings = getLocalBookings(uid);
  if (!isFirebaseVerifiedUser(uid)) {
    return localBookings;
  }
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', uid));
    const [snap, sqlData] = await Promise.all([getDocs(q), bootstrapSqlUser()]);
    const cloudBookings: BookingRecord[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id),
        sanctuaryId: String(data.sanctuaryId),
        sanctuaryTitle: String(data.sanctuaryTitle),
        location: String(data.location),
        state: String(data.state),
        artworkTheme: data.artworkTheme as BookingRecord['artworkTheme'],
        photoUrl: String(data.photoUrl),
        checkIn: String(data.checkIn),
        checkOut: typeof data.checkOut === 'string' ? data.checkOut : undefined,
        nights: Number(data.nights),
        guests: Number(data.guests),
        adults: typeof data.adults === 'number' ? data.adults : undefined,
        children: typeof data.children === 'number' ? data.children : undefined,
        guestName: String(data.guestName),
        guestEmail: String(data.guestEmail),
        selectedAddonIds: Array.isArray(data.selectedAddonIds)
          ? data.selectedAddonIds.map(String)
          : [],
        baseAmountInr: typeof data.baseAmountInr === 'number' ? data.baseAmountInr : undefined,
        cleaningFeeInr: typeof data.cleaningFeeInr === 'number' ? data.cleaningFeeInr : undefined,
        highlandFeeInr: typeof data.highlandFeeInr === 'number' ? data.highlandFeeInr : undefined,
        totalInr: Number(data.totalInr),
        paymentId: typeof data.paymentId === 'string' ? data.paymentId : undefined,
        paymentMethod: typeof data.paymentMethod === 'string' ? (data.paymentMethod as PaymentMethod) : undefined,
        bookedAt: String(data.bookedAt),
        status: data.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
      };
    });
    const sqlBookings = (sqlData?.bookings ?? []) as BookingRecord[];
    const byId = new Map<string, BookingRecord>();
    [...localBookings, ...sqlBookings, ...cloudBookings].forEach((b) => byId.set(b.id, b));
    const merged = Array.from(byId.values());
    saveLocalBookings(uid, merged);
    return merged;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'bookings');
  }
}

export async function createBookingRecord(
  uid: string,
  booking: BookingRecord,
  nextList: BookingRecord[]
): Promise<'cloud' | 'local'> {
  saveLocalBookings(uid, nextList);
  void recordActivityEvent(
    uid,
    'booking',
    `${booking.guestName} paid ${formatInr(booking.totalInr)} for ${booking.sanctuaryTitle}`,
    booking.state
  );

  if (!isFirebaseVerifiedUser(uid)) {
    return 'local';
  }

  const bookingRef = doc(db, 'bookings', booking.id);
  try {
    const payload: Record<string, unknown> = {
      id: booking.id.slice(0, 64),
      userId: uid,
      sanctuaryId: booking.sanctuaryId.slice(0, 80),
      sanctuaryTitle: booking.sanctuaryTitle.slice(0, 140),
      location: booking.location.slice(0, 100),
      state: booking.state.slice(0, 60),
      artworkTheme: booking.artworkTheme.slice(0, 40),
      photoUrl: booking.photoUrl.slice(0, 300),
      checkIn: booking.checkIn.slice(0, 20),
      nights: Math.min(30, Math.max(1, booking.nights)),
      guests: Math.min(12, Math.max(1, booking.guests)),
      guestName: booking.guestName.slice(0, 100),
      guestEmail: booking.guestEmail.slice(0, 150),
      selectedAddonIds: booking.selectedAddonIds.slice(0, 10).map((s) => s.slice(0, 80)),
      totalInr: Math.max(0, booking.totalInr),
      status: 'Confirmed',
      bookedAt: booking.bookedAt.slice(0, 20),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (booking.checkOut) payload.checkOut = booking.checkOut.slice(0, 20);
    if (typeof booking.adults === 'number') payload.adults = Math.min(12, Math.max(1, booking.adults));
    if (typeof booking.children === 'number') payload.children = Math.min(10, Math.max(0, booking.children));
    if (typeof booking.baseAmountInr === 'number') payload.baseAmountInr = Math.max(0, booking.baseAmountInr);
    if (typeof booking.cleaningFeeInr === 'number') payload.cleaningFeeInr = Math.max(0, booking.cleaningFeeInr);
    if (typeof booking.highlandFeeInr === 'number') payload.highlandFeeInr = Math.max(0, booking.highlandFeeInr);
    if (booking.paymentId) payload.paymentId = booking.paymentId.slice(0, 64);
    if (booking.paymentMethod) payload.paymentMethod = booking.paymentMethod;

    await setDoc(bookingRef, payload);
    void syncBookingToSql(booking);
    return 'cloud';
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${booking.id}`);
  }
}

export async function cancelBookingRecord(
  uid: string,
  bookingId: string,
  nextList: BookingRecord[]
): Promise<'cloud' | 'local'> {
  saveLocalBookings(uid, nextList);
  if (!isFirebaseVerifiedUser(uid)) {
    return 'local';
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  try {
    await updateDoc(bookingRef, {
      status: 'Cancelled',
      updatedAt: serverTimestamp(),
    });
    void syncCancelBookingToSql(bookingId);
    return 'cloud';
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

export async function loadAdminOverview(): Promise<AdminOverviewData> {
  const accounts = getDemoAccounts();
  const savedProfiles = safeReadJson<Record<string, UserProfile>>(USER_PROFILES_KEY, {});
  const userMap = new Map<string, AdminUserSummary>();

  for (const acc of accounts) {
    const profile: UserProfile = savedProfiles[acc.uid] ?? {
      uid: acc.uid,
      name: acc.name,
      email: acc.email,
      avatar: acc.avatar,
      phone: acc.phone,
      location: acc.location,
      isHost: acc.isHost,
      hostEarningsInr: acc.hostEarningsInr,
      authMode: 'demo-local',
      createdAt: acc.createdAt,
    };
    const bookings = getLocalBookings(acc.uid);
    const savedIds = getLocalSavedIds(acc.uid);
    userMap.set(acc.uid, {
      profile,
      bookings,
      savedIds,
      activeToday: acc.createdAt === '2026-11-20' || bookings.length > 0,
    });
  }

  // Merge any Google Firebase profiles stored locally
  for (const [uid, prof] of Object.entries(savedProfiles)) {
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        profile: prof,
        bookings: getLocalBookings(uid),
        savedIds: getLocalSavedIds(uid),
        activeToday: true,
      });
    }
  }

  let firestoreSynced = false;
  let activityFeed = getLocalActivityFeed();

  // If authenticated via verified Firebase Auth as admin, also pull live Firestore collections
  if (
    auth.currentUser &&
    auth.currentUser.emailVerified &&
    (auth.currentUser.email === 'admin@highland.com' ||
      auth.currentUser.email === 'aktaman1014@gmail.com')
  ) {
    try {
      const [usersSnap, bookingsSnap, savedSnap, actSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'saved')),
        getDocs(collection(db, 'activity')),
      ]);

      usersSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const uid = String(d.uid || docSnap.id);
        const existing = userMap.get(uid);
        userMap.set(uid, {
          profile: {
            uid,
            name: String(d.name || existing?.profile.name || 'Traveler'),
            email: String(d.email || existing?.profile.email || ''),
            avatar: String(d.avatar || existing?.profile.avatar || ''),
            phone: String(d.phone || existing?.profile.phone || ''),
            location: String(d.location || existing?.profile.location || 'Assam'),
            isHost: Boolean(d.isHost),
            hostEarningsInr: Number(d.hostEarningsInr || 0),
            authMode: 'firebase-google',
            createdAt: existing?.profile.createdAt || new Date().toISOString().slice(0, 10),
          },
          bookings: existing?.bookings ?? [],
          savedIds: existing?.savedIds ?? [],
          activeToday: true,
        });
      });

      bookingsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const uid = String(d.userId);
        const entry = userMap.get(uid);
        if (entry) {
          const rec: BookingRecord = {
            id: String(d.id),
            sanctuaryId: String(d.sanctuaryId),
            sanctuaryTitle: String(d.sanctuaryTitle),
            location: String(d.location),
            state: String(d.state),
            artworkTheme: d.artworkTheme as BookingRecord['artworkTheme'],
            photoUrl: String(d.photoUrl),
            checkIn: String(d.checkIn),
            checkOut: typeof d.checkOut === 'string' ? d.checkOut : undefined,
            nights: Number(d.nights),
            guests: Number(d.guests),
            adults: typeof d.adults === 'number' ? d.adults : undefined,
            children: typeof d.children === 'number' ? d.children : undefined,
            guestName: String(d.guestName),
            guestEmail: String(d.guestEmail),
            selectedAddonIds: Array.isArray(d.selectedAddonIds) ? d.selectedAddonIds.map(String) : [],
            baseAmountInr: typeof d.baseAmountInr === 'number' ? d.baseAmountInr : undefined,
            cleaningFeeInr: typeof d.cleaningFeeInr === 'number' ? d.cleaningFeeInr : undefined,
            highlandFeeInr: typeof d.highlandFeeInr === 'number' ? d.highlandFeeInr : undefined,
            totalInr: Number(d.totalInr),
            paymentId: typeof d.paymentId === 'string' ? d.paymentId : undefined,
            paymentMethod: typeof d.paymentMethod === 'string' ? (d.paymentMethod as PaymentMethod) : undefined,
            bookedAt: String(d.bookedAt),
            status: d.status === 'Cancelled' ? 'Cancelled' : 'Confirmed',
          };
          if (!entry.bookings.some((b) => b.id === rec.id)) {
            entry.bookings.push(rec);
          }
        }
      });

      savedSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const uid = String(d.userId);
        const sid = String(d.sanctuaryId);
        const entry = userMap.get(uid);
        if (entry && !entry.savedIds.includes(sid)) {
          entry.savedIds.push(sid);
        }
      });

      const cloudActs: ActivityEvent[] = actSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.id),
          userId: String(d.userId),
          type: (d.type as ActivityEvent['type']) || 'save',
          message: String(d.message),
          state: String(d.state || 'Meghalaya'),
          timestampMs: Date.now(),
        };
      });
      if (cloudActs.length > 0) {
        const byId = new Map<string, ActivityEvent>();
        [...cloudActs, ...activityFeed].forEach((a) => byId.set(a.id, a));
        activityFeed = Array.from(byId.values());
      }

      firestoreSynced = true;
    } catch {
      firestoreSynced = false;
    }
  }

  // Include guest session saves/bookings if any exist
  const guestSaved = getLocalSavedIds('guest');
  const guestBookings = getLocalBookings('guest');
  if (guestBookings.length > 0 && !userMap.has('guest')) {
    const latestGuestBooking = guestBookings[0];
    userMap.set('guest', {
      profile: {
        uid: 'guest',
        name: latestGuestBooking.guestName || 'Guest Traveler',
        email: latestGuestBooking.guestEmail || 'guest@highland.com',
        avatar: '',
        phone: '',
        location: latestGuestBooking.state || 'Assam',
        isHost: false,
        hostEarningsInr: 0,
        authMode: 'demo-local',
        createdAt: latestGuestBooking.bookedAt || new Date().toISOString().slice(0, 10),
      },
      bookings: guestBookings,
      savedIds: guestSaved,
      activeToday: true,
    });
  }

  const users = Array.from(userMap.values()).filter((u) => u.profile.email !== 'admin@highland.com');
  const allUserBookings = users.flatMap((u) => u.bookings);
  const bookingMap = new Map<string, BookingRecord>();
  [...allUserBookings, ...guestBookings].forEach((b) => bookingMap.set(b.id, b));
  const allBookings = Array.from(bookingMap.values());

  const totalSavedCount = users.reduce((sum, u) => sum + u.savedIds.length, 0) + (userMap.has('guest') ? 0 : guestSaved.length);

  const totalRevenueInr = allBookings
    .filter((b) => b.status === 'Confirmed')
    .reduce((sum, b) => sum + b.totalInr, 0);

  const activeTodayCount = users.filter((u) => u.activeToday).length;

  activityFeed = [...activityFeed]
    .sort((a, b) => b.timestampMs - a.timestampMs)
    .map((ev) => ({
      ...ev,
      relativeTime: formatRelativeTime(ev.timestampMs),
    }));

  return {
    users,
    allBookings,
    totalSavedCount,
    totalRevenueInr,
    activeTodayCount,
    activityFeed,
    firestoreSynced,
  };
}

export function compressAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const size = 180;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
