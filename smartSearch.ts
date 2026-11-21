import {
  AMENITY_OPTIONS,
  AmenityOption,
  ExperienceCategory,
  HOST_TYPES,
  HostType,
  PROPERTY_TYPES,
  PropertyType,
  Sanctuary,
} from '../data/sanctuaries';

export type AdvancedSortOption =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'most-saved';

export interface FilterState {
  priceMin: number;
  priceMax: number;
  propertyTypes: PropertyType[];
  minRating: number | null;
  amenities: AmenityOption[];
  hostTypes: HostType[];
  states: string[];
  locationQuery: string;
  category: ExperienceCategory;
  instantOnly: boolean;
  sortBy: AdvancedSortOption;
}

export const MIN_PRICE_BOUND = 1000;
export const MAX_PRICE_BOUND = 15000;

export const DEFAULT_FILTER_STATE: FilterState = {
  priceMin: MIN_PRICE_BOUND,
  priceMax: MAX_PRICE_BOUND,
  propertyTypes: [],
  minRating: null,
  amenities: [],
  hostTypes: [],
  states: [],
  locationQuery: '',
  category: 'All Stays',
  instantOnly: false,
  sortBy: 'recommended',
};

export interface StateBadgeMeta {
  state: string;
  shortLabel: string;
  dotColor: string;
  chipBg: string;
  chipBorder: string;
}

export const STATE_FILTER_META: StateBadgeMeta[] = [
  {
    state: 'Assam',
    shortLabel: 'Assam',
    dotColor: '#10B981',
    chipBg: '#ECFDF5',
    chipBorder: '#6EE7B7',
  },
  {
    state: 'Meghalaya',
    shortLabel: 'Meghalaya',
    dotColor: '#0EA5E9',
    chipBg: '#F0F9FF',
    chipBorder: '#7DD3FC',
  },
  {
    state: 'Arunachal Pradesh',
    shortLabel: 'Arunachal',
    dotColor: '#6366F1',
    chipBg: '#EEF2FF',
    chipBorder: '#A5B4FC',
  },
  {
    state: 'Nagaland',
    shortLabel: 'Nagaland',
    dotColor: '#EF4444',
    chipBg: '#FEF2F2',
    chipBorder: '#FCA5A5',
  },
  {
    state: 'Manipur',
    shortLabel: 'Manipur',
    dotColor: '#EC4899',
    chipBg: '#FDF2F8',
    chipBorder: '#F9A8D4',
  },
  {
    state: 'Mizoram',
    shortLabel: 'Mizoram',
    dotColor: '#14B8A6',
    chipBg: '#F0FDFA',
    chipBorder: '#5EEAD4',
  },
  {
    state: 'Sikkim',
    shortLabel: 'Sikkim',
    dotColor: '#F59E0B',
    chipBg: '#FFFBEB',
    chipBorder: '#FCD34D',
  },
  {
    state: 'Tripura',
    shortLabel: 'Tripura',
    dotColor: '#8B5CF6',
    chipBg: '#F5F3FF',
    chipBorder: '#C4B5FD',
  },
];

export const PRICE_PRESETS: { label: string; min: number; max: number }[] = [
  { label: 'Under 3k', min: MIN_PRICE_BOUND, max: 3000 },
  { label: '3k-6k', min: 3000, max: 6000 },
  { label: '6k-10k', min: 6000, max: 10000 },
  { label: '10k+', min: 10000, max: MAX_PRICE_BOUND },
];

export const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: '4.5+ Superhost', value: 4.5 },
  { label: '4.0+', value: 4.0 },
  { label: '3.5+', value: 3.5 },
];

