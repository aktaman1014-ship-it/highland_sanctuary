import React, { useEffect, useState } from 'react';
import {
  AudioLines,
  Calendar,
  Compass,
  Loader2,
  MapPin,
  Mic,
  Search,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { CATEGORIES, ExperienceCategory, REGIONS } from '../data/sanctuaries';
import { useAudioTranscriber } from '../hooks/useAudioRecorder';
import { ParsedSmartChip } from '../utils/smartSearch';

interface SearchDockProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  checkInDate: string;
  onCheckInDateChange: (date: string) => void;
  nights: number;
  onNightsChange: (nights: number) => void;
  selectedCategory: ExperienceCategory;
  onCategoryChange: (cat: ExperienceCategory) => void;
  instantOnly: boolean;
  onInstantOnlyChange: (val: boolean) => void;
  resultCount: number;
  smartQuery: string;
  onSmartQuerySubmit: (query: string) => void;
  activeAiChips: ParsedSmartChip[];
  onRemoveAiChip: (chipKey: string) => void;
  onOpenVoiceConcierge?: () => void;
  searchInputRef?: React.RefObject<HTMLSelectElement | null>;
}

const AI_EXAMPLE_PROMPTS = [
  'cheap homestay in Kaziranga with bonfire under 4000',
  'houseboat in Loktak under 6k',
  'treehouse in Meghalaya with trek guide',
  'Naga weaver homestay with bonfire',
];

