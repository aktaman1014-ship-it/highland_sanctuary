import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, MicOff, PhoneOff, Sparkles, Volume2, X } from 'lucide-react';

interface VoiceConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptLine {
  id: string;
  speaker: 'you' | 'concierge';
  text: string;
}

function floatTo16BitPcmBase64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm24kToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}

export const VoiceConciergeModal: React.FC<VoiceConciergeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [lines, setLines] = useState<TranscriptLine[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const stopPlaybackQueue = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {
        // ignore stopped source
      }
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsAiSpeaking(false);
  }, []);

  const cleanupSession = useCallback(() => {
    stopPlaybackQueue();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (inputCtxRef.current) {
      void inputCtxRef.current.close().catch(() => undefined);
      inputCtxRef.current = null;
    }

    if (outputCtxRef.current) {
      void outputCtxRef.current.close().catch(() => undefined);
      outputCtxRef.current = null;
    }

    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, [stopPlaybackQueue]);

  useEffect(() => {
    if (!isOpen) {
      cleanupSession();
      setStatus('idle');
      setErrorMsg(null);
    }
    return () => {
      cleanupSession();
    };
  }, [isOpen, cleanupSession]);

  const playAudioChunk = useCallback((base64Audio: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;

    const samples = base64Pcm24kToFloat32(base64Audio);
    if (samples.length === 0) return;

    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(new Float32Array(samples), 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    setIsAiSpeaking(true);

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsAiSpeaking(false);
      }
    };
  }, []);

  const appendTranscript = useCallback((speaker: 'you' | 'concierge', chunk: string) => {
    const clean = chunk.trim();
    if (!clean) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker) {
        return [
          ...prev.slice(0, -1),
          { ...last, text: `${last.text} ${clean}`.replace(/\s+/g, ' ').trim() },
        ];
      }
      return [...prev, { id: `${Date.now()}-${Math.random()}`, speaker, text: clean }];
    });
  }, []);

  const startVoiceSession = async () => {
    cleanupSession();
    setStatus('connecting');
    setErrorMsg(null);
    setLines([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputCtxRef.current = inputCtx;
      outputCtxRef.current = outputCtx;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (isMutedRef.current) return;
          if (ws.readyState !== WebSocket.OPEN) return;
          const channelData = event.inputBuffer.getChannelData(0);
          const base64 = floatTo16BitPcmBase64(channelData);
          ws.send(JSON.stringify({ audio: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            ready?: boolean;
            audio?: string;
            interrupted?: boolean;
            inputTranscript?: string;
            outputTranscript?: string;
            error?: string;
          };

          if (msg.ready) {
            setStatus('live');
          }
          if (msg.error) {
            setErrorMsg(msg.error);
            setStatus('error');
          }
          if (msg.interrupted) {
            stopPlaybackQueue();
          }
          if (msg.audio) {
            setStatus('live');
            playAudioChunk(msg.audio);
          }
          if (msg.inputTranscript) {
            appendTranscript('you', msg.inputTranscript);
          }
          if (msg.outputTranscript) {
            appendTranscript('concierge', msg.outputTranscript);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        setErrorMsg('Voice connection encountered an error. Please try again.');
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
      };
    } catch (err) {
      cleanupSession();
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to access your microphone for live voice conversation.'
      );
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-ink/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-concierge-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-cream border border-oak pinterest-shadow overflow-hidden flex flex-col max-h-[85vh]">
        <header className="px-6 py-4 bg-white border-b border-oak flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF8E8B] text-slate-ink flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="voice-concierge-title" className="text-base font-bold text-slate-ink">
                Highland Live Voice Concierge
              </h2>
              <p className="text-xs text-lake-deep font-medium">
                Real-time spoken travel guidance across all 8 North East states
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              cleanupSession();
              onClose();
            }}
            aria-label="Close voice concierge"
            className="w-9 h-9 rounded-full bg-sand border border-oak hover:border-coral flex items-center justify-center text-slate-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Voice Orb Visual */}
          <div className="rounded-2xl bg-white border border-oak p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              {status === 'live' && (
                <span
                  aria-hidden="true"
                  className={`absolute -inset-2 rounded-full ${
                    isAiSpeaking ? 'bg-lake/30 animate-ping' : 'bg-[#FF8E8B]/35 animate-pulse'
                  }`}
                />
              )}
              <div
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                  status === 'live'
                    ? isAiSpeaking
                      ? 'bg-lake text-white'
                      : 'bg-[#FF8E8B] text-slate-ink'
                    : 'bg-sand border border-oak text-lake-deep'
                }`}
              >
                {status === 'connecting' ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isAiSpeaking ? (
                  <Volume2 className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-ink">
                {status === 'idle' && 'Tap Start Voice Conversation'}
                {status === 'connecting' && 'Connecting live audio concierge...'}
                {status === 'live' &&
                  (isAiSpeaking
                    ? 'Highland Concierge is speaking...'
                    : isMuted
                    ? 'Microphone muted'
                    : 'Listening — ask about Kaziranga, Dawki, Tawang, or permits')}
                {status === 'error' && 'Voice session stopped'}
              </p>
              <p className="text-xs text-slate-muted mt-1">
                Try saying: “Find a cozy bamboo stay near Kaziranga under ₹4,000”
              </p>
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="w-full text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
              >
                {errorMsg}
              </p>
            )}
          </div>

          {/* Live Transcript */}
          <div className="rounded-2xl bg-sand/70 border border-oak p-4 space-y-2.5 min-h-[150px] max-h-[230px] overflow-y-auto">
            <p className="text-[11px] font-bold text-slate-subtle uppercase tracking-wider">
              Live Conversation Transcript
            </p>
            {lines.length === 0 ? (
              <p className="text-xs text-slate-muted italic">
                Spoken questions and answers appear here in real time once connected.
              </p>
            ) : (
              lines.map((line) => (
                <div
                  key={line.id}
                  className={`flex ${line.speaker === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      line.speaker === 'you'
                        ? 'bg-[#FF8E8B] text-slate-ink font-semibold'
                        : 'bg-white border border-oak text-slate-ink'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase opacity-75 mb-0.5">
                      {line.speaker === 'you' ? 'You' : 'Concierge'}
                    </span>
                    {line.text}
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <footer className="px-6 py-4 bg-white border-t border-oak flex items-center justify-center gap-3">
          {status === 'live' ? (
            <>
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-sand border-oak text-slate-ink hover:border-lake'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  cleanupSession();
                  setStatus('idle');
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startVoiceSession}
              disabled={status === 'connecting'}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full gradient-coral-peach hover:opacity-95 disabled:opacity-60 text-slate-ink text-sm font-bold transition-all cursor-pointer shadow-sm"
            >
              <Mic className="w-4 h-4" />
              <span>
                {status === 'connecting' ? 'Starting Voice...' : 'Start Voice Conversation'}
              </span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
