import React, { useState } from 'react';
import { Mountain } from 'lucide-react';
import { ArtworkTheme, SceneVariant } from '../data/sanctuaries';

interface SanctuaryArtworkProps {
  theme: ArtworkTheme;
  variant: SceneVariant;
  photoUrl?: string;
  photoAlt?: string;
  className?: string;
}

const PALETTES: Record<
  ArtworkTheme,
  {
    skyTop: string;
    skyBottom: string;
    sun: string;
    farRidge: string;
    midRidge: string;
    nearRidge: string;
    water: string;
    accent: string;
    timber: string;
    warmLight: string;
  }
> = {
  assam: {
    skyTop: '#BDE3EE',
    skyBottom: '#FFF8F0',
    sun: '#FFD59E',
    farRidge: '#7BB8D4',
    midRidge: '#4D9B7E',
    nearRidge: '#2A7B5C',
    water: '#4A8FB7',
    accent: '#FF8E8B',
    timber: '#B98C5E',
    warmLight: '#FDE68A',
  },
  meghalaya: {
    skyTop: '#B5E5EC',
    skyBottom: '#FDF6EE',
    sun: '#FFE4A8',
    farRidge: '#68B6B4',
    midRidge: '#2C9386',
    nearRidge: '#1A746B',
    water: '#36A8A0',
    accent: '#FF8E8B',
    timber: '#A87D52',
    warmLight: '#FCD34D',
  },
  arunachal: {
    skyTop: '#B8DCF2',
    skyBottom: '#FFF8F0',
    sun: '#FFF0B8',
    farRidge: '#9EC5DE',
    midRidge: '#4A8FB7',
    nearRidge: '#2C5C7A',
    water: '#7BB8D4',
    accent: '#FF8E8B',
    timber: '#9E6E46',
    warmLight: '#FBBF24',
  },
  nagaland: {
    skyTop: '#C5E6F5',
    skyBottom: '#FDF6EE',
    sun: '#FFE0A3',
    farRidge: '#89C0C9',
    midRidge: '#4B9D74',
    nearRidge: '#2C7552',
    water: '#4A8FB7',
    accent: '#FF8E8B',
    timber: '#A67B51',
    warmLight: '#FDE047',
  },
  sikkim: {
    skyTop: '#AEE0F7',
    skyBottom: '#FFF8F0',
    sun: '#FFF2B2',
    farRidge: '#B6D4E6',
    midRidge: '#4A8FB7',
    nearRidge: '#2D6A8E',
    water: '#4A8FB7',
    accent: '#FF8E8B',
    timber: '#A3774F',
    warmLight: '#FDE68A',
  },
  manipur: {
    skyTop: '#FCE3CC',
    skyBottom: '#FFF8F0',
    sun: '#FF8E8B',
    farRidge: '#92BED4',
    midRidge: '#4A8FB7',
    nearRidge: '#3D9975',
    water: '#5BA9CA',
    accent: '#FF8E8B',
    timber: '#B5895C',
    warmLight: '#FDBA74',
  },
  mizoram: {
    skyTop: '#B8E2F4',
    skyBottom: '#FDF6EE',
    sun: '#FFE2A8',
    farRidge: '#7BB8D4',
    midRidge: '#3C8B74',
    nearRidge: '#246B58',
    water: '#4A8FB7',
    accent: '#FF8E8B',
    timber: '#9D734B',
    warmLight: '#FDE047',
  },
  tripura: {
    skyTop: '#C5E5F5',
    skyBottom: '#FFF8F0',
    sun: '#FFDAA3',
    farRidge: '#98C4D9',
    midRidge: '#5CA596',
    nearRidge: '#34836B',
    water: '#4A8FB7',
    accent: '#FF8E8B',
    timber: '#B38559',
    warmLight: '#FCD34D',
  },
};

