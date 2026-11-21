import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Award,
  Building2,
  Car,
  Check,
  ChevronDown,
  Coffee,
  Compass,
  Droplets,
  Flame,
  Home,
  IndianRupee,
  MapPin,
  PawPrint,
  RotateCcw,
  Ship,
  Star,
  Tent,
  Trees,
  Utensils,
  Waves,
  Wifi,
  X,
} from 'lucide-react';
import {
  AMENITY_OPTIONS,
  AmenityOption,
  HOST_TYPES,
  HostType,
  PROPERTY_TYPES,
  PropertyType,
  Sanctuary,
} from '../data/sanctuaries';
import { TranslationBundle, TRANSLATIONS } from '../data/translations';
import {
  AdvancedSortOption,
  buildPriceHistogram,
  FilterState,
  hasActiveFilters,
  MAX_PRICE_BOUND,
  MIN_PRICE_BOUND,
  PRICE_PRESETS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  STATE_FILTER_META,
} from '../utils/smartSearch';

export type FilterPanelKey =
  | 'price'
  | 'propertyType'
  | 'rating'
  | 'amenities'
  | 'hostType'
  | 'state'
  | 'sort';

interface ExploreFilterBarProps {
  filters: FilterState;
  allStays: Sanctuary[];
  resultCount: number;
  onChange: (updater: (prev: FilterState) => FilterState) => void;
  onClearAll: () => void;
  labels?: TranslationBundle['filters'];
}

const AMENITY_ICONS: Record<AmenityOption, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4" />,
  Bonfire: <Flame className="w-4 h-4" />,
  'Local Food': <Utensils className="w-4 h-4" />,
  'Hot Water': <Droplets className="w-4 h-4" />,
  'Trek Guide': <Compass className="w-4 h-4" />,
  'River View': <Waves className="w-4 h-4" />,
  'Pet Friendly': <PawPrint className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />,
};

const PROPERTY_TYPE_META: Record<
  PropertyType,
  { shortLabel: string; icon: React.ReactNode }
> = {
  Homestay: { shortLabel: 'Homestay', icon: <Home className="w-4 h-4" /> },
  Cottage: { shortLabel: 'Cottage', icon: <Building2 className="w-4 h-4" /> },
  'Bamboo Hut': { shortLabel: 'Bamboo Hut', icon: <Tent className="w-4 h-4" /> },
  'Houseboat (Loktak)': { shortLabel: 'Houseboat', icon: <Ship className="w-4 h-4" /> },
  Treehouse: { shortLabel: 'Treehouse', icon: <Trees className="w-4 h-4" /> },
  'Tea Estate Bungalow': { shortLabel: 'Tea Bungalow', icon: <Coffee className="w-4 h-4" /> },
};

