export type ExperienceCategory =
  | 'All Stays'
  | 'Wildlife & River'
  | 'Living Root & Lakes'
  | 'Monastery & Passes'
  | 'Valley & Flowers'
  | 'Heritage & Palaces';

export type SceneVariant = 'photo' | 'interior' | 'trail';

export type ArtworkTheme =
  | 'assam'
  | 'meghalaya'
  | 'arunachal'
  | 'nagaland'
  | 'sikkim'
  | 'manipur'
  | 'mizoram'
  | 'tripura';

export interface StateSpotlight {
  state: string;
  tagline: string;
  highlights: string;
  imageUrl: string;
  imageAlt: string;
  accentLabel: string;
}

export interface TrailAddon {
  id: string;
  title: string;
  duration: string;
  priceInr: number;
  description: string;
}

export interface HostProfile {
  name: string;
  lineage: string;
  craft: string;
  yearsHosting: number;
  verifiedEcoGuide: boolean;
  quote: string;
  bio: string;
  languages: string[];
  initials: string;
}

export interface WeatherSnapshot {
  tempC: number;
  condition: string;
  mistIndex: string;
  trailStatus: 'Clear & Sunny' | 'Crisp Alpine' | 'Morning Mist';
  sunrise: string;
}

export type PropertyType =
  | 'Homestay'
  | 'Cottage'
  | 'Bamboo Hut'
  | 'Houseboat (Loktak)'
  | 'Treehouse'
  | 'Tea Estate Bungalow';

export type AmenityOption =
  | 'WiFi'
  | 'Bonfire'
  | 'Local Food'
  | 'Hot Water'
  | 'Trek Guide'
  | 'River View'
  | 'Pet Friendly'
  | 'Parking';

export type HostType =
  | 'Superhost'
  | 'Local Artisan'
  | 'Tea Tribe'
  | 'Naga Weaver'
  | 'Khasi Family';

export const PROPERTY_TYPES: PropertyType[] = [
  'Homestay',
  'Cottage',
  'Bamboo Hut',
  'Houseboat (Loktak)',
  'Treehouse',
  'Tea Estate Bungalow',
];

export const AMENITY_OPTIONS: AmenityOption[] = [
  'WiFi',
  'Bonfire',
  'Local Food',
  'Hot Water',
  'Trek Guide',
  'River View',
  'Pet Friendly',
  'Parking',
];

export const HOST_TYPES: HostType[] = [
  'Superhost',
  'Local Artisan',
  'Tea Tribe',
  'Naga Weaver',
  'Khasi Family',
];