export const SORT_OPTIONS: { label: string; value: AdvancedSortOption }[] = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Price low-high', value: 'price-asc' },
  { label: 'Price high-low', value: 'price-desc' },
  { label: 'Highest Rated', value: 'rating-desc' },
  { label: 'Most Saved', value: 'most-saved' },
];

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export function buildPriceHistogram(
  stays: Sanctuary[],
  bucketCount = 14
): HistogramBucket[] {
  const span = (MAX_PRICE_BOUND - MIN_PRICE_BOUND) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, idx) => ({
    min: Math.round(MIN_PRICE_BOUND + idx * span),
    max: Math.round(MIN_PRICE_BOUND + (idx + 1) * span),
    count: 0,
  }));

  for (const stay of stays) {
    const clamped = Math.max(MIN_PRICE_BOUND, Math.min(MAX_PRICE_BOUND - 1, stay.pricePerNightInr));
    const idx = Math.min(
      bucketCount - 1,
      Math.floor((clamped - MIN_PRICE_BOUND) / span)
    );
    buckets[idx].count += 1;
  }
  return buckets;
}

export function filterAndSortSanctuaries(
  stays: Sanctuary[],
  filters: FilterState,
  userSavedIds: string[]
): Sanctuary[] {
  const normalizedQuery = filters.locationQuery.trim().toLowerCase();

  const filtered = stays.filter((stay) => {
    if (stay.pricePerNightInr < filters.priceMin || stay.pricePerNightInr > filters.priceMax) {
      return false;
    }
    if (
      filters.propertyTypes.length > 0 &&
      !filters.propertyTypes.includes(stay.propertyType)
    ) {
      return false;
    }
    if (filters.minRating !== null && stay.rating < filters.minRating) {
      return false;
    }
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((amenity) => stay.amenities.includes(amenity))
    ) {
      return false;
    }
    if (filters.hostTypes.length > 0 && !filters.hostTypes.includes(stay.hostType)) {
      return false;
    }
    if (filters.states.length > 0 && !filters.states.includes(stay.state)) {
      return false;
    }
    if (filters.category !== 'All Stays' && stay.category !== filters.category) {
      return false;
    }
    if (filters.instantOnly && !stay.instantReserve) {
      return false;
    }
    if (normalizedQuery) {
      const haystack = [
        stay.title,
        stay.subtitle,
        stay.location,
        stay.state,
        stay.propertyType,
        stay.hostType,
        ...stay.highlights,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  if (filters.sortBy === 'price-asc') {
    return [...filtered].sort((a, b) => a.pricePerNightInr - b.pricePerNightInr);
  }
  if (filters.sortBy === 'price-desc') {
    return [...filtered].sort((a, b) => b.pricePerNightInr - a.pricePerNightInr);
  }
  if (filters.sortBy === 'rating-desc') {
    return [...filtered].sort((a, b) => b.rating - a.rating);
  }
  if (filters.sortBy === 'most-saved') {
    return [...filtered].sort((a, b) => {
      const aSaves = a.savedCount + (userSavedIds.includes(a.id) ? 1 : 0);
      const bSaves = b.savedCount + (userSavedIds.includes(b.id) ? 1 : 0);
      return bSaves - aSaves;
    });
  }
  return filtered;
}

export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.priceMin !== MIN_PRICE_BOUND ||
    filters.priceMax !== MAX_PRICE_BOUND ||
    filters.propertyTypes.length > 0 ||
    filters.minRating !== null ||
    filters.amenities.length > 0 ||
    filters.hostTypes.length > 0 ||
    filters.states.length > 0 ||
    filters.locationQuery.trim().length > 0 ||
    filters.category !== 'All Stays' ||
    filters.instantOnly ||
    filters.sortBy !== 'recommended'
  );
}

export function describeActiveFilters(filters: FilterState): string[] {
  const parts: string[] = [];

  if (filters.priceMin !== MIN_PRICE_BOUND || filters.priceMax !== MAX_PRICE_BOUND) {
    parts.push(`Rs. ${filters.priceMin.toLocaleString('en-IN')}-${filters.priceMax.toLocaleString('en-IN')}`);
  }
  if (filters.states.length > 0) {
    parts.push(
      filters.states
        .map((s) => (s === 'Arunachal Pradesh' ? 'Arunachal' : s))
        .join(', ')
    );
  }
  if (filters.locationQuery.trim()) {
    parts.push(filters.locationQuery.trim());
  }
  if (filters.propertyTypes.length > 0) {
    parts.push(filters.propertyTypes.join(', '));
  }
  if (filters.minRating !== null) {
    parts.push(filters.minRating === 4.5 ? '4.5+ Superhost' : `${filters.minRating.toFixed(1)}+ Rating`);
  }
  if (filters.amenities.length > 0) {
    parts.push(filters.amenities.join(', '));
  }
  if (filters.hostTypes.length > 0) {
    parts.push(filters.hostTypes.join(', '));
  }
  if (filters.category !== 'All Stays') {
    parts.push(filters.category);
  }
  if (filters.instantOnly) {
    parts.push('Instant Reserve');
  }
  return parts;
}

export function serializeFiltersToUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  if (filters.priceMin !== MIN_PRICE_BOUND) {
    params.set('minPrice', String(filters.priceMin));
  }
  if (filters.priceMax !== MAX_PRICE_BOUND) {
    params.set('maxPrice', String(filters.priceMax));
  }
  if (filters.propertyTypes.length > 0) {
    params.set('types', filters.propertyTypes.join(','));
  }
  if (filters.minRating !== null) {
    params.set('rating', String(filters.minRating));
  }
  if (filters.amenities.length > 0) {
    params.set('amenities', filters.amenities.join(','));
  }
  if (filters.hostTypes.length > 0) {
    params.set('hosts', filters.hostTypes.join(','));
  }
  if (filters.states.length > 0) {
    params.set('states', filters.states.join(','));
  }
  if (filters.locationQuery.trim()) {
    params.set('q', filters.locationQuery.trim());
  }
  if (filters.category !== 'All Stays') {
    params.set('category', filters.category);
  }
  if (filters.instantOnly) {
    params.set('instant', '1');
  }
  if (filters.sortBy !== 'recommended') {
    params.set('sort', filters.sortBy);
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

export function parseFiltersFromUrl(search: string): FilterState {
  const params = new URLSearchParams(search);
  const rawMin = Number(params.get('minPrice'));
  const rawMax = Number(params.get('maxPrice'));
  const priceMin =
    !Number.isNaN(rawMin) && rawMin >= MIN_PRICE_BOUND && rawMin <= MAX_PRICE_BOUND
      ? rawMin
      : MIN_PRICE_BOUND;
  const priceMax =
    !Number.isNaN(rawMax) && rawMax >= priceMin && rawMax <= MAX_PRICE_BOUND
      ? rawMax
      : MAX_PRICE_BOUND;

  const validTypes = new Set<string>(PROPERTY_TYPES);
  const propertyTypes = (params.get('types') || '')
    .split(',')
    .filter((v): v is PropertyType => validTypes.has(v));

  const rawRating = Number(params.get('rating'));
  const minRating =
    rawRating === 4.5 || rawRating === 4.0 || rawRating === 3.5 ? rawRating : null;

  const validAmenities = new Set<string>(AMENITY_OPTIONS);
  const amenities = (params.get('amenities') || '')
    .split(',')
    .filter((v): v is AmenityOption => validAmenities.has(v));

  const validHosts = new Set<string>(HOST_TYPES);
  const hostTypes = (params.get('hosts') || '')
    .split(',')
    .filter((v): v is HostType => validHosts.has(v));

  const validStates = new Set(STATE_FILTER_META.map((s) => s.state));
  const states = (params.get('states') || '')
    .split(',')
    .filter((s) => validStates.has(s));

  const locationQuery = params.get('q') || '';
  const rawCategory = params.get('category') as ExperienceCategory | null;
  const validCategories: ExperienceCategory[] = [
    'All Stays',
    'Wildlife & River',
    'Living Root & Lakes',
    'Monastery & Passes',
    'Valley & Flowers',
    'Heritage & Palaces',
  ];
  const category =
    rawCategory && validCategories.includes(rawCategory) ? rawCategory : 'All Stays';

  const instantOnly = params.get('instant') === '1';

  const rawSort = params.get('sort') as AdvancedSortOption | null;
  const validSorts: AdvancedSortOption[] = [
    'recommended',
    'price-asc',
    'price-desc',
    'rating-desc',
    'most-saved',
  ];
  const sortBy = rawSort && validSorts.includes(rawSort) ? rawSort : 'recommended';

  return {
    priceMin,
    priceMax,
    propertyTypes,
    minRating,
    amenities,
    hostTypes,
    states,
    locationQuery,
    category,
    instantOnly,
    sortBy,
  };
}

export interface ParsedSmartChip {
  key: string;
  label: string;
}

export interface SmartSearchResult {
  nextFilters: FilterState;
  chips: ParsedSmartChip[];
  appliedCount: number;
}

function parseKNumber(token: string): number {
  const cleaned = token.toLowerCase().replace(/,/g, '').trim();
  if (cleaned.endsWith('k')) {
    return Math.round(parseFloat(cleaned.slice(0, -1)) * 1000);
  }
  return Math.round(parseFloat(cleaned));
}

const DESTINATION_KEYWORDS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bkaziranga\b/i, label: 'Kaziranga' },
  { pattern: /\bkohora\b/i, label: 'Kohora' },
  { pattern: /\bmajuli\b/i, label: 'Majuli' },
  { pattern: /\bdibrugarh\b/i, label: 'Dibrugarh' },
  { pattern: /\bdawki\b/i, label: 'Dawki' },
  { pattern: /\bcherrapunji\b/i, label: 'Cherrapunji' },
  { pattern: /\bsohra\b/i, label: 'Sohra' },
  { pattern: /\bnongriat\b/i, label: 'Nongriat' },
  { pattern: /\bmawlynnong\b/i, label: 'Mawlynnong' },
  { pattern: /\btawang\b/i, label: 'Tawang' },
  { pattern: /\bziro\b/i, label: 'Ziro' },
  { pattern: /\bsela\b/i, label: 'Sela Pass' },
  { pattern: /\bdzuko[u]?\b/i, label: 'Dzuko' },
  { pattern: /\bkhonoma\b/i, label: 'Khonoma' },
  { pattern: /\bkohima\b/i, label: 'Kohima' },
  { pattern: /\btsomgo\b/i, label: 'Tsomgo' },
  { pattern: /\bnathula\b/i, label: 'Nathula' },
  { pattern: /\bdzongu\b/i, label: 'Dzongu' },
  { pattern: /\bloktak\b/i, label: 'Loktak' },
  { pattern: /\bmoirang\b/i, label: 'Moirang' },
  { pattern: /\bphawngpui\b/i, label: 'Phawngpui' },
  { pattern: /\breiek\b/i, label: 'Reiek' },
  { pattern: /\bneermahal\b/i, label: 'Neermahal' },
  { pattern: /\bunakoti\b/i, label: 'Unakoti' },
  { pattern: /\broot bridge\b/i, label: 'Living Root Bridge' },
  { pattern: /\btea garden[s]?\b/i, label: 'Tea Gardens' },
];