export const SearchDock: React.FC<SearchDockProps> = ({
  selectedRegion,
  onRegionChange,
  checkInDate,
  onCheckInDateChange,
  nights,
  onNightsChange,
  selectedCategory,
  onCategoryChange,
  instantOnly,
  onInstantOnlyChange,
  resultCount,
  smartQuery,
  onSmartQuerySubmit,
  activeAiChips,
  onRemoveAiChip,
  onOpenVoiceConcierge,
  searchInputRef,
}) => {
  const [draftQuery, setDraftQuery] = useState(smartQuery);
  const {
    isRecording,
    isTranscribing,
    error: micError,
    startRecording,
    stopAndTranscribe,
  } = useAudioTranscriber();

  useEffect(() => {
    setDraftQuery(smartQuery);
  }, [smartQuery]);

  const handleToggleMic = async () => {
    if (isRecording) {
      const transcript = await stopAndTranscribe();
      if (transcript) {
        setDraftQuery(transcript);
        onSmartQuerySubmit(transcript);
      }
    } else {
      await startRecording();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSmartQuerySubmit(draftQuery);
  };

  const handleExampleClick = (prompt: string) => {
    setDraftQuery(prompt);
    onSmartQuerySubmit(prompt);
  };

  return (
    <section aria-label="AI Smart Search and sanctuary filters" className="space-y-4">
      {/* AI Smart Search Bar */}
      <form
        onSubmit={handleFormSubmit}
        className="bg-cream rounded-2xl border border-oak pinterest-shadow p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-oak px-3.5 py-2.5 focus-within:border-coral transition-colors">
            <Sparkles className="w-4 h-4 text-coral shrink-0" />
            <input
              type="text"
              aria-label="AI Smart Search"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder='Try "cheap homestay in Kaziranga with bonfire under 4000"'
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-ink placeholder:text-slate-subtle focus:outline-none"
            />
            {draftQuery && (
              <button
                type="button"
                aria-label="Clear search text"
                onClick={() => {
                  setDraftQuery('');
                  onSmartQuerySubmit('');
                }}
                className="p-1 rounded-full text-slate-subtle hover:text-slate-ink hover:bg-sand cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleMic}
              disabled={isTranscribing}
              aria-label={isRecording ? 'Stop recording and transcribe' : 'Speak search query'}
              title={isRecording ? 'Tap to transcribe spoken query' : 'Voice search (Transcribe Audio)'}
              className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-red-100 text-red-700 animate-pulse'
                  : 'text-lake-deep hover:bg-lake-mist'
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
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Smart Search</span>
          </button>

          {onOpenVoiceConcierge && (
            <button
              type="button"
              onClick={onOpenVoiceConcierge}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-lake-mist hover:bg-lake text-lake-deep hover:text-white border border-lake-light text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <AudioLines className="w-4 h-4" />
              <span>Talk to Concierge</span>
            </button>
          )}
        </div>

        {micError && (
          <p className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
            {micError}
          </p>
        )}

        {/* Example AI Prompts & Active Parsed Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-lake-deep shrink-0">Try asking:</span>
          {AI_EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="px-2.5 py-1 rounded-full bg-white border border-oak hover:border-coral text-slate-muted hover:text-slate-ink transition-colors cursor-pointer text-left"
            >
              “{example}”
            </button>
          ))}
        </div>

        {activeAiChips.length > 0 && (
          <div className="pt-2 border-t border-oak flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-lake-deep flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-coral" />
              <span>AI Parsed:</span>
            </span>
            {activeAiChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => onRemoveAiChip(chip.key)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral text-slate-ink text-xs font-bold cursor-pointer hover:bg-coral-soft"
              >
                <span>{chip.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Big Airbnb-Style Search Dock */}
      <div className="bg-cream rounded-2xl md:rounded-full p-2.5 md:pl-7 md:pr-3 border border-oak pinterest-shadow">
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.25fr_1.15fr_auto] items-center gap-2 md:gap-0">
          {/* Segment 1: State / Destination */}
          <div className="px-3 py-2.5 md:py-2 md:pr-5 md:border-r border-oak">
            <label
              htmlFor="where-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-lake-deep mb-1"
            >
              <MapPin className="w-4 h-4 text-lake" />
              <span>Where in North East</span>
            </label>
            <select
              ref={searchInputRef}
              id="where-select"
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full bg-transparent text-base font-bold text-slate-ink focus:outline-none cursor-pointer truncate"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Segment 2: Dates */}
          <div className="px-3 py-2.5 md:py-2 md:px-5 md:border-r border-oak">
            <label
              htmlFor="checkin-date"
              className="flex items-center gap-1.5 text-xs font-semibold text-lake-deep mb-1"
            >
              <Calendar className="w-4 h-4 text-lake" />
              <span>Check-in & Nights</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="checkin-date"
                type="date"
                value={checkInDate}
                onChange={(e) => onCheckInDateChange(e.target.value)}
                className="bg-transparent text-sm sm:text-base font-bold text-slate-ink focus:outline-none tabular-nums cursor-pointer min-w-0"
              />
              <span className="text-slate-subtle text-xs">·</span>
              <select
                aria-label="Number of nights"
                value={nights}
                onChange={(e) => onNightsChange(Number(e.target.value))}
                className="bg-transparent text-sm sm:text-base font-bold text-lake-deep focus:outline-none cursor-pointer tabular-nums"
              >
                {[1, 2, 3, 4, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'night' : 'nights'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segment 3: Experiences */}
          <div className="px-3 py-2.5 md:py-2 md:px-5">
            <label
              htmlFor="experience-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-lake-deep mb-1"
            >
              <Compass className="w-4 h-4 text-lake" />
              <span>Experience</span>
            </label>
            <select
              id="experience-select"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value as ExperienceCategory)}
              className="w-full bg-transparent text-base font-bold text-slate-ink focus:outline-none cursor-pointer truncate"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Summary Coral CTA */}
          <div className="px-2 pb-1 md:p-0">
            <a
              href="#sanctuary-grid"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 gradient-coral-peach hover:opacity-95 text-slate-ink text-sm sm:text-base font-bold rounded-full transition-all duration-150 whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explore {resultCount} {resultCount === 1 ? 'Stay' : 'Stays'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Instant Reserve */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div
          role="tablist"
          aria-label="Sanctuary categories"
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => onCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lake ${
                  isSelected
                    ? 'bg-coral border-coral text-slate-ink shadow-sm'
                    : 'bg-cream border-oak text-slate-muted hover:border-oak-deep hover:text-slate-ink'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onInstantOnlyChange(!instantOnly)}
            aria-pressed={instantOnly}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              instantOnly
                ? 'bg-lake-mist border-lake text-lake-deep'
                : 'bg-cream border-oak text-slate-muted hover:border-lake-light'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                instantOnly
                  ? 'bg-lake border-lake text-white'
                  : 'border-oak-deep bg-white'
              }`}
              aria-hidden="true"
            >
              {instantOnly ? '✓' : ''}
            </span>
            <span>Instant Reserve</span>
          </button>
        </div>
      </div>
    </section>
  );
};