export const SanctuaryArtwork: React.FC<SanctuaryArtworkProps> = ({
  theme,
  variant,
  photoUrl,
  photoAlt,
  className = 'w-full h-full',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (variant === 'photo' && photoUrl && !imgFailed) {
    return (
      <img
        src={photoUrl}
        alt={photoAlt ?? `${theme} landscape`}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  const p = PALETTES[theme];
  const uid = `${theme}-${variant}`;

  if (variant === 'interior') {
    return (
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className={className}
        role="img"
        aria-label={`${theme} sunlit oak sanctuary interior`}
      >
        <defs>
          <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8F0" />
            <stop offset="100%" stopColor="#F5E7D3" />
          </linearGradient>
          <linearGradient id={`win-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
        </defs>

        {/* Cream Lime Wall */}
        <rect width="800" height="600" fill={`url(#wall-${uid})`} />

        {/* Panoramic Picture Window */}
        <rect x="120" y="68" width="560" height="295" rx="14" fill={`url(#win-${uid})`} />
        <path
          d="M120 265 Q280 200 440 245 T680 215 L680 363 L120 363 Z"
          fill={p.farRidge}
          opacity="0.75"
        />
        <path
          d="M120 310 Q320 255 500 295 T680 275 L680 363 L120 363 Z"
          fill={p.midRidge}
          opacity="0.88"
        />
        <circle cx="585" cy="140" r="32" fill={p.sun} />

        {/* Light Oak Frame */}
        <rect x="120" y="68" width="560" height="295" rx="14" fill="none" stroke="#D9C5A5" strokeWidth="14" />
        <line x1="305" y1="68" x2="305" y2="363" stroke="#D9C5A5" strokeWidth="7" />
        <line x1="495" y1="68" x2="495" y2="363" stroke="#D9C5A5" strokeWidth="7" />

        {/* Warm Oak Floor */}
        <rect x="0" y="425" width="800" height="175" fill="#DFC9A8" />
        <line x1="0" y1="470" x2="800" y2="470" stroke="#C8AF8B" strokeWidth="2" />
        <line x1="0" y1="520" x2="800" y2="520" stroke="#C8AF8B" strokeWidth="2" />

        {/* Coral & Lake Blue Handwoven Rug */}
        <polygon points="150,468 650,468 715,585 85,585" fill="#FFF8F0" />
        <polygon points="180,482 620,482 675,570 125,570" fill="#7BB8D4" opacity="0.35" />
        <path d="M190 510 L610 510 M160 546 L640 546" stroke="#FF8E8B" strokeWidth="7" strokeDasharray="20 12" />

        {/* Oak Daybed & Coral Cushions */}
        <rect x="165" y="362" width="380" height="72" rx="12" fill="#C9A87E" />
        <rect x="178" y="338" width="354" height="36" rx="8" fill="#FFF8F0" />
        <rect x="195" y="314" width="76" height="34" rx="10" fill="#FF8E8B" />
        <rect x="282" y="318" width="68" height="30" rx="10" fill="#4A8FB7" />

        {/* Cane Pendant */}
        <line x1="635" y1="0" x2="635" y2="175" stroke="#A68259" strokeWidth="3" />
        <path d="M598 212 Q635 156 672 212 Q635 230 598 212 Z" fill="#E8D5B5" stroke="#B98C5E" strokeWidth="3" />
      </svg>
    );
  }

  // Fallback or Trail artwork
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        role="img"
        aria-label={photoAlt ?? `${theme} highland trail`}
      >
        <defs>
          <linearGradient id={`tsky-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill={`url(#tsky-${uid})`} />
        <circle cx="240" cy="140" r="48" fill={p.sun} />
        <path d="M0 300 Q175 190 380 250 T800 220 L800 600 L0 600 Z" fill={p.farRidge} />
        <path d="M0 365 Q230 275 460 335 T800 300 L800 600 L0 600 Z" fill={p.midRidge} />
        <path d="M0 440 Q260 390 480 435 T800 410 L800 600 L0 600 Z" fill={p.water} opacity="0.9" />
        <path d="M120 485 Q320 465 540 495" fill="none" stroke="#FFF8F0" strokeWidth="3" opacity="0.55" />
        <path d="M0 495 Q110 425 220 555 L0 600 Z" fill={p.nearRidge} />
        <path d="M800 475 Q670 400 570 565 L800 600 Z" fill={p.nearRidge} />
        <circle cx="155" cy="495" r="10" fill={p.accent} />
        <circle cx="645" cy="495" r="10" fill={p.accent} />
      </svg>
      {imgFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-sand/60 text-slate-ink p-4 text-center">
          <Mountain className="w-7 h-7 text-lake mb-1.5" />
          <span className="text-xs font-semibold">{photoAlt ?? theme}</span>
        </div>
      )}
    </div>
  );
};
