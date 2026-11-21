import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCheck,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { addDaysIso, formatInr, Sanctuary } from '../data/sanctuaries';
import { UserProfile } from '../services/dataStore';

export interface HostInquiryMessage {
  id: string;
  sender: 'traveler' | 'host-desk';
  senderName: string;
  contact?: string;
  text: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  sentAtIso: string;
}

interface HostConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanctuary: Sanctuary;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  selectedAddonIds: string[];
  onCheckInChange: (nextCheckIn: string) => void;
  onCheckOutChange: (nextCheckOut: string) => void;
  currentUser?: UserProfile | null;
  onProceedToReserve: () => void;
  onMessagesChange?: (count: number) => void;
}

function getStorageKey(uid: string, sanctuaryId: string): string {
  return `hs_host_connect_v1_${uid}_${sanctuaryId}`;
}

export function getHostConnectMessageCount(uid: string, sanctuaryId: string): number {
  try {
    const raw = localStorage.getItem(getStorageKey(uid, sanctuaryId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as HostInquiryMessage[];
    return Array.isArray(parsed)
      ? parsed.filter((m) => m.sender === 'traveler').length
      : 0;
  } catch {
    return 0;
  }
}

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatMessageTime(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return 'Just now';
  return dt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HostConnectModal: React.FC<HostConnectModalProps> = ({
  isOpen,
  onClose,
  sanctuary,
  checkIn,
  checkOut,
  nights,
  adults,
  children,
  selectedAddonIds,
  onCheckInChange,
  onCheckOutChange,
  currentUser,
  onProceedToReserve,
  onMessagesChange,
}) => {
  const uid = currentUser?.uid ?? 'guest';
  const guests = adults + children;
  const storageKey = getStorageKey(uid, sanctuary.id);

  const [messages, setMessages] = useState<HostInquiryMessage[]>([]);
  const [draftText, setDraftText] = useState('');
  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [contactInfo, setContactInfo] = useState(
    currentUser?.email || currentUser?.phone || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editingDates, setEditingDates] = useState(false);

  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (currentUser?.name && !senderName) {
      setSenderName(currentUser.name);
    }
    if ((currentUser?.email || currentUser?.phone) && !contactInfo) {
      setContactInfo(currentUser.email || currentUser.phone);
    }
  }, [currentUser, senderName, contactInfo]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as HostInquiryMessage[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
      setMessages([]);
    } catch {
      setMessages([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isOpen, messages.length]);

  const selectedAddonsSummary = useMemo(() => {
    if (selectedAddonIds.length === 0) return null;
    const titles = sanctuary.addons
      .filter((a) => selectedAddonIds.includes(a.id))
      .map((a) => a.title);
    return titles.length > 0 ? titles.join(', ') : null;
  }, [sanctuary.addons, selectedAddonIds]);

  const quickPrompts = useMemo(() => {
    const firstAddon = sanctuary.addons[0]?.title;
    return [
      `Hi ${sanctuary.host.name.split(' ')[0]}, are ${formatShortDate(checkIn)} to ${formatShortDate(checkOut)} (${nights} ${nights === 1 ? 'night' : 'nights'}) available for ${guests} ${guests === 1 ? 'guest' : 'guests'}?`,
      `Could we arrange an early check-in and local pickup for our ${formatShortDate(checkIn)} arrival?`,
      `What regional home-cooked meals are available during our stay?`,
      firstAddon
        ? `We'd love more details about "${firstAddon}" and any permit requirements.`
        : `Any trail or seasonal weather advice for ${formatShortDate(checkIn)}?`,
    ];
  }, [sanctuary, checkIn, checkOut, nights, guests]);

  if (!isOpen) return null;

  const persistMessages = (next: HostInquiryMessage[]) => {
    setMessages(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    const travelerCount = next.filter((m) => m.sender === 'traveler').length;
    onMessagesChange?.(travelerCount);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanText = draftText.trim().slice(0, 800);
    const cleanName = (senderName || currentUser?.name || '').trim().slice(0, 80);
    const cleanContact = (contactInfo || currentUser?.email || '').trim().slice(0, 120);

    if (!cleanName) {
      setValidationError('Please enter your name so the host knows who is inquiring.');
      return;
    }
    if (!cleanText) {
      setValidationError('Please write a brief message for the host.');
      return;
    }

    setValidationError(null);
    const nowIso = new Date().toISOString();

    const travelerMessage: HostInquiryMessage = {
      id: `hc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sender: 'traveler',
      senderName: cleanName,
      contact: cleanContact || undefined,
      text: cleanText,
      checkIn,
      checkOut,
      nights,
      guests,
      sentAtIso: nowIso,
    };

    const hasPriorAck = messages.some((m) => m.sender === 'host-desk');
    const nextList: HostInquiryMessage[] = [...messages, travelerMessage];

    if (!hasPriorAck) {
      const ackMessage: HostInquiryMessage = {
        id: `hc_ack_${Date.now()}`,
        sender: 'host-desk',
        senderName: `${sanctuary.host.name} · Host Desk`,
        text: `Your direct inquiry for ${formatShortDate(checkIn)} – ${formatShortDate(checkOut)} (${nights} ${nights === 1 ? 'night' : 'nights'}, ${guests} ${guests === 1 ? 'guest' : 'guests'}) has been logged for ${sanctuary.host.name} in ${sanctuary.location}. Typical host reply time is under 2 hours in ${sanctuary.host.languages.join(' / ')}.`,
        checkIn,
        checkOut,
        nights,
        guests,
        sentAtIso: nowIso,
      };
      nextList.push(ackMessage);
    }

    persistMessages(nextList);
    setDraftText('');
  };

  const handleClearThread = () => {
    persistMessages([]);
    setValidationError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-ink/45 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="host-connect-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-cream border border-oak rounded-t-3xl sm:rounded-3xl pinterest-shadow overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-4 bg-white border-b border-oak flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full gradient-coral-peach text-slate-ink flex items-center justify-center font-bold text-sm shrink-0">
              {sanctuary.host.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="host-connect-title"
                  className="text-base font-bold text-slate-ink truncate"
                >
                  Host Connect · {sanctuary.host.name}
                </h2>
                {sanctuary.host.verifiedEcoGuide && (
                  <ShieldCheck
                    className="w-4 h-4 text-lake shrink-0"
                    aria-label="Certified Eco-Guide"
                  />
                )}
              </div>
              <p className="text-xs text-slate-subtle truncate">
                {sanctuary.host.lineage} · Speaks {sanctuary.host.languages.join(', ')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Host Connect"
            className="w-9 h-9 rounded-full border border-oak bg-sand hover:border-coral flex items-center justify-center text-slate-ink transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chosen Booking Dates & Sanctuary Context Bar */}
        <div className="px-5 py-3 bg-sand/70 border-b border-oak space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-ink">
              <span className="font-bold">{sanctuary.title}</span>
              <span className="text-slate-subtle">
                {' '}
                · {formatInr(sanctuary.pricePerNightInr)}/night
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingDates((prev) => !prev)}
              className="text-xs font-bold text-lake-deep hover:text-slate-ink underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              {editingDates ? 'Done editing dates' : 'Change dates'}
            </button>
          </div>

          {editingDates ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-white rounded-xl px-3 py-2 border border-oak">
                <label
                  htmlFor="hc-checkin"
                  className="block text-[10px] font-bold text-lake-deep mb-0.5"
                >
                  Check-in
                </label>
                <input
                  id="hc-checkin"
                  type="date"
                  value={checkIn}
                  onChange={(e) => onCheckInChange(e.target.value)}
                  className="w-full text-xs font-bold text-slate-ink bg-transparent focus:outline-none tabular-nums"
                />
              </div>
              <div className="bg-white rounded-xl px-3 py-2 border border-oak">
                <label
                  htmlFor="hc-checkout"
                  className="block text-[10px] font-bold text-lake-deep mb-0.5"
                >
                  Check-out
                </label>
                <input
                  id="hc-checkout"
                  type="date"
                  value={checkOut}
                  min={addDaysIso(checkIn, 1)}
                  onChange={(e) => onCheckOutChange(e.target.value)}
                  className="w-full text-xs font-bold text-slate-ink bg-transparent focus:outline-none tabular-nums"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-muted">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-ink tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-coral" />
                {formatShortDate(checkIn)} – {formatShortDate(checkOut)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Users className="w-3.5 h-3.5 text-lake" />
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </span>
              {selectedAddonsSummary && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-lake-deep truncate max-w-[220px]">
                    Add-ons: {selectedAddonsSummary}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Message History */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[220px] max-h-[340px] bg-cream">
          {/* Host Greeting Card */}
          <div className="bg-white rounded-2xl p-4 border border-oak space-y-1.5">
            <p className="text-xs font-bold text-lake-deep">
              Direct message to {sanctuary.host.name} · {sanctuary.location}
            </p>
            <p className="text-sm text-slate-muted leading-relaxed">
              "{sanctuary.host.quote}" — Send your preferred dates or ask about local transport,
              home-cooked meals, or trail conditions before reserving.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="py-4 text-center space-y-1">
              <MessageCircle className="w-6 h-6 text-slate-subtle mx-auto" />
              <p className="text-xs font-semibold text-slate-subtle">
                No inquiries sent yet for this sanctuary. Pick a quick prompt below or write your
                own note.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isTraveler = msg.sender === 'traveler';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isTraveler ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                        isTraveler
                          ? 'bg-coral/20 border-coral/50 text-slate-ink rounded-br-sm'
                          : 'bg-white border-oak text-slate-muted rounded-bl-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-subtle mb-1">
                        <span className={isTraveler ? 'text-slate-ink' : 'text-lake-deep'}>
                          {msg.senderName}
                        </span>
                        <span className="tabular-nums">{formatMessageTime(msg.sentAtIso)}</span>
                      </div>
                      <p className="text-slate-ink whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className="mt-2 pt-1.5 border-t border-oak/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-subtle tabular-nums">
                        <span>
                          Dates: {formatShortDate(msg.checkIn)} – {formatShortDate(msg.checkOut)} ·{' '}
                          {msg.nights}n · {msg.guests}g
                        </span>
                        {isTraveler && (
                          <span className="inline-flex items-center gap-1 text-lake-deep font-semibold">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Sent</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={listEndRef} />
            </div>
          )}
        </div>

        {/* Quick Inquiry Prompts */}
        <div className="px-5 py-2.5 bg-white border-t border-oak">
          <p className="text-[11px] font-bold text-slate-subtle mb-2">
            Quick inquiry topics (attaches selected dates)
          </p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {quickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDraftText(promptText);
                  inputRef.current?.focus();
                }}
                className="px-3 py-1.5 rounded-full bg-sand hover:bg-coral-tint border border-oak hover:border-coral text-xs font-semibold text-slate-ink whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {idx === 0
                  ? 'Ask availability'
                  : idx === 1
                  ? 'Check-in & transport'
                  : idx === 2
                  ? 'Local meals'
                  : 'Guided trail info'}
              </button>
            ))}
          </div>
        </div>

        {/* Traveler Contact & Message Composer */}
        <form onSubmit={handleSend} className="p-4 sm:p-5 bg-white border-t border-oak space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your name *"
              maxLength={80}
              aria-label="Your name"
              className="w-full px-3.5 py-2 rounded-xl bg-sand border border-oak focus:border-lake focus:outline-none text-xs font-semibold text-slate-ink"
            />
            <input
              type="text"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Email or phone for host reply"
              maxLength={120}
              aria-label="Email or phone for host reply"
              className="w-full px-3.5 py-2 rounded-xl bg-sand border border-oak focus:border-lake focus:outline-none text-xs font-semibold text-slate-ink"
            />
          </div>

          {validationError && (
            <p role="alert" className="text-xs font-bold text-red-700">
              {validationError}
            </p>
          )}

          <div className="flex items-end gap-2.5">
            <textarea
              ref={inputRef}
              rows={2}
              value={draftText}
              maxLength={800}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Write to ${sanctuary.host.name} for ${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}...`}
              aria-label={`Message to ${sanctuary.host.name}`}
              className="flex-1 resize-none px-3.5 py-2.5 rounded-2xl bg-sand border border-oak focus:border-lake focus:outline-none text-sm text-slate-ink leading-snug"
            />
            <button
              type="submit"
              disabled={!draftText.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-coral hover:bg-coral-soft disabled:opacity-45 disabled:cursor-not-allowed text-slate-ink text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={handleClearThread}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-subtle hover:text-slate-ink cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear thread</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-subtle">
                Your selected dates are automatically attached.
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedToReserve();
              }}
              className="text-xs font-bold text-lake-deep hover:text-slate-ink underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              Reserve These Dates →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
