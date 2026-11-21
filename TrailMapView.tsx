import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  CloudSun,
  Compass,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Mic,
  Mountain,
  Navigation,
  Sparkles,
  Square,
} from 'lucide-react';
import { formatInr, Sanctuary } from '../data/sanctuaries';
import { useAudioTranscriber } from '../hooks/useAudioRecorder';
import { SanctuaryArtwork } from './SanctuaryArtwork';

interface TrailMapViewProps {
  sanctuaries: Sanctuary[];
  onSelectSanctuary: (sanctuary: Sanctuary) => void;
}

interface GroundedPlace {
  title: string;
  uri: string;
  reviewSnippets?: string[];
}

interface GroundingResult {
  text: string;
  places: GroundedPlace[];
}

interface LiveMapPlaceItem {
  id: string;
  displayName: string;
  formattedAddress?: string;
  rating?: number;
  location: { lat: number; lng: number };
}

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];

const LivePlacePin: React.FC<{
  place: LiveMapPlaceItem;
  isActive: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
}> = ({ place, isActive, onSelect, onCloseInfo }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        title={place.displayName}
        onClick={onSelect}
      >
        <Pin
          background={isActive ? '#FF8E8B' : '#4A8FB7'}
          borderColor="#2C3E50"
          glyphColor={isActive ? '#2C3E50' : '#FFFFFF'}
        />
      </AdvancedMarker>

      {isActive && marker && (
        <InfoWindow anchor={marker} maxWidth={240} onCloseClick={onCloseInfo}>
          <div className="p-1 space-y-1 text-slate-ink">
            <p className="text-xs font-bold leading-snug">{place.displayName}</p>
            {place.formattedAddress && (
              <p className="text-[11px] text-slate-muted leading-snug">
                {place.formattedAddress}
              </p>
            )}
            {typeof place.rating === 'number' && (
              <p className="text-[11px] font-semibold text-lake-deep">
                Rating: {place.rating.toFixed(1)} ★
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const GoogleMapsLiveLayer: React.FC<{
  activeSanctuary: Sanctuary;
  onStatusError: (msg: string | null) => void;
}> = ({ activeSanctuary, onStatusError }) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const coreLib = useMapsLibrary('core');
  const loadingStatus = useApiLoadingStatus();

  const [places, setPlaces] = useState<LiveMapPlaceItem[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  useEffect(() => {
    if (
      loadingStatus === APILoadingStatus.FAILED ||
      loadingStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      onStatusError(
        'Unable to load interactive map tiles. Please verify your API configuration or network.'
      );
    } else {
      onStatusError(null);
    }
  }, [loadingStatus, onStatusError]);

  useEffect(() => {
    if (!placesLib || !map) return;

    let cancelled = false;

    const searchDestination = async () => {
      try {
        const request = {
          textQuery: `${activeSanctuary.location}, ${activeSanctuary.state}, India`,
          fields: ['id', 'displayName', 'location', 'formattedAddress', 'rating'],
          maxResultCount: 6,
          region: 'in',
          internalUsageAttributionIds: ATTRIBUTION_IDS,
        } as Parameters<typeof placesLib.Place.searchByText>[0];

        const { places: found } = await placesLib.Place.searchByText(request);
        if (cancelled) return;

        const mapped: LiveMapPlaceItem[] = [];
        for (const item of found) {
          if (!item.location) continue;
          mapped.push({
            id: item.id,
            displayName: item.displayName || activeSanctuary.location,
            formattedAddress: item.formattedAddress ?? undefined,
            rating: typeof item.rating === 'number' ? item.rating : undefined,
            location: {
              lat: item.location.lat(),
              lng: item.location.lng(),
            },
          });
        }

        setPlaces(mapped);
        setSelectedPlaceId(mapped[0]?.id ?? null);

        if (mapped.length > 0 && coreLib) {
          const bounds = new coreLib.LatLngBounds();
          mapped.forEach((p) => bounds.extend(p.location));
          map.fitBounds(bounds, 48);
        }
        onStatusError(null);
      } catch (err) {
        if (!cancelled) {
          console.error('Places searchByText failed:', err);
          onStatusError(
            'Unable to load place pins for this region. Please check your network or API settings.'
          );
        }
      }
    };

    void searchDestination();

    return () => {
      cancelled = true;
    };
  }, [activeSanctuary.id, activeSanctuary.location, activeSanctuary.state, placesLib, coreLib, map, onStatusError]);

  return (
    <>
      {places.map((place) => (
        <LivePlacePin
          key={place.id}
          place={place}
          isActive={selectedPlaceId === place.id}
          onSelect={() => setSelectedPlaceId(place.id)}
          onCloseInfo={() => setSelectedPlaceId(null)}
        />
      ))}
    </>
  );
};

export const TrailMapView: React.FC<TrailMapViewProps> = ({
  sanctuaries,
  onSelectSanctuary,
}) => {
  const [selectedId, setSelectedId] = useState<string>(sanctuaries[0].id);
  const active = sanctuaries.find((s) => s.id === selectedId) ?? sanctuaries[0];

  const [mapError, setMapError] = useState<string | null>(null);
  const [groundingQuery, setGroundingQuery] = useState<string>('');
  const [isGroundingLoading, setIsGroundingLoading] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [groundingResult, setGroundingResult] = useState<GroundingResult | null>(null);
  const [useUserCoords, setUseUserCoords] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const {
    isRecording,
    isTranscribing,
    error: micError,
    startRecording,
    stopAndTranscribe,
  } = useAudioTranscriber();

  const stateRepresentatives = useMemo(() => {
    const seen: Record<string, Sanctuary> = {};
    for (const stay of sanctuaries) {
      if (!seen[stay.state]) {
        seen[stay.state] = stay;
      }
    }
    return Object.values(seen);
  }, [sanctuaries]);

  const activeStateStays = useMemo(
    () => sanctuaries.filter((s) => s.state === active.state),
    [sanctuaries, active.state]
  );

  const minElev = Math.min(...active.elevationProfile);
  const maxElev = Math.max(...active.elevationProfile);
  const elevSpan = Math.max(20, maxElev - minElev);

  const profilePoints = active.elevationProfile
    .map((val, idx) => {
      const x = 16 + (idx / (active.elevationProfile.length - 1)) * 288;
      const y = 74 - ((val - minElev) / elevSpan) * 52;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const quickPrompts = useMemo(
    () => [
      `Scenic viewpoints, cafes, and landmarks near ${active.location}, ${active.state}`,
      `Nearest airport, railway station, and road travel to ${active.location}, ${active.state}`,
      `Best nature trails, waterfalls, and eco-villages in ${active.state}`,
    ],
    [active.location, active.state]
  );

  const runMapsGrounding = useCallback(
    async (promptText: string, coordsOverride?: { lat: number; lng: number } | null) => {
      const cleaned = promptText.trim();
      if (!cleaned) return;

      setGroundingQuery(cleaned);
      setIsGroundingLoading(true);
      setGroundingError(null);

      try {
        const coordsToUse =
          coordsOverride !== undefined ? coordsOverride : useUserCoords ? userCoords : null;

        const res = await fetch('/api/ai/maps-grounding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleaned,
            ...(coordsToUse ? { lat: coordsToUse.lat, lng: coordsToUse.lng } : {}),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to query Google Maps Grounding.');
        }

        setGroundingResult({
          text: String(data.text || ''),
          places: Array.isArray(data.places) ? data.places : [],
        });
      } catch (err) {
        setGroundingError(
          err instanceof Error
            ? err.message
            : 'Unable to load route and place insights right now. Please try again.'
        );
      } finally {
        setIsGroundingLoading(false);
      }
    },
    [useUserCoords, userCoords]
  );

  const handleToggleGeolocation = () => {
    if (useUserCoords) {
      setUseUserCoords(false);
      setUserCoords(null);
      setGeoStatus(null);
      return;
    }

    if (!navigator.geolocation) {
      setGeoStatus('Location services are unavailable in this browser.');
      return;
    }

    setGeoStatus('Detecting your coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserCoords(nextCoords);
        setUseUserCoords(true);
        setGeoStatus(
          `Using location bias (${nextCoords.lat.toFixed(2)}, ${nextCoords.lng.toFixed(2)})`
        );
      },
      () => {
        setUseUserCoords(false);
        setGeoStatus('Location permission declined — searching by destination name.');
      },
      { timeout: 8000 }
    );
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      const transcript = await stopAndTranscribe();
      if (transcript) {
        setGroundingQuery(transcript);
        void runMapsGrounding(transcript);
      }
    } else {
      await startRecording();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runMapsGrounding(groundingQuery);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10 space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-bold tracking-wide text-lake-deep mb-2">
          All Eight North East States
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-ink">
          8-State Atlas & Trail Corridors
        </h1>
        <p className="text-sm md:text-base text-slate-muted mt-2 leading-relaxed">
          Tap any destination across Assam, Meghalaya, Arunachal Pradesh, Nagaland, Sikkim,
          Manipur, Mizoram, or Tripura to inspect trail elevations, weather, live Google Maps
          insights, and homestay tariffs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Topographic Map / Interactive Google Map Canvas */}
        <div className="lg:col-span-7 bg-cream rounded-2xl border border-oak pinterest-shadow p-4 sm:p-6 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-lake-deep">
              <Compass className="w-4 h-4 text-lake" />
              <span>
                {GOOGLE_MAPS_API_KEY
                  ? 'Interactive Google Maps Atlas'
                  : 'North East India Sanctuary Atlas'}
              </span>
            </div>
            <span className="text-xs text-slate-subtle tabular-nums">
              42m – 3,753m Elevation Range
            </span>
          </div>

          {mapError && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-semibold text-amber-900">
              {mapError}
            </div>
          )}

          <div className="relative w-full aspect-[4/3] min-h-[320px] rounded-xl overflow-hidden bg-lake-mist border border-oak">
            {GOOGLE_MAPS_API_KEY ? (
              <APIProvider
                apiKey={GOOGLE_MAPS_API_KEY}
                libraries={['marker', 'places']}
                language="en"
                region="IN"
              >
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: 26.2006, lng: 92.9376 }}
                  defaultZoom={6}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={ATTRIBUTION_IDS}
                  style={{ width: '100%', height: '100%' }}
                >
                  <GoogleMapsLiveLayer
                    activeSanctuary={active}
                    onStatusError={setMapError}
                  />
                </GoogleMap>
              </APIProvider>
            ) : (
              <svg
                viewBox="0 0 600 440"
                className="w-full h-full"
                role="img"
                aria-label="Interactive 8-state map of North East India sanctuaries"
              >
                {/* Soft Contour Curves */}
                <g fill="none" stroke="#C5DFEC" strokeWidth="1.2">
                  <path d="M40 160 Q180 60 360 95 T575 150" />
                  <path d="M30 220 Q200 120 390 155 T580 220" />
                  <path d="M50 290 Q240 210 420 245 T570 310" />
                  <path d="M90 365 Q280 305 460 345 T560 395" />
                </g>

                {/* North East India 8-State Silhouette */}
                <path
                  d="M115 110 L170 110 L195 160 L290 140 L370 75 L485 95 L535 165 L495 255 L465 340 L405 405 L365 370 L330 390 L295 365 L265 320 L230 270 L180 250 L130 215 Z"
                  fill="#FFF8F0"
                  stroke="#D9C5A5"
                  strokeWidth="2.5"
                />

                {/* Brahmaputra River */}
                <path
                  d="M495 125 Q420 185 335 205 T175 235"
                  fill="none"
                  stroke="#7BB8D4"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <text x="275" y="192" fontSize="10.5" fill="#2D6A8E" fontWeight="700">
                  Brahmaputra River
                </text>

                {/* State Reference Labels */}
                <text x="115" y="96" fontSize="10" fill="#4E6173" fontWeight="700">
                  SIKKIM
                </text>
                <text x="348" y="98" fontSize="10" fill="#4E6173" fontWeight="700">
                  ARUNACHAL
                </text>
                <text x="330" y="230" fontSize="10" fill="#4E6173" fontWeight="700">
                  ASSAM
                </text>
                <text x="200" y="276" fontSize="10" fill="#4E6173" fontWeight="700">
                  MEGHALAYA
                </text>
                <text x="480" y="255" fontSize="10" fill="#4E6173" fontWeight="700">
                  NAGALAND
                </text>
                <text x="448" y="325" fontSize="10" fill="#4E6173" fontWeight="700">
                  MANIPUR
                </text>
                <text x="392" y="395" fontSize="10" fill="#4E6173" fontWeight="700">
                  MIZORAM
                </text>
                <text x="242" y="362" fontSize="10" fill="#4E6173" fontWeight="700">
                  TRIPURA
                </text>

                {/* Interactive Sanctuary Pins for all 8 States */}
                {stateRepresentatives.map((item) => {
                  const isSelected = item.state === active.state;
                  return (
                    <g
                      key={item.id}
                      transform={`translate(${item.mapCoords.x}, ${item.mapCoords.y})`}
                      onClick={() => setSelectedId(item.id)}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`Select ${item.state}: ${item.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(item.id);
                        }
                      }}
                    >
                      {isSelected && <circle r="20" fill="#FF8E8B" opacity="0.32" />}
                      <circle
                        r={isSelected ? 10 : 7}
                        fill={isSelected ? '#FF8E8B' : '#4A8FB7'}
                        stroke="#2C3E50"
                        strokeWidth="2"
                      />
                      <g transform="translate(13, 4)">
                        <rect
                          x="-4"
                          y="-13"
                          width={item.state.split(' ')[0].length * 7 + 16}
                          height="20"
                          rx="10"
                          fill={isSelected ? '#FF8E8B' : '#FFF8F0'}
                          stroke="#E8D5B5"
                          strokeWidth="1"
                        />
                        <text x="4" y="1" fontSize="10.5" fontWeight="700" fill="#2C3E50">
                          {item.state.split(' ')[0]}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* All 8 State Selector Chips + Sub-stays within active state */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {stateRepresentatives.map((item) => {
                const isSelected = item.state === active.state;
                return (
                  <button
                    key={item.state}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-coral border-coral text-slate-ink'
                        : 'bg-sand border-oak text-slate-muted hover:border-lake'
                    }`}
                  >
                    {item.state}
                  </button>
                );
              })}
            </div>

            {activeStateStays.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-oak/70">
                <span className="text-[11px] font-bold text-slate-subtle">
                  Stays in {active.state}:
                </span>
                {activeStateStays.map((stay) => {
                  const isActiveStay = stay.id === active.id;
                  return (
                    <button
                      key={stay.id}
                      type="button"
                      onClick={() => setSelectedId(stay.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                        isActiveStay
                          ? 'bg-lake text-white border-lake'
                          : 'bg-white border-oak text-slate-muted hover:border-lake-light'
                      }`}
                    >
                      {stay.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Synchronized Sanctuary & Elevation Panel */}
        <div className="lg:col-span-5 bg-cream rounded-2xl border border-oak pinterest-shadow overflow-hidden flex flex-col justify-between">
          <div>
            <div className="relative aspect-[16/10] w-full bg-sand">
              <SanctuaryArtwork
                theme={active.artworkTheme}
                variant="photo"
                photoUrl={active.photoUrl}
                photoAlt={active.photoAlt}
                className="w-full h-full"
              />
              <div className="absolute top-3 left-3 glass-warm px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-lake-deep">
                  {active.trailDifficulty} Trail
                </span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-lake-deep flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-lake" />
                  <span>
                    {active.location}, {active.state}
                  </span>
                </p>
                <h2 className="text-xl font-bold text-slate-ink mt-1">{active.title}</h2>
                <p className="text-sm text-slate-muted mt-1.5 leading-relaxed">
                  {active.subtitle}
                </p>
              </div>

              {/* Trail Elevation Curve */}
              <div className="bg-sand rounded-xl p-4 border border-oak space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-ink flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-lake" />
                    <span>Trail Elevation Profile</span>
                  </span>
                  <span className="text-slate-subtle tabular-nums">
                    {active.trailDistanceKm} km · Peak {maxElev.toLocaleString('en-IN')}m
                  </span>
                </div>

                <svg viewBox="0 0 320 86" className="w-full h-20" aria-hidden="true">
                  <polyline
                    fill="none"
                    stroke="#4A8FB7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={profilePoints}
                  />
                  {active.elevationProfile.map((val, idx) => {
                    const x = 16 + (idx / (active.elevationProfile.length - 1)) * 288;
                    const y = 74 - ((val - minElev) / elevSpan) * 52;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#FF8E8B"
                        stroke="#2C3E50"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Weather & Tariff Row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-sand rounded-xl p-3 border border-oak">
                  <p className="text-xs text-slate-subtle flex items-center gap-1">
                    <CloudSun className="w-3.5 h-3.5 text-lake" />
                    <span>Weather</span>
                  </p>
                  <p className="font-bold text-slate-ink mt-0.5 tabular-nums">
                    {active.weather.tempC}°C · {active.weather.trailStatus}
                  </p>
                </div>
                <div className="bg-sand rounded-xl p-3 border border-oak">
                  <p className="text-xs text-slate-subtle">Sanctuary Tariff</p>
                  <p className="font-bold text-slate-ink mt-0.5 tabular-nums">
                    {formatInr(active.pricePerNightInr)}{' '}
                    <span className="text-xs font-normal text-slate-subtle">/ night</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={() => onSelectSanctuary(active)}
              className="w-full py-3.5 px-5 rounded-full gradient-coral-peach hover:opacity-95 text-slate-ink text-sm font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Inspect Sanctuary & Book</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Google Maps Grounding Explorer */}
      <section
        aria-label="Google Maps Grounding Explorer"
        className="bg-cream rounded-2xl border border-oak pinterest-shadow p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-lake-deep flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-coral" />
              <span>Real-Time Location Intelligence</span>
            </p>
            <h2 className="text-2xl font-bold text-slate-ink mt-1">
              Ask Google Maps About {active.state}
            </h2>
            <p className="text-sm text-slate-muted mt-1">
              Query verified routes, sightseeing spots, permits, and eateries near{' '}
              <span className="font-semibold text-slate-ink">{active.location}</span> with live
              Google Maps Grounding.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleGeolocation}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer self-start md:self-auto ${
              useUserCoords
                ? 'bg-lake text-white border-lake'
                : 'bg-white border-oak text-lake-deep hover:border-lake'
            }`}
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>{useUserCoords ? 'Location Bias Active' : 'Bias Near My Location'}</span>
          </button>
        </div>

        {geoStatus && (
          <p className="text-xs font-medium text-lake-deep bg-lake-mist/60 px-3.5 py-2 rounded-xl border border-lake-light/50">
            {geoStatus}
          </p>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 flex items-center gap-2.5 bg-white rounded-xl border border-oak px-3.5 py-2.5 focus-within:border-coral transition-colors">
              <Sparkles className="w-4 h-4 text-coral shrink-0" />
              <input
                type="text"
                aria-label="Ask Google Maps about routes or places"
                value={groundingQuery}
                onChange={(e) => setGroundingQuery(e.target.value)}
                placeholder={`Ask e.g. "Best scenic viewpoints and cafes near ${active.location}, ${active.state}"`}
                className="w-full bg-transparent text-sm font-medium text-slate-ink placeholder:text-slate-subtle focus:outline-none"
              />
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={isTranscribing}
                aria-label={isRecording ? 'Stop recording voice question' : 'Speak place question'}
                title={isRecording ? 'Tap to transcribe spoken question' : 'Speak question'}
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
              disabled={isGroundingLoading || !groundingQuery.trim()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-coral-peach hover:opacity-95 disabled:opacity-50 text-slate-ink text-sm font-bold whitespace-nowrap cursor-pointer shadow-xs"
            >
              {isGroundingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching Maps...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Ask Google Maps</span>
                </>
              )}
            </button>
          </div>

          {micError && (
            <p className="text-xs font-semibold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
              {micError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-lake-deep">Quick Explorations:</span>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isGroundingLoading}
                onClick={() => void runMapsGrounding(prompt)}
                className="px-3 py-1.5 rounded-full bg-white border border-oak hover:border-coral text-slate-muted hover:text-slate-ink transition-colors cursor-pointer text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>

        {groundingError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {groundingError}
          </div>
        )}

        {groundingResult && (
          <div className="space-y-5 pt-2 border-t border-oak">
            <div className="bg-white rounded-2xl border border-oak p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-lake-deep">
                  Travel Guidance & Route Summary
                </span>
                <span className="text-[11px] font-semibold text-slate-subtle">
                  Grounded with Google Maps
                </span>
              </div>
              <div className="text-sm text-slate-ink leading-relaxed whitespace-pre-line">
                {groundingResult.text}
              </div>
            </div>

            {groundingResult.places.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-ink">
                    Verified Google Maps Places ({groundingResult.places.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-subtle">
                    Source: Google Maps
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groundingResult.places.map((place) => (
                    <a
                      key={place.uri}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-sand hover:bg-white rounded-xl border border-oak hover:border-coral p-4 flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-slate-ink group-hover:text-lake-deep leading-snug">
                            {place.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-lake shrink-0 mt-0.5" />
                        </div>
                        {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                          <p className="text-xs text-slate-muted italic line-clamp-3">
                            “{place.reviewSnippets[0]}”
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-lake-deep inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-coral" />
                        <span>Open in Google Maps</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