export const ExploreFilterBar: React.FC<ExploreFilterBarProps> = ({
  filters,
  allStays,
  resultCount,
  onChange,
  onClearAll,
  labels = TRANSLATIONS.en.filters,
}) => {
  const [openPanel, setOpenPanel] = useState<FilterPanelKey | null>(null);
  const barContainerRef = useRef<HTMLDivElement | null>(null);

  const panelTabs: { key: FilterPanelKey; label: string }[] = [
    { key: 'price', label: labels.price },
    { key: 'propertyType', label: labels.propertyType },
    { key: 'rating', label: labels.rating },
    { key: 'amenities', label: labels.amenities },
    { key: 'hostType', label: labels.hostType },
    { key: 'state', label: labels.state },
    { key: 'sort', label: labels.sort },
  ];

  const histogram = useMemo(() => buildPriceHistogram(allStays, 14), [allStays]);
  const maxBucketCount = Math.max(1, ...histogram.map((b) => b.count));

  const propertyTypeCounts = useMemo(() => {
    const counts: Partial<Record<PropertyType, number>> = {};
    for (const pt of PROPERTY_TYPES) counts[pt] = 0;
    for (const s of allStays) {
      counts[s.propertyType] = (counts[s.propertyType] ?? 0) + 1;
    }
    return counts;
  }, [allStays]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPanel(null);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        openPanel &&
        barContainerRef.current &&
        !barContainerRef.current.contains(e.target as Node)
      ) {
        if (window.innerWidth >= 768) {
          setOpenPanel(null);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openPanel]);

  const togglePanel = (key: FilterPanelKey) => {
    setOpenPanel((prev) => (prev === key ? null : key));
  };

  const priceActive =
    filters.priceMin !== MIN_PRICE_BOUND || filters.priceMax !== MAX_PRICE_BOUND;
  const propertyTypeActive = filters.propertyTypes.length > 0;
  const ratingActive = filters.minRating !== null;
  const amenitiesActive = filters.amenities.length > 0;
  const hostTypeActive = filters.hostTypes.length > 0;
  const stateActive = filters.states.length > 0;
  const sortActive = filters.sortBy !== 'recommended';
  const anyActive = hasActiveFilters(filters);

  const getPillLabel = (key: FilterPanelKey): string => {
    switch (key) {
      case 'price':
        return priceActive
          ? `₹${(filters.priceMin / 1000).toFixed(filters.priceMin % 1000 === 0 ? 0 : 1)}k–₹${(
              filters.priceMax / 1000
            ).toFixed(filters.priceMax % 1000 === 0 ? 0 : 1)}k`
          : labels.price;
      case 'propertyType':
        return propertyTypeActive
          ? `${labels.propertyType} (${filters.propertyTypes.length})`
          : labels.propertyType;
      case 'rating':
        return ratingActive
          ? filters.minRating === 4.5
            ? '4.5+ Superhost'
            : `${filters.minRating?.toFixed(1)}+ ${labels.rating}`
          : labels.rating;
      case 'amenities':
        return amenitiesActive
          ? `${labels.amenities} (${filters.amenities.length})`
          : labels.amenities;
      case 'hostType':
        return hostTypeActive
          ? `${labels.hostType} (${filters.hostTypes.length})`
          : labels.hostType;
      case 'state':
        return stateActive
          ? filters.states.length === 1
            ? filters.states[0] === 'Arunachal Pradesh'
              ? 'Arunachal'
              : filters.states[0]
            : `${labels.state} (${filters.states.length})`
          : labels.state;
      case 'sort':
        return sortActive
          ? SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? labels.sort
          : labels.sort;
    }
  };

  const isPillActive = (key: FilterPanelKey): boolean => {
    switch (key) {
      case 'price':
        return priceActive;
      case 'propertyType':
        return propertyTypeActive;
      case 'rating':
        return ratingActive;
      case 'amenities':
        return amenitiesActive;
      case 'hostType':
        return hostTypeActive;
      case 'state':
        return stateActive;
      case 'sort':
        return sortActive;
    }
  };

  const updateMinPrice = (val: number) => {
    const clamped = Math.max(MIN_PRICE_BOUND, Math.min(val, filters.priceMax - 500));
    onChange((prev) => ({ ...prev, priceMin: clamped }));
  };

  const updateMaxPrice = (val: number) => {
    const clamped = Math.min(MAX_PRICE_BOUND, Math.max(val, filters.priceMin + 500));
    onChange((prev) => ({ ...prev, priceMax: clamped }));
  };

  const togglePropertyType = (pt: PropertyType) => {
    onChange((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(pt)
        ? prev.propertyTypes.filter((item) => item !== pt)
        : [...prev.propertyTypes, pt],
    }));
  };

  const toggleAmenity = (amenity: AmenityOption) => {
    onChange((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((item) => item !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const toggleHostType = (ht: HostType) => {
    onChange((prev) => ({
      ...prev,
      hostTypes: prev.hostTypes.includes(ht)
        ? prev.hostTypes.filter((item) => item !== ht)
        : [...prev.hostTypes, ht],
    }));
  };

  const toggleState = (stateName: string) => {
    onChange((prev) => ({
      ...prev,
      states: prev.states.includes(stateName)
        ? prev.states.filter((item) => item !== stateName)
        : [...prev.states, stateName],
    }));
  };

  const minPercent =
    ((filters.priceMin - MIN_PRICE_BOUND) / (MAX_PRICE_BOUND - MIN_PRICE_BOUND)) * 100;
  const maxPercent =
    ((filters.priceMax - MIN_PRICE_BOUND) / (MAX_PRICE_BOUND - MIN_PRICE_BOUND)) * 100;

  const renderPanelContent = (panel: FilterPanelKey) => {
    if (panel === 'price') {
      return (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#FF8E8B]" />
                <span>{labels.nightlyPriceRange}</span>
              </h3>
              <p className="text-xs text-slate-subtle mt-0.5">{labels.priceSub}</p>
            </div>
            {priceActive && (
              <button
                type="button"
                onClick={() =>
                  onChange((prev) => ({
                    ...prev,
                    priceMin: MIN_PRICE_BOUND,
                    priceMax: MAX_PRICE_BOUND,
                  }))
                }
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer shrink-0"
              >
                {labels.reset}
              </button>
            )}
          </div>

          {/* Airbnb-style Histogram */}
          <div className="pt-1">
            <div
              className="h-20 flex items-end gap-1 px-1"
              aria-label="Number of stays across nightly price ranges"
            >
              {histogram.map((bucket) => {
                const heightPct =
                  bucket.count === 0
                    ? 14
                    : Math.max(24, Math.round((bucket.count / maxBucketCount) * 100));
                const inRange =
                  bucket.max >= filters.priceMin && bucket.min <= filters.priceMax;
                return (
                  <div
                    key={bucket.min}
                    title={`Rs. ${bucket.min.toLocaleString('en-IN')}–${bucket.max.toLocaleString('en-IN')}: ${bucket.count} stay${bucket.count === 1 ? '' : 's'}`}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div
                      className={`w-full rounded-t-sm transition-colors duration-150 ${
                        inRange ? 'bg-[#FF8E8B]' : 'bg-oak/55'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Dual-handle Coral Slider */}
            <div className="relative h-6 flex items-center -mt-1">
              <div className="w-full h-1.5 bg-oak/60 rounded-full relative">
                <div
                  className="absolute top-0 bottom-0 bg-[#FF8E8B] rounded-full"
                  style={{
                    left: `${minPercent}%`,
                    right: `${100 - maxPercent}%`,
                  }}
                />
              </div>
              <input
                type="range"
                aria-label="Minimum nightly price"
                min={MIN_PRICE_BOUND}
                max={MAX_PRICE_BOUND}
                step={250}
                value={filters.priceMin}
                onChange={(e) => updateMinPrice(Number(e.target.value))}
                className="price-range-input absolute inset-0 w-full h-6 m-0"
              />
              <input
                type="range"
                aria-label="Maximum nightly price"
                min={MIN_PRICE_BOUND}
                max={MAX_PRICE_BOUND}
                step={250}
                value={filters.priceMax}
                onChange={(e) => updateMaxPrice(Number(e.target.value))}
                className="price-range-input absolute inset-0 w-full h-6 m-0"
              />
            </div>
          </div>

          {/* Min - Max Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block bg-sand/70 rounded-2xl border border-oak px-3.5 py-2 focus-within:border-[#FF8E8B]">
              <span className="block text-[11px] font-semibold text-slate-subtle">
                {labels.minPrice} (₹)
              </span>
              <input
                type="number"
                min={MIN_PRICE_BOUND}
                max={filters.priceMax - 500}
                step={250}
                value={filters.priceMin}
                onChange={(e) => updateMinPrice(Number(e.target.value) || MIN_PRICE_BOUND)}
                className="w-full text-sm font-bold text-slate-ink bg-transparent focus:outline-none tabular-nums mt-0.5"
              />
            </label>
            <label className="block bg-sand/70 rounded-2xl border border-oak px-3.5 py-2 focus-within:border-[#FF8E8B]">
              <span className="block text-[11px] font-semibold text-slate-subtle">
                {labels.maxPrice} (₹)
              </span>
              <input
                type="number"
                min={filters.priceMin + 500}
                max={MAX_PRICE_BOUND}
                step={250}
                value={filters.priceMax}
                onChange={(e) => updateMaxPrice(Number(e.target.value) || MAX_PRICE_BOUND)}
                className="w-full text-sm font-bold text-slate-ink bg-transparent focus:outline-none tabular-nums mt-0.5"
              />
            </label>
          </div>

          {/* Quick Price Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRICE_PRESETS.map((preset) => {
              const selected =
                filters.priceMin === preset.min && filters.priceMax === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      priceMin: selected ? MIN_PRICE_BOUND : preset.min,
                      priceMax: selected ? MAX_PRICE_BOUND : preset.max,
                    }))
                  }
                  className={`px-2.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                      : 'bg-sand/50 border-oak text-slate-ink hover:border-[#FF8E8B]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (panel === 'propertyType') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
              <Home className="w-4 h-4 text-[#FF8E8B]" />
              <span>{labels.propertyType}</span>
            </h3>
            {propertyTypeActive && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, propertyTypes: [] }))}
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
              >
                {labels.clear}
              </button>
            )}
          </div>

          {/* 2-Column Icon Cards with Counts */}
          <div className="grid grid-cols-2 gap-2.5">
            {PROPERTY_TYPES.map((pt) => {
              const checked = filters.propertyTypes.includes(pt);
              const count = propertyTypeCounts[pt] ?? 0;
              const meta = PROPERTY_TYPE_META[pt];
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => togglePropertyType(pt)}
                  aria-pressed={checked}
                  className={`group flex flex-col justify-between gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    checked
                      ? 'bg-[#FF8E8B]/12 border-[#FF8E8B] ring-1 ring-[#FF8E8B]'
                      : 'bg-sand/40 border-oak hover:border-[#FF8E8B]/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-[#FF8E8B] text-white'
                          : 'bg-white border border-oak text-lake-deep'
                      }`}
                    >
                      {meta.icon}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                        checked
                          ? 'bg-[#FF8E8B] text-white'
                          : 'bg-white border border-oak text-slate-subtle'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-ink leading-tight">
                    {meta.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (panel === 'rating') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#FF8E8B] fill-[#FF8E8B]" />
              <span>{labels.minRatingTitle}</span>
            </h3>
            {ratingActive && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, minRating: null }))}
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
              >
                {labels.any}
              </button>
            )}
          </div>
          <div className="space-y-2.5" role="radiogroup" aria-label={labels.minRatingTitle}>
            {RATING_OPTIONS.map((opt) => {
              const selected = filters.minRating === opt.value;
              const fullStars = Math.floor(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      minRating: selected ? null : opt.value,
                    }))
                  }
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#FF8E8B]/12 border-[#FF8E8B] text-slate-ink ring-1 ring-[#FF8E8B]'
                      : 'bg-sand/40 border-oak text-slate-ink hover:border-[#FF8E8B]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-0.5 text-[#FF8E8B]" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < fullStars
                              ? 'fill-[#FF8E8B] text-[#FF8E8B]'
                              : opt.value % 1 >= 0.5 && idx === fullStars
                              ? 'fill-[#FF8E8B]/55 text-[#FF8E8B]'
                              : 'text-oak-deep'
                          }`}
                        />
                      ))}
                    </span>
                    <span>{opt.label}</span>
                  </span>

                  {/* Coral Radio Circle */}
                  <span
                    aria-hidden="true"
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected ? 'border-[#FF8E8B]' : 'border-oak-deep bg-white'
                    }`}
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#FF8E8B]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (panel === 'amenities') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-ink">{labels.amenities}</h3>
            {amenitiesActive && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, amenities: [] }))}
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
              >
                {labels.clear}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {AMENITY_OPTIONS.map((amenity) => {
              const selected = filters.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer text-left ${
                    selected
                      ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                      : 'bg-sand/40 border-oak text-slate-ink hover:border-[#FF8E8B]'
                  }`}
                >
                  <span className={selected ? 'text-white' : 'text-lake-deep'}>
                    {AMENITY_ICONS[amenity]}
                  </span>
                  <span className="truncate">{amenity}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (panel === 'hostType') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FF8E8B]" />
              <span>{labels.communityHostTitle}</span>
            </h3>
            {hostTypeActive && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, hostTypes: [] }))}
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
              >
                {labels.clear}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {HOST_TYPES.map((ht) => {
              const selected = filters.hostTypes.includes(ht);
              return (
                <button
                  key={ht}
                  type="button"
                  onClick={() => toggleHostType(ht)}
                  className={`px-3.5 py-2 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                      : 'bg-sand/40 border-oak text-slate-ink hover:border-[#FF8E8B]'
                  }`}
                >
                  {ht}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (panel === 'state') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF8E8B]" />
              <span>{labels.statesTitle}</span>
            </h3>
            {stateActive && (
              <button
                type="button"
                onClick={() => onChange((prev) => ({ ...prev, states: [] }))}
                className="text-xs font-bold text-lake-deep hover:text-slate-ink cursor-pointer"
              >
                {labels.clear}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {STATE_FILTER_META.map((meta) => {
              const selected = filters.states.includes(meta.state);
              return (
                <button
                  key={meta.state}
                  type="button"
                  onClick={() => toggleState(meta.state)}
                  style={
                    selected
                      ? undefined
                      : {
                          backgroundColor: meta.chipBg,
                          borderColor: meta.chipBorder,
                        }
                  }
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                      : 'text-slate-ink hover:brightness-95'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2.5 h-2.5 rounded-full shrink-0 border ${
                      selected ? 'border-white/70 bg-white' : 'border-slate-ink/20'
                    }`}
                    style={selected ? undefined : { backgroundColor: meta.dotColor }}
                  />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-ink flex items-center gap-1.5">
          <ArrowUpDown className="w-4 h-4 text-[#FF8E8B]" />
          <span>{labels.sortTitle}</span>
        </h3>
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => {
            const selected = filters.sortBy === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange((prev) => ({ ...prev, sortBy: opt.value as AdvancedSortOption }));
                  setOpenPanel(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                  selected
                    ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                    : 'bg-sand/40 border-oak text-slate-ink hover:border-[#FF8E8B]'
                }`}
              >
                <span>{opt.label}</span>
                {selected && <Check className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={barContainerRef}
      className="sticky top-16 z-30 -mx-4 px-4 md:-mx-6 md:px-6 py-2.5 md:py-3 glass-warm border-y border-oak"
    >
      <div className="relative max-w-[1280px] mx-auto">
        {/* Filter Pill Toolbar: no scrollbar on mobile, overflow-visible on desktop so anchored popovers never clip */}
        <div
          role="toolbar"
          aria-label="Explore stay filters"
          className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-0.5 no-scrollbar"
        >
          {panelTabs.map((tab) => {
            const active = isPillActive(tab.key);
            const isOpen = openPanel === tab.key;
            const alignRight = tab.key === 'state' || tab.key === 'sort';
            return (
              <div key={tab.key} className="relative shrink-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => togglePanel(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    active || isOpen
                      ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white font-bold shadow-sm'
                      : 'bg-white border-oak text-slate-ink hover:border-[#FF8E8B]'
                  }`}
                >
                  <span>{getPillLabel(tab.key)}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Anchored Airbnb-Style 380px Popover with Triangle Pointer */}
                {isOpen && (
                  <div
                    role="dialog"
                    aria-label={`${tab.label} filter options`}
                    className={`hidden md:block absolute top-full mt-3.5 z-50 w-[380px] bg-white border border-oak/80 rounded-3xl shadow-2xl p-5 ${
                      alignRight ? 'right-0' : 'left-0'
                    }`}
                  >
                    <div
                      aria-hidden="true"
                      className={`absolute -top-2 w-4 h-4 bg-white border-l border-t border-oak/80 rotate-45 ${
                        alignRight ? 'right-7' : 'left-7'
                      }`}
                    />
                    {renderPanelContent(tab.key)}
                    <div className="mt-4 pt-3 border-t border-oak/70 flex items-center justify-between">
                      <span className="text-xs text-slate-subtle tabular-nums">
                        {resultCount}{' '}
                        {resultCount === 1 ? labels.stayMatching : labels.staysMatching}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenPanel(null)}
                        className="px-5 py-1.5 rounded-full bg-[#FF8E8B] hover:bg-coral-soft text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        {labels.done}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              onClearAll();
              setOpenPanel(null);
            }}
            disabled={!anyActive}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border whitespace-nowrap shrink-0 transition-all ${
              anyActive
                ? 'bg-white border-oak-deep text-lake-deep hover:bg-coral-tint hover:border-[#FF8E8B] hover:text-slate-ink cursor-pointer'
                : 'bg-white/60 border-oak/60 text-slate-subtle cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{labels.clearAll}</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      {openPanel && (
        <div
          className="fixed inset-0 z-50 md:hidden flex items-end bg-slate-ink/45"
          onClick={() => setOpenPanel(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile filter options"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[82vh] bg-white rounded-t-3xl border-t border-oak shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Bottom Sheet Handle + Header */}
            <div className="px-5 pt-3 pb-3 border-b border-oak space-y-3">
              <div className="w-10 h-1 rounded-full bg-oak-deep mx-auto" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-ink">Filters</h2>
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setOpenPanel(null)}
                  className="w-8 h-8 rounded-full bg-sand border border-oak flex items-center justify-center text-slate-ink cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {panelTabs.map((tab) => {
                  const selected = openPanel === tab.key;
                  const active = isPillActive(tab.key);
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setOpenPanel(tab.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 cursor-pointer ${
                        selected || active
                          ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white'
                          : 'bg-white border-oak text-slate-muted'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto no-scrollbar flex-1">
              {renderPanelContent(openPanel)}
            </div>

            {/* Bottom Sheet Footer CTA */}
            <div className="px-5 py-4 border-t border-oak bg-sand flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setOpenPanel(null);
                }}
                className="px-4 py-2.5 rounded-full bg-white border border-oak text-xs font-bold text-slate-ink cursor-pointer"
              >
                {labels.clearAll}
              </button>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                className="flex-1 py-3 rounded-full bg-[#FF8E8B] hover:bg-coral-soft text-white text-sm font-bold tabular-nums cursor-pointer"
              >
                {resultCount} {resultCount === 1 ? labels.stayMatching : labels.staysMatching}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
