import React from 'react';
import { ArrowRight, CloudSun, ShieldCheck } from 'lucide-react';
import { Sanctuary } from '../data/sanctuaries';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface HostsViewProps {
  sanctuaries: Sanctuary[];
  onSelectSanctuary: (sanctuary: Sanctuary) => void;
}

export const HostsView: React.FC<HostsViewProps> = ({ sanctuaries, onSelectSanctuary }) => {
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-wide text-lake-deep mb-2">
          Eight States · Local Stewards
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-ink">
          Artisan Hosts Across North East India
        </h1>
        <p className="text-sm md:text-base text-slate-muted mt-2 leading-relaxed">
          Every Highland Sanctuary homestay is led by indigenous families, silk weavers,
          monastery artisans, and eco-guides across Assam, Meghalaya, Arunachal Pradesh,
          Nagaland, Sikkim, Manipur, Mizoram, and Tripura.
        </p>
      </div>

      {/* Horizontal Editorial Host Narrative Tiles */}
      <div className="space-y-6">
        {sanctuaries.map((sanctuary) => (
          <article
            key={sanctuary.id}
            className="bg-cream rounded-2xl border border-oak pinterest-shadow overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch"
          >
            {/* Left Media Frame */}
            <div className="md:col-span-4 relative aspect-[4/3] md:aspect-auto min-h-[220px] bg-sand">
              <SanctuaryArtwork
                theme={sanctuary.artworkTheme}
                variant="photo"
                photoUrl={sanctuary.photoUrl}
                photoAlt={sanctuary.photoAlt}
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-lake-deep">
                  {sanctuary.state}
                </span>
              </div>
            </div>

            {/* Right Editorial Narrative */}
            <div className="md:col-span-8 p-6 md:p-7 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-coral-peach text-slate-ink flex items-center justify-center text-sm font-bold shrink-0">
                      {sanctuary.host.initials}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-ink">{sanctuary.host.name}</h2>
                      <p className="text-xs font-medium text-slate-subtle">
                        {sanctuary.host.lineage}
                        <span aria-hidden="true"> · </span>
                        <span>{sanctuary.host.craft}</span>
                      </p>
                    </div>
                  </div>

                  {sanctuary.host.verifiedEcoGuide && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lake-deep bg-lake-mist px-3.5 py-1.5 rounded-full">
                      <ShieldCheck className="w-4 h-4 text-lake" />
                      <span>Certified Eco-Guide</span>
                    </span>
                  )}
                </div>

                <blockquote
                  className="text-base md:text-lg italic text-slate-ink leading-relaxed pt-1"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  "{sanctuary.host.quote}"
                </blockquote>

                <p className="text-sm text-slate-muted leading-relaxed">{sanctuary.host.bio}</p>
              </div>

              <div className="pt-4 border-t border-oak flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-subtle">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-ink">
                    <CloudSun className="w-3.5 h-3.5 text-lake" />
                    <span className="tabular-nums">{sanctuary.weather.tempC}°C</span>
                    <span>· {sanctuary.weather.condition}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Languages: {sanctuary.host.languages.join(', ')}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {sanctuary.host.yearsHosting} years hosting
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSanctuary(sanctuary)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Visit {sanctuary.state} Stay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
