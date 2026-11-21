import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { formatInr, Sanctuary } from '../data/sanctuaries';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface StayCardProps {
  sanctuary: Sanctuary;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onSelect: (sanctuary: Sanctuary) => void;
  nights: number;
}

export const StayCard: React.FC<StayCardProps> = ({
  sanctuary,
  isSaved,
  onToggleSave,
  onSelect,
  nights,
}) => {
  const [slideIndex, setSlideIndex] = useState(0);
  const totalSlides = sanctuary.scenes.length;
  const activeScene = sanctuary.scenes[slideIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handleDot = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setSlideIndex(idx);
  };

  const handleHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(sanctuary.id);
  };

  return (
    <article
      onClick={() => onSelect(sanctuary)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(sanctuary);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${sanctuary.title} in ${sanctuary.state}`}
      className="group bg-cream rounded-2xl border border-oak pinterest-shadow hover:pinterest-shadow-hover transition-all duration-200 hover:-translate-y-1 overflow-hidden flex flex-col cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lake"
    >
      {/* 4:3 Rounded Media Carousel */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        <SanctuaryArtwork
          theme={sanctuary.artworkTheme}
          variant={activeScene.variant}
          photoUrl={sanctuary.photoUrl}
          photoAlt={sanctuary.photoAlt}
          className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Subtle bottom scrim for pagination dots */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
        />

        {/* Top-left Frosted Category Tag */}
        <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
          <span className="text-xs font-bold text-lake-deep whitespace-nowrap">
            {sanctuary.state}
          </span>
        </div>

        {/* Top-right Saved Favorite Toggle */}
        <button
          type="button"
          onClick={handleHeart}
          aria-label={isSaved ? `Remove ${sanctuary.title} from saved` : `Save ${sanctuary.title}`}
          aria-pressed={isSaved}
          className="absolute top-3 right-3 w-10 h-10 rounded-full glass-warm flex items-center justify-center transition-transform duration-150 active:scale-90 hover:scale-105 cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-coral text-coral' : 'text-slate-ink'
            }`}
          />
        </button>

        {/* Carousel Prev / Next Controls */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous scene"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-warm flex items-center justify-center text-slate-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next scene"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-warm flex items-center justify-center text-slate-ink opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Discreet Micro-dot Pagination */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {sanctuary.scenes.map((scene, idx) => (
            <button
              key={scene.variant}
              type="button"
              onClick={(e) => handleDot(e, idx)}
              aria-label={`Show ${scene.variant} view`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === slideIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/65 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content Footer */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-ink leading-snug group-hover:text-lake-deep transition-colors">
              {sanctuary.title}
            </h3>
            <div className="inline-flex items-center gap-1 shrink-0 pt-0.5 text-sm font-bold text-slate-ink tabular-nums">
              <Star className="w-3.5 h-3.5 fill-coral text-coral" />
              <span>{sanctuary.rating.toFixed(2)}</span>
              <span className="text-slate-subtle font-normal text-xs">({sanctuary.reviewCount})</span>
            </div>
          </div>

          {/* Unboxed Metadata with Typographic Separators */}
          <p className="text-xs font-semibold text-lake-deep">
            {sanctuary.propertyType}
            <span aria-hidden="true"> · </span>
            {sanctuary.hostType}
            <span aria-hidden="true"> · </span>
            {sanctuary.highlights.slice(0, 2).join(' · ')}
          </p>

          <p className="text-xs text-slate-subtle">
            {sanctuary.location}
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{sanctuary.elevationMeters.toLocaleString('en-IN')}m</span>
            <span aria-hidden="true"> · </span>
            <span>{sanctuary.amenities.slice(0, 3).join(' · ')}</span>
          </p>

          <p className="text-sm text-slate-muted leading-relaxed line-clamp-2 pt-1">
            {sanctuary.subtitle}
          </p>
        </div>

        {/* Price & Booking Footer */}
        <div className="pt-3 border-t border-oak flex items-baseline justify-between gap-2">
          <div>
            <span className="text-base font-bold text-slate-ink tabular-nums">
              {formatInr(sanctuary.pricePerNightInr)}
            </span>
            <span className="text-xs text-slate-subtle"> / night</span>
            {nights > 1 && (
              <span className="ml-2 text-xs text-slate-muted tabular-nums">
                ({formatInr(sanctuary.pricePerNightInr * nights)} for {nights}n)
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-lake-deep whitespace-nowrap">
            {sanctuary.instantReserve ? 'Instant Reserve' : 'Host Request'}
          </span>
        </div>
      </div>
    </article>
  );
};