export interface Sanctuary {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  state: string;
  highlights: string[];
  category: Exclude<ExperienceCategory, 'All Stays'>;
  propertyType: PropertyType;
  amenities: AmenityOption[];
  hostType: HostType;
  savedCount: number;
  elevationMeters: number;
  pricePerNightInr: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  artworkTheme: ArtworkTheme;
  photoUrl: string;
  photoAlt: string;
  scenes: {
    variant: SceneVariant;
    caption: string;
  }[];
  summary: string;
  architectureNote: string;
  etiquetteTips: string[];
  trailDistanceKm: number;
  trailDifficulty: 'Gentle' | 'Moderate' | 'Alpine Ridge';
  elevationProfile: number[];
  mapCoords: { x: number; y: number };
  weather: WeatherSnapshot;
  host: HostProfile;
  addons: TrailAddon[];
  instantReserve: boolean;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Net Banking' | 'Pay at Property';

export interface ItineraryDayPlan {
  day: number;
  date: string;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export interface CheckoutDraft {
  sanctuary: Sanctuary;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  selectedAddonIds: string[];
  baseAmountInr: number;
  cleaningFeeInr: number;
  highlandFeeInr: number;
  addonsTotalInr: number;
  totalInr: number;
}

export interface BookingRecord {
  id: string;
  sanctuaryId: string;
  sanctuaryTitle: string;
  location: string;
  state: string;
  artworkTheme: ArtworkTheme;
  photoUrl: string;
  checkIn: string;
  checkOut?: string;
  nights: number;
  guests: number;
  adults?: number;
  children?: number;
  guestName: string;
  guestEmail: string;
  selectedAddonIds: string[];
  baseAmountInr?: number;
  cleaningFeeInr?: number;
  highlandFeeInr?: number;
  totalInr: number;
  paymentId?: string;
  paymentMethod?: PaymentMethod;
  itineraryDays?: ItineraryDayPlan[];
  bookedAt: string;
  status: 'Confirmed' | 'Cancelled';
}

export const STATE_SPOTLIGHTS: StateSpotlight[] = [
  {
    state: 'Assam',
    tagline: 'Rhinos, river islands & emerald tea estates',
    highlights: 'Kaziranga · Majuli · Tea Gardens',
    imageUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
    imageAlt: 'One-horned rhino walking beside sunlit Kaziranga grasslands and Assam tea gardens',
    accentLabel: 'Wildlife & Tea',
  },
  {
    state: 'Meghalaya',
    tagline: 'Crystal rivers & century-old living bridges',
    highlights: 'Living Root Bridge · Dawki · Cherrapunji',
    imageUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
    imageAlt: 'Crystal clear emerald Dawki river boating under lush Meghalaya cliffs',
    accentLabel: 'Crystal Waters',
  },
  {
    state: 'Arunachal Pradesh',
    tagline: 'Snow-crowned monasteries & emerald pine valleys',
    highlights: 'Tawang Monastery · Ziro Valley · Sela Pass',
    imageUrl: '/src/assets/images/arunachal_tawang_snow_1795236949484.jpg',
    imageAlt: 'Sunlit Tawang Monastery perched on snowy Himalayan ridge with prayer flags',
    accentLabel: 'Himalayan Passes',
  },
  {
    state: 'Nagaland',
    tagline: 'Wildflower ridge valleys & vibrant Hornbill heritage',
    highlights: 'Dzuko Valley · Hornbill · Khonoma',
    imageUrl: '/src/assets/images/nagaland_dzuko_flowers_1795236949408.jpg',
    imageAlt: 'Dzuko Valley blooming pink and white lilies across sunlit green hills in Nagaland',
    accentLabel: 'Blooming Valleys',
  },
  {
    state: 'Sikkim',
    tagline: 'Sapphire glacial lakes & high mountain passes',
    highlights: 'Tsomgo Lake · Nathula · Dzongu',
    imageUrl: '/src/assets/images/sikkim_tsomgo_lake_1795236949322.jpg',
    imageAlt: 'Tsomgo Lake reflecting snow-capped Sikkim peaks with colorful prayer flags',
    accentLabel: 'Glacial Lakes',
  },
  {
    state: 'Manipur',
    tagline: 'Floating phumdi rings & serene sunrise canoes',
    highlights: 'Loktak Lake · Keibul Lamjao · Moirang',
    imageUrl: '/src/assets/images/manipur_loktak_lake_1795236949260.jpg',
    imageAlt: 'Loktak Lake floating circular green phumdis and wooden canoe at golden sunrise',
    accentLabel: 'Floating Islands',
  },
  {
    state: 'Mizoram',
    tagline: 'Blue Mountain ridges & terraced bamboo horizons',
    highlights: 'Phawngpui · Reiek · Vantawng Falls',
    imageUrl: '/src/assets/images/mizoram_phawngpui_hills_1795236949939.jpg',
    imageAlt: 'Phawngpui Blue Mountain sunlit terraced hills and blooming rhododendrons in Mizoram',
    accentLabel: 'Blue Mountains',
  },
  {
    state: 'Tripura',
    tagline: 'Island water palaces & sculpted sandstone cliffs',
    highlights: 'Neermahal · Rudrasagar · Unakoti',
    imageUrl: '/src/assets/images/tripura_neermahal_palace_1795236949140.jpg',
    imageAlt: 'Neermahal white and coral water palace rising from sparkling blue Rudrasagar Lake',
    accentLabel: 'Lake Palace',
  },
];

export const REGIONS = [
  'All 8 States',
  'Assam',
  'Meghalaya',
  'Arunachal Pradesh',
  'Nagaland',
  'Sikkim',
  'Manipur',
  'Mizoram',
  'Tripura',
] as const;

export const CATEGORIES: ExperienceCategory[] = [
  'All Stays',
  'Wildlife & River',
  'Living Root & Lakes',
  'Monastery & Passes',
  'Valley & Flowers',
  'Heritage & Palaces',
];

export const SANCTUARIES: Sanctuary[] = [
  {
    id: 'kaziranga-majuli-haven',
    title: 'Kaziranga Tea & Majuli River Pavilion',
    subtitle: 'Single-origin Assam tea veranda bridging rhino grasslands and Majuli bamboo stilts',
    location: 'Kaziranga & Majuli Circuit',
    state: 'Assam',
    highlights: ['Kaziranga', 'Majuli', 'Tea Gardens'],
    category: 'Wildlife & River',
    propertyType: 'Tea Estate Bungalow',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'River View', 'Parking'],
    hostType: 'Tea Tribe',
    savedCount: 184,
    elevationMeters: 95,
    pricePerNightInr: 7400,
    rating: 4.95,
    reviewCount: 118,
    maxGuests: 5,
    bedrooms: 2,
    artworkTheme: 'assam',
    photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
    photoAlt: 'Kaziranga one-horned rhino and rolling sunlit Assam tea gardens',
    scenes: [
      { variant: 'photo', caption: 'Dawn safari trails beside Kaziranga and orthodox tea slopes' },
      { variant: 'interior', caption: 'Hand-spun eri silk suite and woven bamboo Chang Ghar lounge' },
      { variant: 'trail', caption: 'Wooden country boat crossing the golden Brahmaputra at Majuli' },
    ],
    summary:
      'Wake to crisp Assam second-flush tea on an airy light-oak veranda overlooking manicured emerald tea rows, minutes from Kaziranga’s eastern elephant-grass safari range and a scenic ferry ride to Majuli’s Mising stilt villages.',
    architectureNote:
      'Elevated teak-and-bamboo pavilion designed for natural cross-breezes with locally loomed Mising textiles.',
    etiquetteTips: [
      'Dawn jeep tracks in Kaziranga begin at 05:30; wear earthy sunlit tones and pack binoculars.',
      'Remove shoes before entering Majuli Satra mask-making courtyards.',
      'Support island silk weavers directly at the Kamalabari cooperative.',
    ],
    trailDistanceKm: 9.4,
    trailDifficulty: 'Gentle',
    elevationProfile: [82, 88, 95, 112, 108, 96, 85],
    mapCoords: { x: 405, y: 205 },
    weather: {
      tempC: 24,
      condition: 'Golden Sun & Breeze',
      mistIndex: 'Clear Visibility',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:16 IST',
    },
    host: {
      name: 'Jitumoni & Devika Baruah',
      lineage: 'Upper Assam & Mising Heritage',
      craft: 'Orthodox Tea Master & Eri Silk Weaver',
      yearsHosting: 14,
      verifiedEcoGuide: true,
      quote: 'From Kaziranga tall grass to Majuli river sandbars, Assam lives in rhythm with water and leaf.',
      bio: 'Jitumoni guides responsible rhino conservation tracks while Devika curates estate tea cuppings and handloom silk workshops.',
      languages: ['Assamese', 'Mising', 'English', 'Hindi'],
      initials: 'JB',
    },
    addons: [
      {
        id: 'kaziranga-jeep',
        title: 'Kaziranga Eastern Range Dawn Safari',
        duration: '4 hrs',
        priceInr: 2400,
        description: 'Open-gypsy naturalist track spotting one-horned rhinos and swamp deer.',
      },
      {
        id: 'majuli-mask-boat',
        title: 'Majuli Island Ferry & Satra Mask Studio',
        duration: '5 hrs',
        priceInr: 1650,
        description: 'Explore 16th-century river monasteries and traditional bamboo craft.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'dawki-sohra-sanctuary',
    title: 'Dawki Crystal Waters & Root Bridge Loft',
    subtitle: 'Sunlit limestone sanctuary linking Umngot crystal boating with Cherrapunji root trails',
    location: 'Dawki & Sohra (Cherrapunji)',
    state: 'Meghalaya',
    highlights: ['Living Root Bridge', 'Dawki', 'Cherrapunji'],
    category: 'Living Root & Lakes',
    propertyType: 'Cottage',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'Trek Guide', 'River View', 'Parking'],
    hostType: 'Khasi Family',
    savedCount: 242,
    elevationMeters: 1280,
    pricePerNightInr: 6900,
    rating: 4.97,
    reviewCount: 142,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'meghalaya',
    photoUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
    photoAlt: 'Crystal clear emerald Dawki Umngot River with wooden boats in Meghalaya',
    scenes: [
      { variant: 'photo', caption: 'Glass-clear turquoise waters of the Umngot River in Dawki' },
      { variant: 'interior', caption: 'Sun-washed Khasi pine loft with cane lanterns and canyon views' },
      { variant: 'trail', caption: 'Century-old Ficus elastica living root bridge near Nongriat' },
    ],
    summary:
      'Set along the luminous ridge between Cherrapunji’s cascading waterfalls and Dawki’s emerald Umngot river canyon, this light-oak and Khasi timber retreat places you minutes from crystal-clear wooden boat landings and living root trails.',
    architectureNote:
      'Crafted from seasoned Sohra timber, river-stone plinths, and breezy panoramic windows overlooking turquoise valleys.',
    etiquetteTips: [
      'Walk single-file across living root bridges to protect growing aerial tendrils.',
      'Use reef-safe mineral sunblock before kayaking or swimming in Dawki pools.',
      'Carry reusable flasks; spring-filtered water jars are replenished every morning.',
    ],
    trailDistanceKm: 6.8,
    trailDifficulty: 'Moderate',
    elevationProfile: [1280, 1120, 940, 680, 420, 790, 1050],
    mapCoords: { x: 255, y: 248 },
    weather: {
      tempC: 21,
      condition: 'Bright Canyon Sun',
      mistIndex: 'Crystal River Glow',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:40 IST',
    },
    host: {
      name: 'Kong Bahlin Kharshiing',
      lineage: 'Khasi Matrilineal Lineage',
      craft: 'Living Root Keeper & River Boat Guide',
      yearsHosting: 11,
      verifiedEcoGuide: true,
      quote: 'When sunlight hits the Umngot river, every pebble gleams like emerald glass.',
      bio: 'Steward of Nongriat’s living root pathways and Shnongpdeng river camps, Bahlin crafts slow-travel itineraries across East Khasi Hills.',
      languages: ['Khasi', 'English', 'Hindi'],
      initials: 'BK',
    },
    addons: [
      {
        id: 'dawki-glass-boat',
        title: 'Umngot Crystal River Sunrise Boating',
        duration: '2.5 hrs',
        priceInr: 1350,
        description: 'Quiet wooden rowboat glide over transparent turquoise riverbeds.',
      },
      {
        id: 'nongriat-root-trek',
        title: 'Double-Decker Living Root & Waterfall Trek',
        duration: '4.5 hrs',
        priceInr: 1800,
        description: 'Early morning guided walk through Sohra canyon and Rainbow Falls.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'tawang-ziro-hermitage',
    title: 'Tawang Snow Ridge & Ziro Pine Chalet',
    subtitle: 'Alpine Monpa stone chalet framing Sela Pass peaks, Tawang Monastery, and Ziro greens',
    location: 'Tawang, Sela Pass & Ziro',
    state: 'Arunachal Pradesh',
    highlights: ['Tawang Monastery', 'Ziro Valley', 'Sela Pass'],
    category: 'Monastery & Passes',
    propertyType: 'Cottage',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Trek Guide', 'Parking'],
    hostType: 'Superhost',
    savedCount: 158,
    elevationMeters: 3048,
    pricePerNightInr: 8600,
    rating: 4.94,
    reviewCount: 79,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'arunachal',
    photoUrl: '/src/assets/images/arunachal_tawang_snow_1795236949484.jpg',
    photoAlt: 'Tawang Monastery with golden roofs under snow-capped Himalayan peaks and prayer flags',
    scenes: [
      { variant: 'photo', caption: 'Golden rooftops of Tawang Monastery beneath snow-dusted ridges' },
      { variant: 'interior', caption: 'Warm pine sanctuary with hearth stove and yak-wool throws' },
      { variant: 'trail', caption: 'Fluttering prayer flags crossing Sela Pass towards Ziro Valley' },
    ],
    summary:
      'Commanding panoramic views of Tawang Monastery’s gilded rooftops and the snow-rimmed Sela Pass corridor, this sunlit stone-and-pine retreat connects Arunachal’s Buddhist highlands with the serene paddy-and-pine terraces of Ziro Valley.',
    architectureNote:
      'Sun-facing double-glazed timber frames paired with carved Monpa cabinetry and cozy solar-heated slate floors.',
    etiquetteTips: [
      'Walk clockwise around monastery prayer wheels and stone mani walls.',
      'Allow a gentle acclimatization afternoon before ascending Sela Pass (4,170m).',
      'Carry your digital Inner Line Permit (ILP) when crossing valley checkpoints.',
    ],
    trailDistanceKm: 10.2,
    trailDifficulty: 'Alpine Ridge',
    elevationProfile: [2850, 3048, 3420, 4170, 3890, 3310, 2980],
    mapCoords: { x: 372, y: 118 },
    weather: {
      tempC: 9,
      condition: 'Crisp Blue Sky',
      mistIndex: '28km Alpine Clarity',
      trailStatus: 'Crisp Alpine',
      sunrise: '05:22 IST',
    },
    host: {
      name: 'Pema Dorjee Khandu',
      lineage: 'Monpa & Apatani Guild',
      craft: 'Thangka Mineral Artist & High-Pass Guide',
      yearsHosting: 9,
      verifiedEcoGuide: true,
      quote: 'Sunlight on Tawang’s snow peaks turns every morning into a festival of prayer flags.',
      bio: 'Pema leads serene monastery walks in Tawang and seasonal pine-grove excursions into Ziro Valley’s Apatani homesteads.',
      languages: ['Monpa', 'Tibetan', 'English', 'Hindi'],
      initials: 'PD',
    },
    addons: [
      {
        id: 'tawang-sela-excursion',
        title: 'Tawang Monastery Dawn & Sela Lake Drive',
        duration: '5 hrs',
        priceInr: 2300,
        description: 'Guided monastery courtyard walk plus high-altitude alpine lake picnic.',
      },
      {
        id: 'ziro-pine-table',
        title: 'Ziro Bamboo-Cup Millet & Pine Hearth Supper',
        duration: 'Evening',
        priceInr: 1150,
        description: 'Warm Himalayan kitchen feast featuring Apatani smoked herbs.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'dzuko-hornbill-lodge',
    title: 'Dzuko Lily Meadow & Hornbill Lodge',
    subtitle: 'Sunlit Angami timber sanctuary opening onto Dzukou wildflower ridges and Naga heritage',
    location: 'Dzuko Valley & Kohima',
    state: 'Nagaland',
    highlights: ['Dzuko Valley', 'Hornbill', 'Khonoma'],
    category: 'Valley & Flowers',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Trek Guide', 'Pet Friendly'],
    hostType: 'Naga Weaver',
    savedCount: 196,
    elevationMeters: 2452,
    pricePerNightInr: 7200,
    rating: 4.96,
    reviewCount: 88,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'nagaland',
    photoUrl: '/src/assets/images/nagaland_dzuko_flowers_1795236949408.jpg',
    photoAlt: 'Dzuko Valley rolling emerald hills blooming with pink and white lilies in Nagaland',
    scenes: [
      { variant: 'photo', caption: 'Blooming Dzukou lilies rippling across sunlit bamboo meadows' },
      { variant: 'interior', caption: 'Hand-carved Angami oak cabin draped in woven Naga shawls' },
      { variant: 'trail', caption: 'Ridge footpath above Viswema and Khonoma Green Village' },
    ],
    summary:
      'Positioned along the breezy gateway between Khonoma Green Village and the celebrated Dzukou Valley, this warm oak-and-stone retreat immerses travelers in blooming alpine lily meadows and vibrant Hornbill cultural festivals.',
    architectureNote:
      'Constructed with warm cedar planks, stone terrace walls, and sunlit deck loungers overlooking bamboo ridges.',
    etiquetteTips: [
      'Stay strictly on marked ridge footpaths to protect delicate seasonal Dzukou lilies.',
      'Pack out all wrappers; Khonoma and Dzukou are zero-plastic conservation zones.',
      'Ask hosts about the tribal heritage behind each handwoven shawl pattern.',
    ],
    trailDistanceKm: 13.5,
    trailDifficulty: 'Alpine Ridge',
    elevationProfile: [1620, 1890, 2180, 2452, 2390, 2140, 1780],
    mapCoords: { x: 468, y: 266 },
    weather: {
      tempC: 16,
      condition: 'Sunny Meadow Breeze',
      mistIndex: 'Golden Ridge Light',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:19 IST',
    },
    host: {
      name: 'Kezhaselie Meyase',
      lineage: 'Angami Naga Clan',
      craft: 'Tragopan Conservationist & Trail Storyteller',
      yearsHosting: 8,
      verifiedEcoGuide: true,
      quote: 'When July and autumn sun sweep across Dzukou, the entire valley turns into a sea of lilies.',
      bio: 'A dedicated guardian of Nagaland’s green villages, Kezhaselie hosts hikers, birders, and Hornbill Festival travelers.',
      languages: ['Tenyidie', 'Nagamese', 'English'],
      initials: 'KM',
    },
    addons: [
      {
        id: 'dzuko-lily-trek',
        title: 'Dzuko Valley Ridge & Lily Trail Hike',
        duration: '6 hrs',
        priceInr: 2200,
        description: 'Full-day guided trek through bamboo groves and flower-strewn valleys.',
      },
      {
        id: 'hornbill-craft-evening',
        title: 'Naga Folk Music & Woodfire Hearth Feast',
        duration: 'Evening',
        priceInr: 1200,
        description: 'Artisan storytelling alongside traditional smoked Naga hill delicacies.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'tsomgo-nathula-retreat',
    title: 'Tsomgo Sapphire Lake & Nathula Chalet',
    subtitle: 'High-mountain sanctuary overlooking glacial Tsomgo waters and Nathula snow peaks',
    location: 'Tsomgo Lake & Nathula Corridor',
    state: 'Sikkim',
    highlights: ['Tsomgo Lake', 'Nathula', 'Dzongu'],
    category: 'Monastery & Passes',
    propertyType: 'Cottage',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Trek Guide', 'Parking'],
    hostType: 'Superhost',
    savedCount: 215,
    elevationMeters: 3753,
    pricePerNightInr: 8900,
    rating: 4.98,
    reviewCount: 95,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'sikkim',
    photoUrl: '/src/assets/images/sikkim_tsomgo_lake_1795236949322.jpg',
    photoAlt: 'Tsomgo Lake reflecting snowy Sikkim peaks with colorful prayer flags',
    scenes: [
      { variant: 'photo', caption: 'Sapphire reflections of snowy Himalayan peaks at Tsomgo Lake' },
      { variant: 'interior', caption: 'Cozy timber chalet with copper tea kettles and alpine windows' },
      { variant: 'trail', caption: 'Prayer-flag mountain path leading toward Nathula Pass' },
    ],
    summary:
      'Nestled along the sunlit alpine approach to Tsomgo Lake and historic Nathula Pass, this warm wood-and-stone mountain chalet pairs mirror-still glacial lake views with traditional Sikkimese hospitality.',
    architectureNote:
      'Insulated Sikkim pine interior featuring sunlit reading alcoves, wool rugs, and panoramic Khangchendzonga vistas.',
    etiquetteTips: [
      'Submit photo ID 48 hours in advance so your host secures Tsomgo & Nathula permits.',
      'Hydrate well and pace slowly at 3,700m+ glacial altitude.',
      'Respect sacred lake shorelines and refrain from tossing coins or plastics.',
    ],
    trailDistanceKm: 7.5,
    trailDifficulty: 'Moderate',
    elevationProfile: [3200, 3450, 3753, 3980, 4310, 3890, 3620],
    mapCoords: { x: 145, y: 155 },
    weather: {
      tempC: 7,
      condition: 'Sparkling Alpine Sun',
      mistIndex: 'Mirror Lake Calm',
      trailStatus: 'Crisp Alpine',
      sunrise: '05:30 IST',
    },
    host: {
      name: 'Ugen & Tashi Lepcha',
      lineage: 'Sikkimese & Lepcha Heritage',
      craft: 'Alpine Flora Guide & Organic Cardamom Grower',
      yearsHosting: 12,
      verifiedEcoGuide: true,
      quote: 'Every morning at Tsomgo begins with snow peaks mirrored in liquid sapphire.',
      bio: 'Ugen and Tashi coordinate effortless protected-area permits and share generations of Himalayan mountaineering lore.',
      languages: ['Lepcha', 'Nepali', 'English', 'Hindi'],
      initials: 'UL',
    },
    addons: [
      {
        id: 'tsomgo-nathula-pass',
        title: 'Tsomgo Sunrise & Nathula Silk Route Tour',
        duration: '5 hrs',
        priceInr: 2500,
        description: 'Permit-arranged alpine excursion with hot yak-butter tea stop.',
      },
      {
        id: 'sikkimese-momo-hearth',
        title: 'Artisan Thukpa & Organic Cardamom Kitchen',
        duration: 'Evening',
        priceInr: 950,
        description: 'Hand-folded Himalayan dumplings and roasted cardamom herbal infusions.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'loktak-floating-sanctuary',
    title: 'Loktak Floating Phumdi Eco-Cottage',
    subtitle: 'Sun-drenched lakeside bamboo retreat overlooking Manipur’s floating island rings',
    location: 'Loktak Lake, Moirang',
    state: 'Manipur',
    highlights: ['Loktak Lake', 'Keibul Lamjao', 'Moirang'],
    category: 'Living Root & Lakes',
    propertyType: 'Houseboat (Loktak)',
    amenities: ['WiFi', 'Local Food', 'River View', 'Trek Guide', 'Pet Friendly'],
    hostType: 'Local Artisan',
    savedCount: 173,
    elevationMeters: 768,
    pricePerNightInr: 6100,
    rating: 4.92,
    reviewCount: 64,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'manipur',
    photoUrl: '/src/assets/images/manipur_loktak_lake_1795236949260.jpg',
    photoAlt: 'Loktak Lake floating circular green islands and wooden canoe at golden sunrise in Manipur',
    scenes: [
      { variant: 'photo', caption: 'Golden morning canoes gliding between Loktak floating phumdis' },
      { variant: 'interior', caption: 'Bright Meitei woven reed pavilion opening onto the water deck' },
      { variant: 'trail', caption: 'Floating reed boardwalk into Keibul Lamjao National Park' },
    ],
    summary:
      'Overlooking the only floating national park on Earth, this bright lakeside bamboo sanctuary lets you paddle at sunrise among emerald phumdi rings and spot rare Sangai dancing deer across Keibul Lamjao.',
    architectureNote:
      'Airy lake-facing veranda crafted from cured Manipuri bamboo and light-oak decking suspended above lotus coves.',
    etiquetteTips: [
      'Glide quietly in hand-paddled wooden canoes near Keibul Lamjao habitats.',
      'Sample traditional Manipuri black rice pudding (Chak-hao) prepared fresh each morning.',
      'Ask permission before stepping onto family-tended fishing phumdis.',
    ],
    trailDistanceKm: 8.0,
    trailDifficulty: 'Gentle',
    elevationProfile: [768, 770, 768, 772, 769, 768, 768],
    mapCoords: { x: 432, y: 325 },
    weather: {
      tempC: 22,
      condition: 'Golden Lake Morning',
      mistIndex: 'Soft Horizon Shimmer',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:14 IST',
    },
    host: {
      name: 'Thoiba & Ibemhal Devi',
      lineage: 'Meitei Lakeshore Stewards',
      craft: 'Canoe Builder & Moirang Phee Weaver',
      yearsHosting: 10,
      verifiedEcoGuide: true,
      quote: 'On Loktak, our islands drift gently with the breeze while the hills keep watch.',
      bio: 'Thoiba crafts lightweight wooden dugouts while Ibemhal weaves crisp geometric Moirang Phee textiles in their lakeside courtyard.',
      languages: ['Manipuri (Meiteilon)', 'English', 'Hindi'],
      initials: 'TD',
    },
    addons: [
      {
        id: 'loktak-sunrise-canoe',
        title: 'Loktak Phumdi Sunrise Canoe & Sangai Watch',
        duration: '3.5 hrs',
        priceInr: 1500,
        description: 'Dawn canoe trip with Sangai habitat lookout at Keibul Lamjao.',
      },
      {
        id: 'chakhao-feast',
        title: 'Meitei Lotus-Leaf & Black Rice Supper',
        duration: 'Evening',
        priceInr: 950,
        description: 'Heirloom Chak-hao kheer, smoked lake herbs, and Eromba specialties.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'phawngpui-blue-mountain',
    title: 'Phawngpui Blue Mountain Ridge Cabin',
    subtitle: 'Sunlit Mizo timber retreat overlooking terraced valleys and scarlet rhododendrons',
    location: 'Phawngpui & Reiek Hills',
    state: 'Mizoram',
    highlights: ['Phawngpui', 'Reiek', 'Vantawng Falls'],
    category: 'Valley & Flowers',
    propertyType: 'Bamboo Hut',
    amenities: ['Local Food', 'Hot Water', 'Trek Guide', 'Bonfire', 'Pet Friendly'],
    hostType: 'Local Artisan',
    savedCount: 129,
    elevationMeters: 2157,
    pricePerNightInr: 6400,
    rating: 4.91,
    reviewCount: 49,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'mizoram',
    photoUrl: '/src/assets/images/mizoram_phawngpui_hills_1795236949939.jpg',
    photoAlt: 'Phawngpui Blue Mountain sunlit ridges and blooming rhododendrons in Mizoram',
    scenes: [
      { variant: 'photo', caption: 'Rhododendron blooms framing Phawngpui Blue Mountain cliffs' },
      { variant: 'interior', caption: 'Warm Mizo bamboo-and-oak suite with cloud-valley terrace' },
      { variant: 'trail', caption: 'Terraced hill ridge connecting Reiek and Blue Mountain' },
    ],
    summary:
      'Perched high along Mizoram’s sunlit Blue Mountain ridges, this bright timber-and-bamboo retreat celebrates effortless ridge hiking, cascading Vantawng waterfalls, and serene Mizo Puan weaving traditions.',
    architectureNote:
      'Elevated oak framing with wrap-around sky balconies tuned for golden sunrise views above drifting valley clouds.',
    etiquetteTips: [
      'Sundays in Mizo villages observe peaceful community rest—plan gentle walks.',
      'Carry light windbreakers for afternoon ridge breezes above 2,000 meters.',
      'Support local Mizo Puan textile artisans in Reiek Heritage Village.',
    ],
    trailDistanceKm: 11.2,
    trailDifficulty: 'Moderate',
    elevationProfile: [1480, 1690, 1920, 2157, 2080, 1850, 1640],
    mapCoords: { x: 378, y: 375 },
    weather: {
      tempC: 18,
      condition: 'Crisp Sunlit Ridges',
      mistIndex: 'Airy Blue Horizons',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:17 IST',
    },
    host: {
      name: 'Lalrinmawia & Zothani Sailo',
      lineage: 'Mizo Highland Stewards',
      craft: 'Puan Handloom & Orchid Conservation',
      yearsHosting: 7,
      verifiedEcoGuide: true,
      quote: 'From Phawngpui’s cliffs, the emerald ridges roll like ocean waves under bright sky.',
      bio: 'Lalrinmawia leads ridge botany walks among wild orchids and scarlet rhododendrons while Zothani hosts Mizo hearth dinners.',
      languages: ['Mizo', 'English', 'Hindi'],
      initials: 'LS',
    },
    addons: [
      {
        id: 'phawngpui-cliff-hike',
        title: 'Blue Mountain Rhododendron Ridge Hike',
        duration: '5 hrs',
        priceInr: 1750,
        description: 'Guided ascent to Phawngpui cliff viewpoints and orchid trails.',
      },
      {
        id: 'mizo-puan-dinner',
        title: 'Bai Bamboo Stew & Heritage Puan Evening',
        duration: 'Evening',
        priceInr: 900,
        description: 'Warm home-cooked Mizo table with traditional bamboo music.',
      },
    ],
    instantReserve: false,
  },
  {
    id: 'neermahal-lake-residence',
    title: 'Neermahal Lakefront Heritage Villa',
    subtitle: 'Sun-washed coral-and-oak villa facing Tripura’s shimmering Rudrasagar water palace',
    location: 'Melaghar & Unakoti Circuit',
    state: 'Tripura',
    highlights: ['Neermahal', 'Rudrasagar Lake', 'Unakoti'],
    category: 'Heritage & Palaces',
    propertyType: 'Cottage',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'River View', 'Parking'],
    hostType: 'Superhost',
    savedCount: 141,
    elevationMeters: 42,
    pricePerNightInr: 6700,
    rating: 4.90,
    reviewCount: 54,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'tripura',
    photoUrl: '/src/assets/images/tripura_neermahal_palace_1795236949140.jpg',
    photoAlt: 'Neermahal white and coral water palace in sparkling blue Rudrasagar Lake, Tripura',
    scenes: [
      { variant: 'photo', caption: 'Neermahal Water Palace glowing over sparkling Rudrasagar Lake' },
      { variant: 'interior', caption: 'Airy lime-washed courtyard room with carved Tripura cane chairs' },
      { variant: 'trail', caption: 'Boat glide across Rudrasagar waters and Unakoti forest carvings' },
    ],
    summary:
      'Looking straight across sparkling Rudrasagar Lake toward the royal white-and-coral Neermahal Water Palace, this serene villa blends Tripuri cane craftsmanship with private lakeside boat excursions and ancient Unakoti sculpture trails.',
    architectureNote:
      'Sunlit arched verandas, terracotta floor tiles, and hand-woven Tripura bamboo screens cooled by lake breezes.',
    etiquetteTips: [
      'Schedule Neermahal boat crossings at 08:30 or 16:00 for the brightest golden light.',
      'Respect ancient sandstone rock reliefs at Unakoti—avoid touching carved surfaces.',
      'Sample aromatic Queen Pineapple harvests offered fresh on the veranda.',
    ],
    trailDistanceKm: 5.5,
    trailDifficulty: 'Gentle',
    elevationProfile: [42, 46, 52, 48, 44, 42, 42],
    mapCoords: { x: 288, y: 342 },
    weather: {
      tempC: 25,
      condition: 'Warm Lakeside Sun',
      mistIndex: 'Sparkling Water Reflections',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:21 IST',
    },
    host: {
      name: 'Bikram & Anindita Debbarma',
      lineage: 'Tripuri Royal Craft Guild',
      craft: 'Fine Bamboo Split Weaving & Lake History',
      yearsHosting: 9,
      verifiedEcoGuide: true,
      quote: 'At twilight, Neermahal’s coral arches shimmer on the lake like a floating lantern.',
      bio: 'Bikram leads heritage boating tours on Rudrasagar while Anindita curates Tripuri cane artistry and pineapple-garden breakfasts.',
      languages: ['Kokborok', 'Bengali', 'English', 'Hindi'],
      initials: 'BD',
    },
    addons: [
      {
        id: 'neermahal-boat-tour',
        title: 'Private Rudrasagar Boat & Neermahal Tour',
        duration: '3 hrs',
        priceInr: 1400,
        description: 'Sunset cruise around the water palace arches with heritage storyteller.',
      },
      {
        id: 'tripuri-cane-lunch',
        title: 'Mui Borok Heritage Lunch & Cane Atelier',
        duration: '2.5 hrs',
        priceInr: 1050,
        description: 'Traditional Tripuri garden meal and fine bamboo basketry session.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'kaziranga-kohora-homestay',
    title: 'Kaziranga Kohora Courtyard Homestay',
    subtitle: 'Warm Assamese family homestay with evening courtyard bonfire steps from Kohora safari gate',
    location: 'Kaziranga Kohora Range',
    state: 'Assam',
    highlights: ['Kaziranga', 'Bonfire', 'Safari Gate'],
    category: 'Wildlife & River',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Parking'],
    hostType: 'Superhost',
    savedCount: 204,
    elevationMeters: 88,
    pricePerNightInr: 2850,
    rating: 4.86,
    reviewCount: 94,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'assam',
    photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
    photoAlt: 'Kaziranga Kohora misty grassland gateway and sunlit tea hedges',
    scenes: [
      { variant: 'photo', caption: 'Early morning mist at Kaziranga Kohora range grasslands' },
      { variant: 'interior', caption: 'Airy cane-and-oak homestay room opening to the bonfire garden' },
      { variant: 'trail', caption: 'Afternoon bicycle trail past organic tea plots' },
    ],
    summary:
      'Budget-friendly family courtyard stay five minutes from Kaziranga Central (Kohora) gate. Gather around the evening wood bonfire for roasted Assamese pithas and sunrise rhino spotting plans.',
    architectureNote:
      'Traditional Assam-type ikra-and-timber home with cool verandahs and organic kitchen garden.',
    etiquetteTips: [
      'Jeep safari permits open at 05:30; ask your host the night before.',
      'Enjoy quiet acoustic bonfire conversations after 22:00.',
    ],
    trailDistanceKm: 4.2,
    trailDifficulty: 'Gentle',
    elevationProfile: [84, 86, 88, 92, 90, 88, 86],
    mapCoords: { x: 398, y: 212 },
    weather: {
      tempC: 23,
      condition: 'Clear Safari Dawn',
      mistIndex: 'Light Grass Mist',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:17 IST',
    },
    host: {
      name: 'Pranjal & Mitali Gogoi',
      lineage: 'Kaziranga Homestay Collective',
      craft: 'Rhino Naturalist & Assamese Kitchen Host',
      yearsHosting: 9,
      verifiedEcoGuide: true,
      quote: 'Every guest leaves our bonfire courtyard feeling like family.',
      bio: 'Pranjal coordinates ethical elephant-grass jeep routes while Mitali cooks farm-fresh Masor Tenga and Khaar.',
      languages: ['Assamese', 'English', 'Hindi'],
      initials: 'PG',
    },
    addons: [
      {
        id: 'kohora-dawn-safari',
        title: 'Kohora Central Range Sunrise Safari',
        duration: '3.5 hrs',
        priceInr: 1850,
        description: 'Shared or private naturalist jeep through tall elephant-grass wetlands.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'kaziranga-bamboo-canopy',
    title: 'Kaziranga Wildflower Bamboo Hut & Firepit',
    subtitle: 'Hand-lashed bamboo sanctuary overlooking Kaziranga tea streams with starry bonfire evenings',
    location: 'Kaziranga Bagori & Tea Belt',
    state: 'Assam',
    highlights: ['Kaziranga', 'Tea Gardens', 'Bonfire'],
    category: 'Wildlife & River',
    propertyType: 'Bamboo Hut',
    amenities: ['Bonfire', 'Local Food', 'River View', 'Pet Friendly', 'Parking'],
    hostType: 'Tea Tribe',
    savedCount: 162,
    elevationMeters: 92,
    pricePerNightInr: 3600,
    rating: 4.74,
    reviewCount: 61,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'assam',
    photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
    photoAlt: 'Sunlit Kaziranga grasslands and emerald Assam tea garden border',
    scenes: [
      { variant: 'photo', caption: 'Golden hour over Bagori wetlands and tea hedges' },
      { variant: 'interior', caption: 'Cured Assamese bamboo hut with woven cotton drapes' },
      { variant: 'trail', caption: 'Tea-picker footpath along Difloo river stream' },
    ],
    summary:
      'Set beside a gentle tea-garden stream bordering Kaziranga’s Bagori range, this rustic bamboo hut features an open-air stone firepit, pet-friendly lawn, and home-brewed black tea.',
    architectureNote:
      'Elevated bamboo stilts with thatched cooling roof and hand-woven cane lanterns.',
    etiquetteTips: [
      'Keep pets leashed near wildlife buffer corridors at dusk.',
      'Join afternoon tea-leaf plucking walks with Tea Tribe elders.',
    ],
    trailDistanceKm: 5.1,
    trailDifficulty: 'Gentle',
    elevationProfile: [88, 90, 92, 95, 92, 90, 88],
    mapCoords: { x: 392, y: 218 },
    weather: {
      tempC: 24,
      condition: 'Warm Breeze',
      mistIndex: 'Clear',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:17 IST',
    },
    host: {
      name: 'Biren & Tulsi Munda',
      lineage: 'Assam Tea Tribe Artisans',
      craft: 'Single-Estate Leaf Curators & Bamboo Crafters',
      yearsHosting: 6,
      verifiedEcoGuide: true,
      quote: 'Around the bonfire, tea-garden songs drift straight into the stars.',
      bio: 'Born and raised on heritage Assam tea estates, Biren and Tulsi host intimate eco-huts beside Kaziranga.',
      languages: ['Assamese', 'Sadri', 'Hindi', 'English'],
      initials: 'BM',
    },
    addons: [
      {
        id: 'bagori-rhino-track',
        title: 'Bagori Western Range Rhino Track',
        duration: '3.5 hrs',
        priceInr: 1750,
        description: 'Scenic wetland drive known for close rhino and wild buffalo sightings.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'dibrugarh-manohari-bungalow',
    title: 'Upper Assam Heritage Tea Estate Bungalow',
    subtitle: 'Grand 1920s planter bungalow nestled inside 400 acres of orthodox Assam tea gardens',
    location: 'Dibrugarh Tea Circuit',
    state: 'Assam',
    highlights: ['Tea Gardens', 'Brahmaputra', 'Heritage'],
    category: 'Heritage & Palaces',
    propertyType: 'Tea Estate Bungalow',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Parking', 'Pet Friendly'],
    hostType: 'Tea Tribe',
    savedCount: 190,
    elevationMeters: 108,
    pricePerNightInr: 11800,
    rating: 4.92,
    reviewCount: 47,
    maxGuests: 6,
    bedrooms: 3,
    artworkTheme: 'assam',
    photoUrl: '/src/assets/images/assam_kaziranga_tea_1795236945799.jpg',
    photoAlt: 'Sunlit Upper Assam tea garden bungalow and emerald bushes',
    scenes: [
      { variant: 'photo', caption: 'Sweeping emerald tea terraces in Upper Assam morning sun' },
      { variant: 'interior', caption: 'Teak four-poster suites and wrap-around planter veranda' },
      { variant: 'trail', caption: 'Private estate tasting pavilion at golden hour' },
    ],
    summary:
      'Step into timeless Upper Assam heritage inside a restored teak planter bungalow featuring private white-tea tastings, lawn croquet, and bonfire suppers.',
    architectureNote:
      'Original burma teak rafters, wide screened verandahs, and hand-polished brass fixtures.',
    etiquetteTips: [
      'Private factory tours run mornings Monday through Saturday.',
      'Dress warmly for dawn river mist walks.',
    ],
    trailDistanceKm: 6.0,
    trailDifficulty: 'Gentle',
    elevationProfile: [105, 108, 110, 112, 109, 108, 106],
    mapCoords: { x: 435, y: 185 },
    weather: {
      tempC: 23,
      condition: 'Sunlit Estates',
      mistIndex: 'Crisp Tea Air',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:10 IST',
    },
    host: {
      name: 'Aniruddha & Kamala Phukan',
      lineage: 'Upper Assam Planter Heritage',
      craft: 'Rare Golden-Tip Tea Sommeliers',
      yearsHosting: 16,
      verifiedEcoGuide: true,
      quote: 'A century of Assam rain and sunshine lives in every morning cup.',
      bio: 'Stewards of organic tea preservation and fair-wage Tea Tribe artisan collectives in Dibrugarh.',
      languages: ['Assamese', 'English', 'Hindi'],
      initials: 'AP',
    },
    addons: [
      {
        id: 'white-tea-cupping',
        title: 'Private Orthodox & Silver-Tip Tea Tasting',
        duration: '2 hrs',
        priceInr: 1500,
        description: 'Guided sensory flight of rare seasonal Assam harvests.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'nongriat-khasi-homestay',
    title: 'Nongriat Living Root Khasi Family Homestay',
    subtitle: 'Warm Khasi family home tucked above canyon waterfalls and double-decker root bridges',
    location: 'Nongriat & Sohra',
    state: 'Meghalaya',
    highlights: ['Living Root Bridge', 'Cherrapunji', 'Waterfalls'],
    category: 'Living Root & Lakes',
    propertyType: 'Homestay',
    amenities: ['Local Food', 'Hot Water', 'Trek Guide', 'River View'],
    hostType: 'Khasi Family',
    savedCount: 238,
    elevationMeters: 620,
    pricePerNightInr: 2450,
    rating: 4.82,
    reviewCount: 112,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'meghalaya',
    photoUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
    photoAlt: 'Crystal emerald water canyon near Sohra and Dawki in Meghalaya',
    scenes: [
      { variant: 'photo', caption: 'Turquoise plunge pools along the Nongriat canyon trail' },
      { variant: 'interior', caption: 'Clean timber family loft with views of mist cascades' },
      { variant: 'trail', caption: 'Dawn steps leading directly to the living root bridge' },
    ],
    summary:
      'Stay right inside Nongriat village with a welcoming Khasi family so you can step onto the Double-Decker Living Root Bridge at first light before day crowds arrive.',
    architectureNote:
      'Locally milled pine rooms with sunlit stone courtyard overlooking emerald canyon streams.',
    etiquetteTips: [
      'Pack light in backpacks—access involves 3,500 scenic stone steps.',
      'Enjoy red rice and smoked Sohra ginger tea cooked by Kong Mary.',
    ],
    trailDistanceKm: 7.4,
    trailDifficulty: 'Moderate',
    elevationProfile: [1200, 980, 740, 620, 480, 620, 890],
    mapCoords: { x: 248, y: 254 },
    weather: {
      tempC: 20,
      condition: 'Canyon Mist & Sun',
      mistIndex: 'Fresh Waterfall Spray',
      trailStatus: 'Morning Mist',
      sunrise: '05:41 IST',
    },
    host: {
      name: 'Kong Mary & Daphi Lyngdoh',
      lineage: 'Nongriat Khasi Lineage',
      craft: 'Root Bridge Trail Guardians',
      yearsHosting: 10,
      verifiedEcoGuide: true,
      quote: 'Living bridges grow stronger with every generation that cares for the forest.',
      bio: 'Multi-generational Khasi hosts keeping ancient root-weaving traditions alive for respectful hikers.',
      languages: ['Khasi', 'English', 'Hindi'],
      initials: 'ML',
    },
    addons: [
      {
        id: 'rainbow-falls-dawn',
        title: 'Sunrise Rainbow Falls & Blue Lagoon Walk',
        duration: '3 hrs',
        priceInr: 950,
        description: 'Early canyon hike before morning mist lifts.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'mawlynnong-khasi-treehouse',
    title: 'Mawlynnong Canopy Treehouse & Skywalk',
    subtitle: 'Sunlit bamboo-and-pine treehouse perched high in Asia’s cleanest Khasi village',
    location: 'Mawlynnong & Dawki Ridge',
    state: 'Meghalaya',
    highlights: ['Mawlynnong', 'Dawki', 'Treehouse'],
    category: 'Living Root & Lakes',
    propertyType: 'Treehouse',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'Parking', 'Trek Guide'],
    hostType: 'Khasi Family',
    savedCount: 267,
    elevationMeters: 1090,
    pricePerNightInr: 5200,
    rating: 4.91,
    reviewCount: 83,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'meghalaya',
    photoUrl: '/src/assets/images/meghalaya_dawki_boat_1795236949771.jpg',
    photoAlt: 'Lush green Meghalaya cliffs overlooking emerald Dawki waters',
    scenes: [
      { variant: 'photo', caption: 'Treetop canopy horizon toward Bangladesh plains and Dawki' },
      { variant: 'interior', caption: 'Handcrafted pine-and-bamboo treehouse suite with skylights' },
      { variant: 'trail', caption: 'Flower-lined stone footpaths of Mawlynnong village' },
    ],
    summary:
      'Elevated among wild betel-nut palms and orchid canopies, this charming Khasi treehouse pairs starry balcony breezes with 20-minute access to crystal Dawki boating.',
    architectureNote:
      'Zero-nail woven bamboo platform supported by living jackfruit trunks and warm cedar decks.',
    etiquetteTips: [
      'Use bamboo waste baskets along village lanes—Mawlynnong is strictly zero-litter.',
      'Catch golden sunset views from the upper bamboo skywalk.',
    ],
    trailDistanceKm: 4.5,
    trailDifficulty: 'Gentle',
    elevationProfile: [1050, 1080, 1090, 1110, 1090, 1070, 1060],
    mapCoords: { x: 262, y: 256 },
    weather: {
      tempC: 22,
      condition: 'Breezy Canopy Sun',
      mistIndex: 'Crystal Clear',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:39 IST',
    },
    host: {
      name: 'Rishot & Larisa Khonglah',
      lineage: 'East Khasi Hills Guild',
      craft: 'Bamboo Skywalk Builders & Floriculturists',
      yearsHosting: 8,
      verifiedEcoGuide: true,
      quote: 'Sleeping among betel-nut palms teaches you the quiet rhythm of the hills.',
      bio: 'Craftspeople specializing in traditional Khasi bamboo engineering and orchid gardens.',
      languages: ['Khasi', 'English'],
      initials: 'RK',
    },
    addons: [
      {
        id: 'dawki-kayak-sunset',
        title: 'Shnongpdeng Crystal Kayak & Cliff Jump',
        duration: '3 hrs',
        priceInr: 1400,
        description: 'Afternoon transparent-water kayaking along the Umngot gorge.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'ziro-bamboo-valley-hut',
    title: 'Ziro Apatani Bamboo Hut & Paddy Deck',
    subtitle: 'Eco bamboo hut beside emerald Ziro rice terraces and misty Himalayan pine forests',
    location: 'Ziro Valley, Hong Village',
    state: 'Arunachal Pradesh',
    highlights: ['Ziro Valley', 'Pine Groves', 'Apatani'],
    category: 'Valley & Flowers',
    propertyType: 'Bamboo Hut',
    amenities: ['Bonfire', 'Local Food', 'Hot Water', 'Trek Guide', 'Pet Friendly'],
    hostType: 'Local Artisan',
    savedCount: 151,
    elevationMeters: 1560,
    pricePerNightInr: 3300,
    rating: 4.78,
    reviewCount: 53,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'arunachal',
    photoUrl: '/src/assets/images/arunachal_tawang_snow_1795236949484.jpg',
    photoAlt: 'Sunlit Arunachal mountain ridge and pine horizon',
    scenes: [
      { variant: 'photo', caption: 'Golden pine ridges framing Ziro Valley rice terraces' },
      { variant: 'interior', caption: 'Hand-woven Apatani bamboo hut with central fire hearth' },
      { variant: 'trail', caption: 'Cycling track through Talley Valley bamboo groves' },
    ],
    summary:
      'Set at the edge of Hong Village’s UNESCO-nominated Apatani rice-and-fish terraces, this handcrafted bamboo hut serves hot millet brew around an evening hearth bonfire.',
    architectureNote:
      'Sustainable Apatani split-bamboo walls with woven reed mats and sunlit paddy balcony.',
    etiquetteTips: [
      'Walk carefully along narrow earthen paddy bunds during wet season.',
      'Ask hosts about organic kiwi orchard harvests in autumn.',
    ],
    trailDistanceKm: 8.2,
    trailDifficulty: 'Gentle',
    elevationProfile: [1520, 1560, 1610, 1680, 1620, 1580, 1550],
    mapCoords: { x: 412, y: 142 },
    weather: {
      tempC: 17,
      condition: 'Crisp Valley Sun',
      mistIndex: 'Pine Scented',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:18 IST',
    },
    host: {
      name: 'Tage & Yampi Hano',
      lineage: 'Apatani Bamboo Collective',
      craft: 'Paddy-Fish Farming & Bamboo Craft',
      yearsHosting: 7,
      verifiedEcoGuide: true,
      quote: 'Our bamboo huts breathe with the pine wind of Ziro.',
      bio: 'Community leaders welcoming travelers into sustainable Apatani agro-heritage.',
      languages: ['Apatani', 'Hindi', 'English'],
      initials: 'TH',
    },
    addons: [
      {
        id: 'talley-pine-walk',
        title: 'Talley Valley Bamboo & Orchid Hike',
        duration: '4 hrs',
        priceInr: 1200,
        description: 'Guided forest walk through giant silver-fir and bamboo reserves.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'tawang-alpine-homestay',
    title: 'Tawang Monastery Overlook Family Homestay',
    subtitle: 'Cozy stone-and-pine family home beneath Tawang Monastery’s prayer flags',
    location: 'Tawang Old Market Ridge',
    state: 'Arunachal Pradesh',
    highlights: ['Tawang Monastery', 'Sela Pass', 'Snow Peaks'],
    category: 'Monastery & Passes',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'Parking'],
    hostType: 'Superhost',
    savedCount: 136,
    elevationMeters: 2980,
    pricePerNightInr: 2950,
    rating: 4.65,
    reviewCount: 44,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'arunachal',
    photoUrl: '/src/assets/images/arunachal_tawang_snow_1795236949484.jpg',
    photoAlt: 'Tawang Monastery golden rooftops and snowy mountain ridge',
    scenes: [
      { variant: 'photo', caption: 'Direct sunrise view of Tawang Monastery gilded domes' },
      { variant: 'interior', caption: 'Heated Monpa guest room with yak-wool quilts' },
      { variant: 'trail', caption: 'Stone path up to Urgelling and Tawang Monastery gates' },
    ],
    summary:
      'An affordable, deeply welcoming Monpa family homestay featuring bukhari wood-stove heating, homemade butter tea, and uninterrupted views of Tawang Monastery.',
    architectureNote:
      'Thick granite thermal walls paired with carved pine window frames facing south sun.',
    etiquetteTips: [
      'Dress warmly in layers; night temperatures drop crisp at 3,000m.',
      'Morning prayer chants start around 06:00 at the main monastery.',
    ],
    trailDistanceKm: 4.0,
    trailDifficulty: 'Moderate',
    elevationProfile: [2900, 2980, 3048, 3020, 2980, 2950, 2920],
    mapCoords: { x: 368, y: 122 },
    weather: {
      tempC: 8,
      condition: 'Bright Alpine Sun',
      mistIndex: 'Crisp Mountain Air',
      trailStatus: 'Crisp Alpine',
      sunrise: '05:22 IST',
    },
    host: {
      name: 'Lobsang & Tsering Wangchu',
      lineage: 'Monpa Heritage Hosts',
      craft: 'Monastic Cuisine & Wood Carving',
      yearsHosting: 11,
      verifiedEcoGuide: false,
      quote: 'A warm hearth and salted butter tea cure any mountain chill.',
      bio: 'Warm-hearted Tawang elders hosting trekkers, photographers, and cultural travelers.',
      languages: ['Monpa', 'Hindi', 'English'],
      initials: 'LW',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'khonoma-naga-weaver-homestay',
    title: 'Khonoma Naga Weaver Heritage Homestay',
    subtitle: 'Stone courtyard home hosted by master Angami shawl weavers with hill bonfire feasts',
    location: 'Khonoma Green Village',
    state: 'Nagaland',
    highlights: ['Khonoma', 'Hornbill', 'Weaving'],
    category: 'Valley & Flowers',
    propertyType: 'Homestay',
    amenities: ['Bonfire', 'Local Food', 'Hot Water', 'Trek Guide', 'Parking'],
    hostType: 'Naga Weaver',
    savedCount: 178,
    elevationMeters: 1620,
    pricePerNightInr: 2700,
    rating: 4.89,
    reviewCount: 74,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'nagaland',
    photoUrl: '/src/assets/images/nagaland_dzuko_flowers_1795236949408.jpg',
    photoAlt: 'Sunlit Nagaland green valley hills near Khonoma and Dzuko',
    scenes: [
      { variant: 'photo', caption: 'Terraced green hills surrounding Khonoma village' },
      { variant: 'interior', caption: 'Angami oak room decorated with backstrap-loomed shawls' },
      { variant: 'trail', caption: 'Heritage stone fort path above Khonoma amphitheater' },
    ],
    summary:
      'Immerse yourself in Asia’s first Green Village alongside master Naga backstrap weavers, complete with evening courtyard bonfires and traditional smoked Naga bamboo-shoot cuisine.',
    architectureNote:
      'Hand-dressed sandstone plinths and warm timber eaves overlooking emerald alder terraces.',
    etiquetteTips: [
      'Ask before photographing elders at their backstrap looms.',
      'Join morning community walks past historic Khonoma gates.',
    ],
    trailDistanceKm: 6.2,
    trailDifficulty: 'Moderate',
    elevationProfile: [1520, 1620, 1750, 1890, 1780, 1660, 1620],
    mapCoords: { x: 462, y: 270 },
    weather: {
      tempC: 18,
      condition: 'Golden Hill Sun',
      mistIndex: 'Crisp Alder Air',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:19 IST',
    },
    host: {
      name: 'Menuolhou & Vikuo Zatsu',
      lineage: 'Angami Naga Weavers',
      craft: 'Backstrap Loom Textiles & Village History',
      yearsHosting: 10,
      verifiedEcoGuide: true,
      quote: 'Every red and black thread in our shawls tells the story of our hills.',
      bio: 'Award-winning Naga textile weavers and conservation advocates in Khonoma.',
      languages: ['Tenyidie', 'Nagamese', 'English'],
      initials: 'MZ',
    },
    addons: [
      {
        id: 'backstrap-loom-workshop',
        title: 'Naga Backstrap Weaving & Craft Session',
        duration: '2.5 hrs',
        priceInr: 900,
        description: 'Hands-on loom introduction with natural hillside dyes.',
      },
    ],
    instantReserve: true,
  },
  {
    id: 'dzuko-pine-treehouse',
    title: 'Viswema Ridge Treehouse & Lily Basecamp',
    subtitle: 'Elevated cedar treehouse overlooking misty bamboo ridges on the route to Dzuko Valley',
    location: 'Viswema & Dzuko Foothills',
    state: 'Nagaland',
    highlights: ['Dzuko Valley', 'Treehouse', 'Bonfire'],
    category: 'Valley & Flowers',
    propertyType: 'Treehouse',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Trek Guide', 'Pet Friendly'],
    hostType: 'Naga Weaver',
    savedCount: 166,
    elevationMeters: 1980,
    pricePerNightInr: 4800,
    rating: 4.56,
    reviewCount: 39,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'nagaland',
    photoUrl: '/src/assets/images/nagaland_dzuko_flowers_1795236949408.jpg',
    photoAlt: 'Dzuko Valley rolling meadows and wildflower hillsides in Nagaland',
    scenes: [
      { variant: 'photo', caption: 'Morning mist rolling across Viswema and Dzukou ridge' },
      { variant: 'interior', caption: 'Cozy cedar treehouse bunk with panoramic ridge deck' },
      { variant: 'trail', caption: 'Direct trailhead path into Dzukou bamboo groves' },
    ],
    summary:
      'Designed specifically for Dzukou Valley hikers and nature photographers, this sunlit treehouse cabin sits minutes from the Viswema trek start with warm bonfire evenings.',
    architectureNote:
      'Sustainably harvested Naga alder stilts lifting the cedar cabin into oak treetops.',
    etiquetteTips: [
      'Pack reusable trekking poles and rain shells for sudden ridge showers.',
      'No single-use plastics allowed on Dzukou trails.',
    ],
    trailDistanceKm: 11.0,
    trailDifficulty: 'Alpine Ridge',
    elevationProfile: [1850, 1980, 2240, 2452, 2310, 2100, 1980],
    mapCoords: { x: 471, y: 274 },
    weather: {
      tempC: 15,
      condition: 'Breezy & Bright',
      mistIndex: 'Ridge Clouds',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:18 IST',
    },
    host: {
      name: 'Keneiseno & Vikho Solo',
      lineage: 'Viswema Trail Stewards',
      craft: 'Mountain Trekking & Woven Crafts',
      yearsHosting: 5,
      verifiedEcoGuide: true,
      quote: 'Wake in the treetops, hike into lilies by noon.',
      bio: 'Passionate trail guides and hospitality hosts on Nagaland’s southern ridge.',
      languages: ['Tenyidie', 'English', 'Hindi'],
      initials: 'KS',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'gangtok-dzongu-homestay',
    title: 'Dzongu Lepcha Cardamom Farm Homestay',
    subtitle: 'Sunlit organic cardamom farmstead looking straight toward snow-crowned Khangchendzonga',
    location: 'Dzongu Reserve, North Sikkim',
    state: 'Sikkim',
    highlights: ['Dzongu', 'Organic Farm', 'Teesta'],
    category: 'Valley & Flowers',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'River View', 'Trek Guide', 'Pet Friendly'],
    hostType: 'Local Artisan',
    savedCount: 169,
    elevationMeters: 1450,
    pricePerNightInr: 2900,
    rating: 4.88,
    reviewCount: 68,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'sikkim',
    photoUrl: '/src/assets/images/sikkim_tsomgo_lake_1795236949322.jpg',
    photoAlt: 'Snowy Sikkim mountain peaks and vibrant prayer flags over clear lake',
    scenes: [
      { variant: 'photo', caption: 'Golden peaks and Teesta canyon waters from Dzongu' },
      { variant: 'interior', caption: 'Traditional Lepcha wooden home with organic spice veranda' },
      { variant: 'trail', caption: 'Cane suspension bridge crossing the emerald Rongyoung river' },
    ],
    summary:
      'A peaceful protected-reserve homestay in Dzongu where Lepcha hosts serve 100% organic farm-to-table Sikkimese feasts beside cardamom orchards and roaring mountain rivers.',
    architectureNote:
      'Earth-and-timber Lepcha farmhouse with wide sunlit herb balconies.',
    etiquetteTips: [
      'Dzongu permits are arranged smoothly by your host 24h before arrival.',
      'Sample wild stinging-nettle soup and organic buck-wheat pancakes.',
    ],
    trailDistanceKm: 6.4,
    trailDifficulty: 'Moderate',
    elevationProfile: [1320, 1450, 1590, 1710, 1600, 1480, 1450],
    mapCoords: { x: 138, y: 148 },
    weather: {
      tempC: 15,
      condition: 'Crisp Mountain Sun',
      mistIndex: 'River Breeze',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:31 IST',
    },
    host: {
      name: 'Mayalmit & Gyatso Lepcha',
      lineage: 'Dzongu Lepcha Guardians',
      craft: 'Organic Cardamom & Bamboo Craft',
      yearsHosting: 13,
      verifiedEcoGuide: true,
      quote: 'In Dzongu, the mountains, rivers, and orchards look after every guest.',
      bio: 'Respected Lepcha storytellers preserving indigenous agroforestry and folklore.',
      languages: ['Lepcha', 'Nepali', 'English', 'Hindi'],
      initials: 'ML',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'gangtok-khangchendzonga-suite',
    title: 'Khangchendzonga Alpine Sky Villa',
    subtitle: 'Luxury heated mountain estate with floor-to-ceiling snow peak panoramas and private spa',
    location: 'Upper Gangtok & Rumtek Ridge',
    state: 'Sikkim',
    highlights: ['Khangchendzonga', 'Luxury Villa', 'Tsomgo Route'],
    category: 'Monastery & Passes',
    propertyType: 'Tea Estate Bungalow',
    amenities: ['WiFi', 'Bonfire', 'Local Food', 'Hot Water', 'Parking', 'Trek Guide'],
    hostType: 'Superhost',
    savedCount: 226,
    elevationMeters: 1980,
    pricePerNightInr: 12900,
    rating: 4.96,
    reviewCount: 58,
    maxGuests: 6,
    bedrooms: 3,
    artworkTheme: 'sikkim',
    photoUrl: '/src/assets/images/sikkim_tsomgo_lake_1795236949322.jpg',
    photoAlt: 'Sapphire glacial waters and snow-capped Khangchendzonga massif in Sikkim',
    scenes: [
      { variant: 'photo', caption: 'Panoramic Himalayan snowline glowing in amber sunrise' },
      { variant: 'interior', caption: 'Heated oak sky suite with fireplace and brass tea bar' },
      { variant: 'trail', caption: 'Private meditation terrace overlooking Rumtek valley' },
    ],
    summary:
      'Designed for milestone mountain retreats, featuring radiant-heated oak suites, private Himalayan bonfire lounge, and curated chauffeured excursions to Tsomgo Lake and Temi Tea Estate.',
    architectureNote:
      'Contemporary Himalayan stone-and-glass estate blended with hand-knotted Tibetan carpets.',
    etiquetteTips: [
      'Notify concierge 48 hours ahead for Nathula Pass high-altitude permits.',
    ],
    trailDistanceKm: 5.0,
    trailDifficulty: 'Gentle',
    elevationProfile: [1920, 1980, 2050, 2010, 1980, 1950, 1920],
    mapCoords: { x: 152, y: 162 },
    weather: {
      tempC: 11,
      condition: 'Crystal Clear',
      mistIndex: '35km Peak Visibility',
      trailStatus: 'Crisp Alpine',
      sunrise: '05:29 IST',
    },
    host: {
      name: 'Karma & Sonam Bhutia',
      lineage: 'Sikkimese Heritage Curators',
      craft: 'Alpine Hospitality & Fine Tea',
      yearsHosting: 10,
      verifiedEcoGuide: true,
      quote: 'Watching dawn light up Khangchendzonga from a warm bed is unforgettable.',
      bio: 'Boutique Sikkim hospitality founders bridging luxury comfort and local craft.',
      languages: ['Bhutia', 'Nepali', 'English', 'Hindi'],
      initials: 'KB',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'loktak-phumdi-houseboat',
    title: 'Loktak Emerald Houseboat & Canoe Deck',
    subtitle: 'Floating wooden houseboat gently moored on Loktak Lake amid blooming lotus and phumdi rings',
    location: 'Loktak Lake, Karang Island',
    state: 'Manipur',
    highlights: ['Houseboat', 'Loktak Lake', 'Sunrise Canoe'],
    category: 'Living Root & Lakes',
    propertyType: 'Houseboat (Loktak)',
    amenities: ['Local Food', 'River View', 'Trek Guide', 'Bonfire', 'Pet Friendly'],
    hostType: 'Superhost',
    savedCount: 254,
    elevationMeters: 768,
    pricePerNightInr: 4950,
    rating: 4.87,
    reviewCount: 72,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'manipur',
    photoUrl: '/src/assets/images/manipur_loktak_lake_1795236949260.jpg',
    photoAlt: 'Loktak Lake floating circular phumdis and wooden canoe at golden sunrise',
    scenes: [
      { variant: 'photo', caption: 'Floating houseboat deck framed by circular green phumdis' },
      { variant: 'interior', caption: 'Polished teak water cabin with 360-degree lake windows' },
      { variant: 'trail', caption: 'Dawn wooden canoe paddle into Keibul Lamjao waters' },
    ],
    summary:
      'Drift gently above the mirror waters of Loktak Lake aboard Manipur’s first eco-solar wooden houseboat, complete with private canoe dock and evening floating lantern suppers.',
    architectureNote:
      'Hand-joined local teak hull powered by silent rooftop solar panels and natural reed insulation.',
    etiquetteTips: [
      'Wear life vests provided on the deck during sunrise canoe paddles.',
      'Zero soap or chemical discharge into lake waters.',
    ],
    trailDistanceKm: 5.5,
    trailDifficulty: 'Gentle',
    elevationProfile: [768, 768, 768, 768, 768, 768, 768],
    mapCoords: { x: 428, y: 328 },
    weather: {
      tempC: 22,
      condition: 'Golden Lake Calm',
      mistIndex: 'Mirror Horizon',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:14 IST',
    },
    host: {
      name: 'Sanatomba & Memcha Ningthoujam',
      lineage: 'Karang Island Mariners',
      craft: 'Traditional Boatwright & Meitei Chef',
      yearsHosting: 8,
      verifiedEcoGuide: true,
      quote: 'On the lake, dawn arrives twice—first in the sky, then on the water.',
      bio: 'Island mariners pioneering sustainable floating eco-stays on Loktak Lake.',
      languages: ['Manipuri', 'English', 'Hindi'],
      initials: 'SN',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'moirang-lake-homestay',
    title: 'Moirang Courtyard Meitei Homestay',
    subtitle: 'Friendly lakeside family homestay offering home-cooked Manipuri meals and bamboo cycling',
    location: 'Moirang & Thanga Shore',
    state: 'Manipur',
    highlights: ['Loktak Lake', 'Moirang', 'Budget Stay'],
    category: 'Living Root & Lakes',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'Parking', 'River View'],
    hostType: 'Local Artisan',
    savedCount: 114,
    elevationMeters: 775,
    pricePerNightInr: 2250,
    rating: 4.54,
    reviewCount: 41,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'manipur',
    photoUrl: '/src/assets/images/manipur_loktak_lake_1795236949260.jpg',
    photoAlt: 'Golden morning reflections on Loktak Lake shoreline in Manipur',
    scenes: [
      { variant: 'photo', caption: 'Short morning walk to Thanga fishermen piers' },
      { variant: 'interior', caption: 'Bright sunlit courtyard room with handwoven bedcovers' },
      { variant: 'trail', caption: 'Lakeside cycling path toward Keibul Lamjao watchtower' },
    ],
    summary:
      'Affordable, warmly hosted family stay steps from Loktak’s southern shoreline, ideal for solo explorers and slow travelers.',
    architectureNote:
      'Sun-washed Meitei courtyard home surrounded by banana groves and lotus ponds.',
    etiquetteTips: [
      'Borrow complimentary bicycles for early morning lake rides.',
    ],
    trailDistanceKm: 4.0,
    trailDifficulty: 'Gentle',
    elevationProfile: [770, 775, 778, 775, 772, 770, 770],
    mapCoords: { x: 436, y: 332 },
    weather: {
      tempC: 23,
      condition: 'Warm Sunshine',
      mistIndex: 'Clear',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:14 IST',
    },
    host: {
      name: 'Biren & Kunjarani Laishram',
      lineage: 'Moirang Cultural Hosts',
      craft: 'Black Rice Farming & Cycling Guide',
      yearsHosting: 6,
      verifiedEcoGuide: false,
      quote: 'A simple cup of Chak-hao tea opens every morning warmly.',
      bio: 'Warm Meitei family welcoming travelers to Moirang heritage lanes.',
      languages: ['Manipuri', 'Hindi', 'English'],
      initials: 'BL',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'reiek-mizo-homestay',
    title: 'Reiek Tlang Sunlit Mizo Homestay',
    subtitle: 'Friendly Mizo family home near Reiek cliff trails with warm bamboo hearth suppers',
    location: 'Reiek Village, Aizawl Hills',
    state: 'Mizoram',
    highlights: ['Reiek', 'Mizo Craft', 'Cliff Views'],
    category: 'Valley & Flowers',
    propertyType: 'Homestay',
    amenities: ['WiFi', 'Local Food', 'Hot Water', 'Trek Guide', 'Parking'],
    hostType: 'Superhost',
    savedCount: 119,
    elevationMeters: 1465,
    pricePerNightInr: 2600,
    rating: 4.72,
    reviewCount: 38,
    maxGuests: 4,
    bedrooms: 2,
    artworkTheme: 'mizoram',
    photoUrl: '/src/assets/images/mizoram_phawngpui_hills_1795236949939.jpg',
    photoAlt: 'Sunlit terraced hills and rhododendrons across Mizoram valleys',
    scenes: [
      { variant: 'photo', caption: 'Sweeping valley vistas from Reiek peak lookout' },
      { variant: 'interior', caption: 'Tidy oak-and-cane Mizo family guest room' },
      { variant: 'trail', caption: 'Morning hike up Reiek limestone cliff ridge' },
    ],
    summary:
      'Accessible 1-hour drive from Aizawl, offering effortless ridge hikes, home-cooked Mizo meals, and community weaving visits.',
    architectureNote:
      'Elevated hilltop timber home designed for cross-breezes and sunset deck views.',
    etiquetteTips: [
      'Pack light windproofs for late afternoon ridge walks.',
    ],
    trailDistanceKm: 6.5,
    trailDifficulty: 'Moderate',
    elevationProfile: [1320, 1465, 1548, 1520, 1465, 1390, 1340],
    mapCoords: { x: 372, y: 368 },
    weather: {
      tempC: 19,
      condition: 'Sunlit Breezes',
      mistIndex: 'Clear Valleys',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:18 IST',
    },
    host: {
      name: 'Hmingthanga & Mawii Ralte',
      lineage: 'Reiek Community Hosts',
      craft: 'Mizo Puan Weaving & Orchid Trails',
      yearsHosting: 8,
      verifiedEcoGuide: true,
      quote: 'Every hill ridge in Mizoram opens onto another bright horizon.',
      bio: 'Active leaders in Reiek ecotourism and heritage craft preservation.',
      languages: ['Mizo', 'English'],
      initials: 'HR',
    },
    addons: [],
    instantReserve: true,
  },
  {
    id: 'unakoti-tripura-bamboo-hut',
    title: 'Unakoti Sandstone Forest Bamboo Hut',
    subtitle: 'Serene eco bamboo cottage near Tripura’s ancient Unakoti cliff carvings and waterfalls',
    location: 'Kailashahar & Unakoti Hills',
    state: 'Tripura',
    highlights: ['Unakoti', 'Bamboo Hut', 'Waterfall'],
    category: 'Heritage & Palaces',
    propertyType: 'Bamboo Hut',
    amenities: ['Bonfire', 'Local Food', 'Trek Guide', 'Pet Friendly', 'Parking'],
    hostType: 'Local Artisan',
    savedCount: 108,
    elevationMeters: 165,
    pricePerNightInr: 2350,
    rating: 4.38,
    reviewCount: 29,
    maxGuests: 3,
    bedrooms: 1,
    artworkTheme: 'tripura',
    photoUrl: '/src/assets/images/tripura_neermahal_palace_1795236949140.jpg',
    photoAlt: 'Neermahal water palace and bright Tripura lake heritage scenery',
    scenes: [
      { variant: 'photo', caption: 'Golden afternoon light along Tripura heritage trails' },
      { variant: 'interior', caption: 'Hand-split Tripura bamboo hut surrounded by betel palms' },
      { variant: 'trail', caption: 'Forest stone steps leading to Unakoti rock sculptures' },
    ],
    summary:
      'Stay minutes from the 7th-century rock-cut stone reliefs of Unakoti in a cozy bamboo hut surrounded by pineapple orchards and evening bonfires.',
    architectureNote:
      'Fine woven Tripura muli bamboo panels with shady courtyard veranda.',
    etiquetteTips: [
      'Visit Unakoti sculptures at 07:30 for quiet forest light.',
    ],
    trailDistanceKm: 4.8,
    trailDifficulty: 'Gentle',
    elevationProfile: [140, 165, 195, 210, 185, 165, 150],
    mapCoords: { x: 304, y: 334 },
    weather: {
      tempC: 25,
      condition: 'Warm Forest Sun',
      mistIndex: 'Orchard Breeze',
      trailStatus: 'Clear & Sunny',
      sunrise: '05:20 IST',
    },
    host: {
      name: 'Subrata & Malati Tripura',
      lineage: 'Tripuri Bamboo Craft Collective',
      craft: 'Fine Split-Bamboo Basketry',
      yearsHosting: 5,
      verifiedEcoGuide: true,
      quote: 'Our bamboo walls carry the scent of Tripura hills and monsoon sun.',
      bio: 'Artisan bamboo crafters welcoming heritage explorers to northern Tripura.',
      languages: ['Kokborok', 'Bengali', 'Hindi', 'English'],
      initials: 'ST',
    },
    addons: [],
    instantReserve: true,
  },
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function addDaysIso(isoDate: string, days: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + days);
    return fallback.toISOString().slice(0, 10);
  }
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysIso(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(30, days));
}

export const CLEANING_FEE_INR = 850;
export const HIGHLAND_FEE_RATE = 0.1;

export function calculateBookingBreakdown(
  sanctuary: Sanctuary,
  nights: number,
  totalGuests: number,
  selectedAddonIds: string[] = []
): {
  baseAmountInr: number;
  cleaningFeeInr: number;
  highlandFeeInr: number;
  addonsTotalInr: number;
  totalInr: number;
} {
  const safeNights = Math.max(1, nights);
  const safeGuests = Math.max(1, totalGuests);
  const baseAmountInr = sanctuary.pricePerNightInr * safeNights;
  const cleaningFeeInr = CLEANING_FEE_INR;
  const highlandFeeInr = Math.round(baseAmountInr * HIGHLAND_FEE_RATE);
  const addonsTotalInr = sanctuary.addons
    .filter((a) => selectedAddonIds.includes(a.id))
    .reduce((sum, a) => sum + a.priceInr * safeGuests, 0);
  const totalInr = baseAmountInr + cleaningFeeInr + highlandFeeInr + addonsTotalInr;
  return {
    baseAmountInr,
    cleaningFeeInr,
    highlandFeeInr,
    addonsTotalInr,
    totalInr,
  };
}

