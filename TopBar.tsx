import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Menu, Shield, User, X } from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
} from '../data/translations';
import { isAdminEmail, UserProfile } from '../services/dataStore';

export type AppScreen =
  | 'discover'
  | 'detail'
  | 'payment'
  | 'map'
  | 'hosts'
  | 'saved'
  | 'itinerary'
  | 'profile'
  | 'admin';

interface TopBarProps {
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  savedCount: number;
  tripsCount: number;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeScreen,
  onNavigate,
  currentUser,
  onOpenAuth,
  savedCount,
  tripsCount,
  language,
  onLanguageChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langContainerRef = useRef<HTMLDivElement | null>(null);
  const isAdmin = isAdminEmail(currentUser?.email);

  const activeLanguage =
    LANGUAGE_OPTIONS.find((item) => item.code === language) ?? LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langMenuOpen &&
        langContainerRef.current &&
        !langContainerRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langMenuOpen]);

  const navItems: { id: AppScreen; label: string }[] = [
    { id: 'discover', label: 'Explore' },
    { id: 'map', label: '8-State Atlas' },
    { id: 'hosts', label: 'Hosts' },
    { id: 'saved', label: savedCount > 0 ? `Saved (${savedCount})` : 'Saved' },
    { id: 'itinerary', label: tripsCount > 0 ? `Itinerary (${tripsCount})` : 'Itinerary' },
  ];

  const handleNav = (id: AppScreen) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  const userInitials = currentUser
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-40 glass-warm border-b border-oak">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4 md:gap-6">
        {/* Zone 1: Single text wordmark */}
        <button
          type="button"
          onClick={() => handleNav('discover')}
          className="text-lg font-bold tracking-tight text-slate-ink whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lake rounded-sm cursor-pointer"
        >
          Highland Sanctuary
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive =
              activeScreen === item.id || (item.id === 'discover' && activeScreen === 'detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lake rounded-sm ${
                  isActive
                    ? 'text-lake-deep font-semibold'
                    : 'text-slate-muted hover:text-slate-ink'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-coral rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Admin button (if admin) + Profile / Login + Language Selector */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeScreen === 'admin'
                  ? 'bg-lake border-lake text-white'
                  : 'bg-lake-mist border-lake-light text-lake-deep hover:bg-lake hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}

          {currentUser ? (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              aria-label={`Open profile for ${currentUser.name}`}
              className={`inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeScreen === 'profile'
                  ? 'bg-coral border-coral text-slate-ink'
                  : 'bg-cream border-oak hover:border-coral text-slate-ink'
              }`}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-7 h-7 rounded-full gradient-coral-peach text-slate-ink text-xs font-bold flex items-center justify-center shrink-0">
                  {userInitials || 'HS'}
                </span>
              )}
              <span className="text-xs sm:text-sm font-bold max-w-[110px] truncate">
                {currentUser.name}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              aria-label="Sign in or create profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral hover:bg-coral-soft text-slate-ink text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lake"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Login</span>
            </button>
          )}

          {/* Language Selector Pill (Globe + Active Code) */}
          <div ref={langContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
              aria-label={`Select language (${activeLanguage.englishName})`}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                langMenuOpen || language !== 'en'
                  ? 'bg-[#FF8E8B] border-[#FF8E8B] text-white shadow-xs'
                  : 'bg-white border-oak text-slate-ink hover:border-[#FF8E8B]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{activeLanguage.shortCode}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  langMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langMenuOpen && (
              <div
                role="listbox"
                aria-label="Choose North East language"
                className="absolute right-0 top-full mt-3 w-72 sm:w-80 bg-white border border-oak/80 rounded-3xl shadow-2xl p-3 z-50"
              >
                <div
                  aria-hidden="true"
                  className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-oak/80 rotate-45"
                />

                <div className="px-2.5 pt-1 pb-2 mb-1.5 border-b border-oak/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-ink flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#FF8E8B]" />
                    <span>Languages & NE Scripts (12)</span>
                  </span>
                  <span className="text-[11px] font-semibold text-lake-deep">
                    {activeLanguage.shortCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-1 max-h-[380px] overflow-y-auto no-scrollbar">
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const selected = opt.code === language;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onLanguageChange(opt.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#FF8E8B]/14 border-[#FF8E8B] text-slate-ink'
                            : 'bg-transparent border-transparent hover:bg-sand/80 hover:border-oak/70 text-slate-ink'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-ink truncate">
                              {opt.nativeName}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-muted shrink-0">
                              {opt.englishName}
                            </span>
                          </div>
                          {opt.transliteration && (
                            <p className="text-[10px] text-slate-subtle truncate">
                              {opt.transliteration}
                            </p>
                          )}
                        </div>
                        {selected && (
                          <span className="w-5 h-5 rounded-full bg-[#FF8E8B] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full text-slate-ink hover:bg-cream-soft transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-cream border-t border-oak px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              activeScreen === item.id || (item.id === 'discover' && activeScreen === 'detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  isActive ? 'bg-coral text-slate-ink' : 'text-slate-ink hover:bg-sand'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeScreen === 'admin' ? 'bg-lake text-white' : 'text-lake-deep hover:bg-sand'
              }`}
            >
              Admin Dashboard
            </button>
          )}
          {currentUser && (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeScreen === 'profile'
                  ? 'bg-coral text-slate-ink'
                  : 'text-slate-ink hover:bg-sand'
              }`}
            >
              My Profile ({currentUser.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