const STATE_KEYWORDS: { pattern: RegExp; state: string }[] = [
  { pattern: /\bassam\b/i, state: 'Assam' },
  { pattern: /\bmeghalaya\b/i, state: 'Meghalaya' },
  { pattern: /\barunachal(?:\s+pradesh)?\b/i, state: 'Arunachal Pradesh' },
  { pattern: /\bnagaland\b/i, state: 'Nagaland' },
  { pattern: /\bmanipur\b/i, state: 'Manipur' },
  { pattern: /\bmizoram\b/i, state: 'Mizoram' },
  { pattern: /\bsikkim\b/i, state: 'Sikkim' },
  { pattern: /\btripura\b/i, state: 'Tripura' },
];

export function parseSmartSearchQuery(rawQuery: string): SmartSearchResult {
  const query = rawQuery.trim();
  const next: FilterState = { ...DEFAULT_FILTER_STATE };
  const chips: ParsedSmartChip[] = [];

  if (!query) {
    return { nextFilters: next, chips, appliedCount: 0 };
  }

  // 1. Destinations / Location keywords
  for (const dest of DESTINATION_KEYWORDS) {
    if (dest.pattern.test(query)) {
      next.locationQuery = dest.label;
      chips.push({ key: 'location', label: `Location=${dest.label}` });
      break;
    }
  }

  // 2. States
  const matchedStates: string[] = [];
  for (const st of STATE_KEYWORDS) {
    if (st.pattern.test(query)) {
      matchedStates.push(st.state);
    }
  }
  if (matchedStates.length > 0) {
    next.states = matchedStates;
    chips.push({
      key: 'states',
      label: `State=${matchedStates.map((s) => (s === 'Arunachal Pradesh' ? 'Arunachal' : s)).join(', ')}`,
    });
  }

  // 3. Property types
  const matchedTypes: PropertyType[] = [];
  if (/\bhomestay[s]?\b/i.test(query)) matchedTypes.push('Homestay');
  if (/\bcottage[s]?\b/i.test(query)) matchedTypes.push('Cottage');
  if (/\bbamboo(?:\s*hut[s]?)?\b/i.test(query)) matchedTypes.push('Bamboo Hut');
  if (/\bhouseboat[s]?\b|\bfloating\b/i.test(query)) matchedTypes.push('Houseboat (Loktak)');
  if (/\btree\s*house[s]?\b/i.test(query)) matchedTypes.push('Treehouse');
  if (/\btea\s*estate\b|\bbungalow[s]?\b/i.test(query)) matchedTypes.push('Tea Estate Bungalow');
  if (matchedTypes.length > 0) {
    next.propertyTypes = matchedTypes;
    chips.push({ key: 'propertyTypes', label: `Type=${matchedTypes.join(', ')}` });
  }

  // 4. Amenities
  const matchedAmenities: AmenityOption[] = [];
  if (/\bwi-?fi\b|\binternet\b/i.test(query)) matchedAmenities.push('WiFi');
  if (/\bbonfire\b|\bcampfire\b|\bfire\s*pit\b/i.test(query)) matchedAmenities.push('Bonfire');
  if (/\blocal\s*food\b|\bfood\b|\bmeals\b|\bbreakfast\b|\bdinner\b/i.test(query)) {
    matchedAmenities.push('Local Food');
  }
  if (/\bhot\s*water\b|\bgeyser\b/i.test(query)) matchedAmenities.push('Hot Water');
  if (/\btrek(?:\s*guide)?\b|\bhike\b|\btrail\b/i.test(query)) matchedAmenities.push('Trek Guide');
  if (/\briver\s*view\b|\blake\s*view\b|\bwaterfront\b/i.test(query)) {
    matchedAmenities.push('River View');
  }
  if (/\bpet(?:\s*friendly)?\b|\bdog\b|\bcat\b/i.test(query)) {
    matchedAmenities.push('Pet Friendly');
  }
  if (/\bparking\b|\bcar\b/i.test(query)) matchedAmenities.push('Parking');
  if (matchedAmenities.length > 0) {
    next.amenities = matchedAmenities;
    chips.push({ key: 'amenities', label: `Amenity=${matchedAmenities.join(', ')}` });
  }

  // 5. Host Types
  const matchedHosts: HostType[] = [];
  if (/\bsuperhost\b/i.test(query)) matchedHosts.push('Superhost');
  if (/\bartisan\b/i.test(query)) matchedHosts.push('Local Artisan');
  if (/\btea\s*tribe\b/i.test(query)) matchedHosts.push('Tea Tribe');
  if (/\bnaga\s*weaver\b|\bweaver\b/i.test(query)) matchedHosts.push('Naga Weaver');
  if (/\bkhasi(?:\s*family)?\b/i.test(query)) matchedHosts.push('Khasi Family');
  if (matchedHosts.length > 0) {
    next.hostTypes = matchedHosts;
    chips.push({ key: 'hostTypes', label: `Host=${matchedHosts.join(', ')}` });
  }

  // 6. Price range & budget intent
  const rangeMatch = query.match(
    /(?:between\s+)?(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?k?|\d{3,5})\s*(?:-|to|and)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?k?|\d{3,5})/i
  );
  const underMatch = query.match(
    /(?:under|below|less than|max|upto|up to|<|<=)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?k?|\d{3,5})/i
  );
  const overMatch = query.match(
    /(?:above|over|more than|min|>=|>)\s*(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?k?|\d{3,5})/i
  );
  const plusMatch = query.match(/(?:rs\.?|₹)?\s*(\d+(?:\.\d+)?k|\d{4,5})\+/i);

  if (rangeMatch) {
    const a = parseKNumber(rangeMatch[1]);
    const b = parseKNumber(rangeMatch[2]);
    next.priceMin = Math.max(MIN_PRICE_BOUND, Math.min(a, b));
    next.priceMax = Math.min(MAX_PRICE_BOUND, Math.max(a, b));
    chips.push({
      key: 'price',
      label: `Price ₹${next.priceMin.toLocaleString('en-IN')}-₹${next.priceMax.toLocaleString('en-IN')}`,
    });
  } else if (underMatch) {
    const cap = parseKNumber(underMatch[1]);
    next.priceMax = Math.max(MIN_PRICE_BOUND, Math.min(MAX_PRICE_BOUND, cap));
    chips.push({ key: 'price', label: `Price < ₹${next.priceMax.toLocaleString('en-IN')}` });
  } else if (plusMatch || overMatch) {
    const floor = parseKNumber((plusMatch || overMatch)![1]);
    next.priceMin = Math.max(MIN_PRICE_BOUND, Math.min(MAX_PRICE_BOUND, floor));
    chips.push({ key: 'price', label: `Price ≥ ₹${next.priceMin.toLocaleString('en-IN')}` });
  } else if (/\bcheap\b|\bbudget\b|\baffordable\b|\beconomy\b/i.test(query)) {
    next.priceMax = 4000;
    next.sortBy = 'price-asc';
    chips.push({ key: 'price', label: 'Budget ≤ ₹4,000' });
  } else if (/\bluxury\b|\bpremium\b|\bheritage\b/i.test(query)) {
    next.priceMin = 7000;
    chips.push({ key: 'price', label: 'Premium ≥ ₹7,000' });
  }

  // 7. Rating & Sort hints
  if (/\b4\.5\+?\b|\btop\s*rated\b|\bbest\s*rated\b/i.test(query)) {
    next.minRating = 4.5;
    chips.push({ key: 'rating', label: 'Rating=4.5+ Superhost' });
  } else if (/\b4\.0\+?\b|\b4\+\b/i.test(query)) {
    next.minRating = 4.0;
    chips.push({ key: 'rating', label: 'Rating=4.0+' });
  }

  if (/\bmost\s*saved\b|\bpopular\b|\btrending\b/i.test(query)) {
    next.sortBy = 'most-saved';
    chips.push({ key: 'sort', label: 'Sort=Most Saved' });
  } else if (/\bhighest\s*rated\b/i.test(query)) {
    next.sortBy = 'rating-desc';
    chips.push({ key: 'sort', label: 'Sort=Highest Rated' });
  } else if (/\blowest\s*price\b|\bcheapest\b/i.test(query) && next.sortBy === 'recommended') {
    next.sortBy = 'price-asc';
    chips.push({ key: 'sort', label: 'Sort=Price low-high' });
  }

  // Fallback: if user typed a word/place we didn't have in our fixed list, still treat as text query
  if (chips.length === 0) {
    next.locationQuery = query;
    chips.push({ key: 'location', label: `Search="${query}"` });
  }

  return {
    nextFilters: next,
    chips,
    appliedCount: chips.length,
  };
}
