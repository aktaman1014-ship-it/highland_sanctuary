import React, { useEffect, useRef, useState } from 'react';
import {
  BookmarkCheck,
  CalendarCheck,
  Loader2,
  Mic,
  Send,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { useAudioTranscriber } from '../hooks/useAudioRecorder';
import { syncItineraryToSql } from '../services/sqlSync';

export interface GeneratedDayItem {
  day: number;
  place: string;
  activities: string;
  stayLabel: string;
  costInr: number;
}

export interface GeneratedItineraryPlan {
  id: string;
  title: string;
  state: string;
  daysCount: number;
  budgetLabel: string;
  totalInr: number;
  breakdownText: string;
  days: GeneratedDayItem[];
  promptUsed: string;
  savedAt: string;
}

export const ITINERARY_STORAGE_KEY = 'itinerary';

export function loadSavedAIItineraries(): GeneratedItineraryPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ITINERARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GeneratedItineraryPlan[]) : [];
  } catch {
    return [];
  }
}

export function saveAIItineraryToLocal(plan: GeneratedItineraryPlan): GeneratedItineraryPlan[] {
  const existing = loadSavedAIItineraries();
  const next = [plan, ...existing.filter((item) => item.id !== plan.id)];
  try {
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

export function removeAIItineraryFromLocal(planId: string): GeneratedItineraryPlan[] {
  const next = loadSavedAIItineraries().filter((item) => item.id !== planId);
  try {
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}

interface StateDaySeed {
  place: string;
  activities: string;
  stayName: string;
}

const STATE_ROUTE_SEEDS: Record<string, StateDaySeed[]> = {
  Meghalaya: [
    {
      place: 'Shillong',
      activities: "Umiam Lake, Ward's Lake",
      stayName: 'Ri Cottage',
    },
    {
      place: 'Cherrapunji',
      activities: 'Double Decker Root Bridge, Nohkalikai',
      stayName: 'Sohra Pine Homestay',
    },
    {
      place: 'Dawki',
      activities: 'Boating, Mawlynnong village',
      stayName: 'Umngot Riverside Camp',
    },
    {
      place: 'Laitlum',
      activities: 'Trek, local food',
      stayName: 'Khasi Ridge Loft',
    },
    {
      place: 'Shillong',
      activities: 'Shopping return',
      stayName: 'Police Bazar Express',
    },
    {
      place: 'Mawsynram',
      activities: 'Mawjymbuin Caves, bamboo valley trail',
      stayName: 'Cloud Valley Cottage',
    },
    {
      place: 'Nongriat',
      activities: 'Rainbow Falls plunge pool, living root walk',
      stayName: 'Nongriat Khasi Homestay',
    },
    {
      place: 'Jowai',
      activities: 'Krang Suri turquoise falls, monolith garden',
      stayName: 'Jaintia Bamboo Hut',
    },
    {
      place: 'Shnongpdeng',
      activities: 'Crystal kayaking, cliff bonfire evening',
      stayName: 'Shnongpdeng Treehouse',
    },
    {
      place: 'Guwahati Airport',
      activities: 'Morning hill drive & departure',
      stayName: 'Return Transfer',
    },
  ],
  Assam: [
    {
      place: 'Tezpur & Kaziranga',
      activities: 'Brahmaputra drive, Kohora tea walk & bonfire',
      stayName: 'Kohora Courtyard Homestay',
    },
    {
      place: 'Kaziranga Central',
      activities: 'Dawn one-horned rhino jeep safari, orchid park',
      stayName: 'Kaziranga Bamboo Hut',
    },
    {
      place: 'Kaziranga Bagori',
      activities: 'Wetland elephant-grass trail, local Assamese thali',
      stayName: 'Bagori Tea Retreat',
    },
    {
      place: 'Majuli Island',
      activities: 'Ferry crossing, Kamalabari Satra mask workshop',
      stayName: 'Mising Chang Ghar',
    },
    {
      place: 'Majuli Riverbanks',
      activities: 'Eri silk weaving village, sunset sandbar canoe',
      stayName: 'Majuli River Pavilion',
    },
    {
      place: 'Jorhat & Dibrugarh',
      activities: 'Private orthodox & white-tea garden tasting',
      stayName: 'Manohari Tea Bungalow',
    },
    {
      place: 'Guwahati',
      activities: 'Brahmaputra river cruise, silk market & return',
      stayName: 'Brahmaputra Heritage Villa',
    },
    {
      place: 'Manas Park',
      activities: 'Foothills river rafting & golden langur watch',
      stayName: 'Manas Forest Cottage',
    },
    {
      place: 'Sivasagar',
      activities: 'Ahom Rang Ghar heritage temples & Joysagar tank',
      stayName: 'Sivasagar Courtyard',
    },
    {
      place: 'Guwahati',
      activities: 'Morning Kamakhya ridge view & departure',
      stayName: 'Airport Departure',
    },
  ],
  'Arunachal Pradesh': [
    {
      place: 'Dirang Valley',
      activities: 'Sangti pine river walk, hot water springs',
      stayName: 'Sangti Pine Homestay',
    },
    {
      place: 'Sela Pass & Tawang',
      activities: 'Snowy Sela Lake prayer flags, Jaswant Garh',
      stayName: 'Tawang Snow Chalet',
    },
    {
      place: 'Tawang Monastery',
      activities: 'Dawn monastery courtyard, Pangang Teng Tso lake',
      stayName: 'Monpa Stone Cottage',
    },
    {
      place: 'Zemithang',
      activities: 'High mountain stupa & yak pasture walk',
      stayName: 'Alpine Hearth Homestay',
    },
    {
      place: 'Bomdila',
      activities: 'Buddhist monastery & apple orchard sunset',
      stayName: 'Bomdila Oak Retreat',
    },
    {
      place: 'Ziro Valley',
      activities: 'Apatani pine groves & bamboo rice terraces',
      stayName: 'Ziro Bamboo Pavilion',
    },
    {
      place: 'Ziro & Tezpur',
      activities: 'Millet kitchen morning & valley return',
      stayName: 'Return Transfer',
    },
    {
      place: 'Mechuka',
      activities: 'Yargyap Chu wooden bridge & snow ridges',
      stayName: 'Mechuka Timber Lodge',
    },
    {
      place: 'Pasighat',
      activities: 'Siang River hanging bridge suspension walk',
      stayName: 'Siang River Cottage',
    },
    {
      place: 'Dibrugarh',
      activities: 'Bogibeel bridge crossing & departure',
      stayName: 'Airport Return',
    },
  ],
  Nagaland: [
    {
      place: 'Kohima',
      activities: 'Heritage museum & vibrant local evening market',
      stayName: 'Angami Ridge Homestay',
    },
    {
      place: 'Khonoma Green Village',
      activities: 'Zero-plastic alder terraces & weaver workshops',
      stayName: 'Naga Weaver Cottage',
    },
    {
      place: 'Dzuko Valley',
      activities: 'Wildflower lily ridge trek & bamboo meadow camp',
      stayName: 'Dzuko Valley Lodge',
    },
    {
      place: 'Kisama Heritage',
      activities: 'Hornbill Naga morung architecture & folk music',
      stayName: 'Hornbill Timber Stay',
    },
    {
      place: 'Kohima & Dimapur',
      activities: 'Artisan shawl shopping & return departure',
      stayName: 'Departure Transfer',
    },
    {
      place: 'Mokokchung',
      activities: 'Ao Naga hilltop villages & Longkhum flowers',
      stayName: 'Mokokchung Artisan Stay',
    },
    {
      place: 'Mon Heritage',
      activities: 'Konyak woodcraft trails & hilltop sunrise',
      stayName: 'Mon Eco Homestay',
    },
    {
      place: 'Tuophema',
      activities: 'Traditional Naga bamboo-cooked hearth supper',
      stayName: 'Tuophema Hut',
    },
    {
      place: 'Dzuleke',
      activities: 'Mithun forest stream walk & bonfire',
      stayName: 'Dzuleke River Stay',
    },
    {
      place: 'Dimapur',
      activities: 'Morning craft market & return flight',
      stayName: 'Return Transfer',
    },
  ],
  Sikkim: [
    {
      place: 'Gangtok',
      activities: 'Rumtek Monastery & MG Marg tea terrace walk',
      stayName: 'Sikkim Pine Chalet',
    },
    {
      place: 'Tsomgo & Nathula',
      activities: 'Glacial sapphire lake & Silk Route snow pass',
      stayName: 'Tsomgo Mountain Lodge',
    },
    {
      place: 'Dzongu Reserve',
      activities: 'Lepcha bamboo bridge & cardamom orchard trek',
      stayName: 'Dzongu Lepcha Homestay',
    },
    {
      place: 'Lachung',
      activities: 'Snowy waterfalls & Himalayan thukpa hearth',
      stayName: 'Lachung River Cottage',
    },
    {
      place: 'Yumthang Valley',
      activities: 'Valley of rhododendrons & hot spring return',
      stayName: 'Gangtok Oak Suite',
    },
    {
      place: 'Pelling',
      activities: 'Khangchendzonga skywalk & Pemayangtse Monastery',
      stayName: 'Pelling View Retreat',
    },
    {
      place: 'Ravangla',
      activities: 'Buddha Park sunrise & Temi tea garden stroll',
      stayName: 'Temi Tea Bungalow',
    },
    {
      place: 'Yuksom',
      activities: 'Khecheopalri sacred lake & forest meditation',
      stayName: 'Yuksom Forest Stay',
    },
    {
      place: 'Zuluk',
      activities: 'Old Silk Route spiral viewpoint sunrise',
      stayName: 'Zuluk Stone Homestay',
    },
    {
      place: 'Bagdogra / Pakyong',
      activities: 'Teesta riverside drive & departure',
      stayName: 'Return Transfer',
    },
  ],
  Manipur: [
    {
      place: 'Imphal',
      activities: 'Kangla Fort heritage walk & Ima Keithel women market',
      stayName: 'Meitei Courtyard Stay',
    },
    {
      place: 'Loktak Lake',
      activities: 'Floating houseboat check-in & sunset wooden canoe',
      stayName: 'Loktak Floating Houseboat',
    },
    {
      place: 'Keibul Lamjao',
      activities: 'Dawn Sangai deer watch & Moirang Phee weaving',
      stayName: 'Phumdi Eco-Cottage',
    },
    {
      place: 'Andro Craft Village',
      activities: 'Terracotta pottery kilns & black rice supper',
      stayName: 'Moirang Lake Homestay',
    },
    {
      place: 'Ukhrul / Shirui',
      activities: 'Shirui Lily hills walk & Tangkhul hospitality',
      stayName: 'Shirui Ridge Lodge',
    },
    {
      place: 'Imphal',
      activities: 'Loktak lotus breakfast & departure',
      stayName: 'Return Transfer',
    },
  ],
  Mizoram: [
    {
      place: 'Aizawl & Reiek',
      activities: 'Reiek limestone cliff hike & Mizo Puan weaving',
      stayName: 'Reiek Sunlit Homestay',
    },
    {
      place: 'Thenzawl',
      activities: 'Vantawng cascading falls & bamboo forest path',
      stayName: 'Thenzawl Bamboo Hut',
    },
    {
      place: 'Phawngpui',
      activities: 'Blue Mountain orchid ridge & rhododendron cliffs',
      stayName: 'Phawngpui Ridge Cabin',
    },
    {
      place: 'Tam Dil Lake',
      activities: 'Emerald lakeside picnic & Bai bamboo stew dinner',
      stayName: 'Aizawl Hill Cottage',
    },
    {
      place: 'Aizawl',
      activities: 'Solomon ridge morning view & return flight',
      stayName: 'Return Transfer',
    },
  ],
  Tripura: [
    {
      place: 'Agartala & Melaghar',
      activities: 'Ujjayanta heritage gardens & Rudrasagar sunset',
      stayName: 'Neermahal Lakefront Villa',
    },
    {
      place: 'Neermahal Palace',
      activities: 'Private boat around coral water palace & cane atelier',
      stayName: 'Rudrasagar Eco-Cottage',
    },
    {
      place: 'Unakoti Hills',
      activities: '7th-century sandstone cliff carvings & waterfall',
      stayName: 'Unakoti Bamboo Hut',
    },
    {
      place: 'Jampui Hills',
      activities: 'Orange orchard ridge sunrise & Tripuri hearth meal',
      stayName: 'Jampui Orchard Stay',
    },
    {
      place: 'Agartala',
      activities: 'Queen pineapple breakfast & return departure',
      stayName: 'Return Transfer',
    },
  ],
};

function detectTargetState(query: string): string {
  const lower = query.toLowerCase();
  if (/kaziranga|majuli|tezpur|assam|dibrugarh|brahmaputra|guwahati/.test(lower)) {
    return 'Assam';
  }
  if (/meghalaya|shillong|cherrapunji|sohra|dawki|nongriat|mawlynnong|laitlum/.test(lower)) {
    return 'Meghalaya';
  }
  if (/arunachal|tawang|ziro|sela|dirang|bomdila/.test(lower)) {
    return 'Arunachal Pradesh';
  }
  if (/nagaland|dzuko|kohima|khonoma|hornbill/.test(lower)) {
    return 'Nagaland';
  }
  if (/sikkim|tsomgo|nathula|gangtok|dzongu|lachung|pelling/.test(lower)) {
    return 'Sikkim';
  }
  if (/manipur|loktak|moirang|imphal|keibul/.test(lower)) {
    return 'Manipur';
  }
  if (/mizoram|phawngpui|reiek|aizawl|vantawng/.test(lower)) {
    return 'Mizoram';
  }
  if (/tripura|neermahal|unakoti|agartala|rudrasagar/.test(lower)) {
    return 'Tripura';
  }
  return 'Meghalaya';
}

function detectDaysCount(query: string, fallbackDays: number): number {
  const match = query.match(/(\d+)\s*(?:day|days|night|nights)\b/i);
  if (match) {
    const parsed = Number(match[1]);
    if (parsed >= 2 && parsed <= 14) return parsed;
  }
  return fallbackDays;
}

function parseBudgetTarget(query: string, fallbackBudget: string): { totalTarget: number; label: string } {
  const numMatch = query.match(/(?:under|below|budget|within|rs\.?|₹)\s*(\d+(?:\.\d+)?k?|\d{4,6})/i);
  if (numMatch) {
    const raw = numMatch[1].toLowerCase();
    const val = raw.endsWith('k') ? Math.round(parseFloat(raw) * 1000) : Number(raw);
    if (!Number.isNaN(val) && val >= 5000) {
      return { totalTarget: val, label: `Under ₹${val.toLocaleString('en-IN')}` };
    }
  }
  switch (fallbackBudget) {
    case '10k':
      return { totalTarget: 9800, label: '₹10k Budget' };
    case '20k':
      return { totalTarget: 19500, label: '₹20k Budget' };
    case '30k':
      return { totalTarget: 28800, label: '₹30k Comfort' };
    default:
      return { totalTarget: 46500, label: '₹50k+ Signature' };
  }
}

function formatK(amount: number): string {
  const k = amount / 1000;
  return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
}

function buildItineraryPlan(
  query: string,
  dropdownDays: number,
  dropdownBudget: string
): GeneratedItineraryPlan {
  const state = detectTargetState(query);
  const daysCount = detectDaysCount(query, dropdownDays);
  const isMeghalaya5DayExact =
    state === 'Meghalaya' &&
    daysCount === 5 &&
    (parseBudgetTarget(query, dropdownBudget).totalTarget <= 22000 ||
      dropdownBudget === '20k');

  if (isMeghalaya5DayExact) {
    return {
      id: `ai-plan-${Date.now()}`,
      title: '5 Days Meghalaya Scenic Explorer',
      state: 'Meghalaya',
      daysCount: 5,
      budgetLabel: 'Under Rs20,000',
      totalInr: 19500,
      breakdownText: 'Breakdown: Stay 10k, Food 5k, Transport 4.5k',
      promptUsed: query,
      savedAt: new Date().toISOString(),
      days: [
        {
          day: 1,
          place: 'Shillong',
          activities: "Umiam Lake, Ward's Lake",
          stayLabel: 'Stay: Ri Cottage',
          costInr: 3000,
        },
        {
          day: 2,
          place: 'Cherrapunji',
          activities: 'Double Decker Root Bridge, Nohkalikai',
          stayLabel: 'Sohra Pine Stay',
          costInr: 3500,
        },
        {
          day: 3,
          place: 'Dawki',
          activities: 'Boating, Mawlynnong village',
          stayLabel: 'Dawki Riverside Camp',
          costInr: 4000,
        },
        {
          day: 4,
          place: 'Laitlum',
          activities: 'Trek, local food',
          stayLabel: 'Laitlum Ridge Homestay',
          costInr: 3500,
        },
        {
          day: 5,
          place: 'Shillong',
          activities: 'Shopping return',
          stayLabel: 'Evening Return',
          costInr: 2000,
        },
      ],
    };
  }

  const { totalTarget, label } = parseBudgetTarget(query, dropdownBudget);
  const isHoneymoon = /honeymoon|romantic|couple/i.test(query);
  const seeds = STATE_ROUTE_SEEDS[state] ?? STATE_ROUTE_SEEDS.Meghalaya;

  const usableTarget = isHoneymoon && totalTarget < 25000 ? 29500 : totalTarget;
  const stayInr = Math.round((usableTarget * 0.52) / 500) * 500;
  const foodInr = Math.round((usableTarget * 0.25) / 500) * 500;
  const transportInr = Math.round((usableTarget * 0.23) / 500) * 500;
  const grandTotal = stayInr + foodInr + transportInr;

  const perDayAvg = Math.round(grandTotal / daysCount / 100) * 100;
  const days: GeneratedDayItem[] = Array.from({ length: daysCount }, (_, idx) => {
    const seed = seeds[idx % seeds.length];
    const isLast = idx === daysCount - 1;
    const dayCost = isLast
      ? Math.max(1500, grandTotal - perDayAvg * (daysCount - 1))
      : perDayAvg;

    return {
      day: idx + 1,
      place: seed.place,
      activities:
        isHoneymoon && idx === 1
          ? `${seed.activities}, candlelit private veranda`
          : seed.activities,
      stayLabel: isLast ? seed.stayName : `Stay: ${seed.stayName}`,
      costInr: dayCost,
    };
  });

  const displayState = state === 'Arunachal Pradesh' ? 'Arunachal' : state;
  const suffix = isHoneymoon ? 'Honeymoon Escape' : 'Sanctuary Trail';

  return {
    id: `ai-plan-${Date.now()}`,
    title: `${daysCount} Days ${displayState} ${suffix}`,
    state,
    daysCount,
    budgetLabel: label,
    totalInr: grandTotal,
    breakdownText: `Breakdown: Stay ${formatK(stayInr)}, Food ${formatK(foodInr)}, Transport ${formatK(transportInr)}`,
    promptUsed: query,
    savedAt: new Date().toISOString(),
    days,
  };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  plan?: GeneratedItineraryPlan;
}

interface AIChatboxProps {
  onItinerarySaved: (plan: GeneratedItineraryPlan) => void;
  onBookStaysForState: (state: string) => void;
}

const STARTER_PROMPTS = [
  '5 days Meghalaya under 20000',
  '7 days Assam honeymoon',
  '3 days Kaziranga from Tezpur',
];

export const AIChatbox: React.FC<AIChatboxProps> = ({
  onItinerarySaved,
  onBookStaysForState,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedDays, setSelectedDays] = useState<number>(5);
  const [selectedBudget, setSelectedBudget] = useState<string>('20k');
  const [isTyping, setIsTyping] = useState(false);
  const [savedPlanIds, setSavedPlanIds] = useState<string[]>([]);
  const {
    isRecording,
    isTranscribing,
    error: micError,
    startRecording,
    stopAndTranscribe,
  } = useAudioTranscriber();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: 'Namaste! Ask me to craft a custom 3–10 day North East India itinerary with real homestays, local food, and transparent budgets.',
    },
  ]);

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const replyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) {
        window.clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const submitPrompt = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
    }

    replyTimerRef.current = window.setTimeout(() => {
      const plan = buildItineraryPlan(trimmed, selectedDays, selectedBudget);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        plan,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPrompt(inputText);
  };

  const handleSavePlan = (plan: GeneratedItineraryPlan) => {
    saveAIItineraryToLocal(plan);
    void syncItineraryToSql(plan);
    setSavedPlanIds((prev) => (prev.includes(plan.id) ? prev : [...prev, plan.id]));
    onItinerarySaved(plan);
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      const transcript = await stopAndTranscribe();
      if (transcript) {
        setInputText(transcript);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <>
      {/* Floating Bottom-Right AI Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#FF8E8B]/55 animate-ping"
          />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Highland AI Itinerary Chatbox"
            className="relative w-[60px] h-[60px] rounded-full bg-[#FF8E8B] hover:bg-[#F7AFA6] shadow-lg flex flex-col items-center justify-center gap-0.5 text-white transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-white" />
            <span className="text-[11px] font-bold leading-none tracking-wide text-white">
              AI
            </span>
          </button>
        </div>
      )}

      {/* Chatbox Window */}
      {isOpen && (
        <section
          aria-label="Highland AI Itinerary Chatbox"
          className="fixed inset-0 w-full h-full sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[380px] sm:h-[550px] z-50 bg-white sm:rounded-2xl shadow-2xl border border-oak flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="px-4 py-3.5 bg-cream border-b border-oak flex items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-ink flex items-center gap-1.5">
                <span>Highland AI</span>
                <span aria-hidden="true">✨</span>
              </h2>
              <p className="text-xs font-medium text-lake-deep">
                Plan 3-10 days in 8 NE states
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close AI chatbox"
              className="w-8 h-8 rounded-full bg-[#FF8E8B] hover:bg-[#F7AFA6] text-slate-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </header>

          {/* Messages Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-sand/40">
            {/* Starter Prompts at Top */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider">
                Quick Ideas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isTyping}
                    onClick={() => submitPrompt(prompt)}
                    className="px-3 py-1.5 rounded-full bg-white border border-oak hover:border-[#FF8E8B] hover:bg-coral-tint text-xs font-semibold text-slate-ink transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#FF8E8B] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-ink shadow-xs">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              if (msg.plan) {
                const plan = msg.plan;
                const alreadySaved = savedPlanIds.includes(plan.id);
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="w-full rounded-2xl rounded-tl-sm bg-white border border-oak p-3.5 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-oak">
                        <div>
                          <p className="text-xs font-bold text-lake-deep">{plan.state}</p>
                          <h3 className="text-sm font-bold text-slate-ink">{plan.title}</h3>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-coral-tint text-slate-ink text-[11px] font-bold tabular-nums shrink-0">
                          {plan.daysCount} Days
                        </span>
                      </div>

                      <div className="space-y-2">
                        {plan.days.map((d) => (
                          <div
                            key={d.day}
                            className="rounded-xl bg-cream border border-oak/75 px-3 py-2 text-xs leading-relaxed"
                          >
                            <span className="font-bold text-slate-ink">
                              Day {d.day}: {d.place}
                            </span>
                            <span className="text-slate-muted">
                              {' '}
                              - {d.activities} - {d.stayLabel}{' '}
                            </span>
                            <span className="font-bold text-lake-deep tabular-nums">
                              Rs{d.costInr}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-lake-mist/70 border border-lake-light/40 px-3 py-2 text-xs">
                        <p className="font-bold text-slate-ink tabular-nums">
                          Total: Rs{plan.totalInr}
                        </p>
                        <p className="text-slate-muted font-medium mt-0.5">
                          {plan.breakdownText}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSavePlan(plan)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            alreadySaved
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-[#FF8E8B] border-[#FF8E8B] hover:bg-[#F7AFA6] text-slate-ink'
                          }`}
                        >
                          <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{alreadySaved ? 'Saved!' : 'Save to Itinerary'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onBookStaysForState(plan.state);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-lake text-lake-deep hover:bg-lake-mist text-xs font-bold transition-colors cursor-pointer"
                        >
                          <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Book These Stays</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white border border-oak px-3.5 py-2.5 text-xs sm:text-sm text-slate-ink leading-relaxed shadow-xs">
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start" aria-live="polite" aria-label="Highland AI is typing">
                <div className="rounded-2xl rounded-tl-sm bg-white border border-oak px-4 py-2.5 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#FF8E8B] animate-bounce [animation-delay:-0.25s]" />
                  <span className="w-2 h-2 rounded-full bg-[#FF8E8B] animate-bounce [animation-delay:-0.12s]" />
                  <span className="w-2 h-2 rounded-full bg-[#FF8E8B] animate-bounce" />
                </div>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>

          {/* Bottom Controls: Days & Budget Dropdowns + Input */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 bg-white border-t border-oak space-y-2.5 shrink-0"
          >
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between gap-2 bg-cream rounded-xl border border-oak px-3 py-1.5 text-xs">
                <span className="font-semibold text-slate-subtle">Days</span>
                <select
                  aria-label="Trip days"
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-ink focus:outline-none cursor-pointer tabular-nums"
                >
                  {[3, 5, 7, 10].map((d) => (
                    <option key={d} value={d}>
                      {d} Days
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center justify-between gap-2 bg-cream rounded-xl border border-oak px-3 py-1.5 text-xs">
                <span className="font-semibold text-slate-subtle">Budget</span>
                <select
                  aria-label="Trip budget"
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="bg-transparent font-bold text-slate-ink focus:outline-none cursor-pointer"
                >
                  {['10k', '20k', '30k', '50k+'].map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {micError && (
              <p className="text-[11px] font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
                {micError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask: 5 days in Meghalaya under 20k..."
                className="flex-1 bg-cream rounded-xl border border-oak px-3.5 py-2.5 text-xs sm:text-sm text-slate-ink placeholder:text-slate-subtle focus:outline-none focus:border-[#FF8E8B]"
              />
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={isTranscribing || isTyping}
                aria-label={isRecording ? 'Stop recording and transcribe' : 'Record voice prompt'}
                title={isRecording ? 'Stop & transcribe audio' : 'Dictate prompt with mic'}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-red-100 border-red-300 text-red-700 animate-pulse'
                    : 'bg-cream border-oak hover:border-lake text-lake-deep'
                }`}
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                aria-label="Send message"
                className="w-10 h-10 rounded-xl bg-[#FF8E8B] hover:bg-[#F7AFA6] disabled:opacity-50 text-slate-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
};
