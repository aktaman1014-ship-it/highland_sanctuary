import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { WebSocket, WebSocketServer } from 'ws';
import { type LiveServerMessage, Modality } from '@google/genai';
import { getGeminiClient } from './src/lib/gemini-server.ts';
import { type AuthRequest, requireAuth } from './src/middleware/auth.ts';
import {
  cancelBookingSql,
  createBookingSql,
  getOrCreateUser,
  getUserBookingsSql,
  getUserItinerariesSql,
  getUserSavedIdsSql,
  saveAiItinerarySql,
  toggleSavedSql,
  updateUserProfileSql,
} from './src/db/queries.ts';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '25mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Authenticated Cloud SQL (PostgreSQL + Drizzle) Endpoints
// ---------------------------------------------------------------------------

app.get('/api/sql/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || '';
    const profile = await getOrCreateUser(uid, {
      name: req.user!.name || 'Highland Explorer',
      email,
      avatar: req.user!.picture || '',
    });
    const [savedIds, bookings, itineraries] = await Promise.all([
      getUserSavedIdsSql(uid),
      getUserBookingsSql(uid),
      getUserItinerariesSql(uid),
    ]);
    res.json({ profile, savedIds, bookings, itineraries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile data';
    res.status(500).json({ error: message });
  }
});

app.put('/api/sql/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || String(req.body?.email || '');
    const updated = await updateUserProfileSql(uid, {
      name: String(req.body?.name || 'Highland Explorer'),
      email,
      avatar: String(req.body?.avatar || ''),
      phone: String(req.body?.phone || ''),
      location: String(req.body?.location || 'Assam'),
      isHost: Boolean(req.body?.isHost),
      hostEarningsInr: Number(req.body?.hostEarningsInr || 0),
    });
    res.json({ profile: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(500).json({ error: message });
  }
});

app.post('/api/sql/saved', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || '';
    const sanctuaryId = String(req.body?.sanctuaryId || '').trim();
    const shouldSave = Boolean(req.body?.shouldSave);
    if (!sanctuaryId) {
      res.status(400).json({ error: 'sanctuaryId is required' });
      return;
    }
    await toggleSavedSql(uid, email, sanctuaryId, shouldSave);
    res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update saved sanctuary';
    res.status(500).json({ error: message });
  }
});

app.post('/api/sql/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || String(req.body?.guestEmail || '');
    const booking = req.body?.booking;
    if (!booking || !booking.id || !booking.sanctuaryId) {
      res.status(400).json({ error: 'Valid booking payload is required' });
      return;
    }
    const created = await createBookingSql(uid, email, booking);
    res.json({ booking: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create booking';
    res.status(500).json({ error: message });
  }
});

app.patch('/api/sql/bookings/:bookingRef/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const bookingRef = String(req.params.bookingRef || '');
    if (!bookingRef) {
      res.status(400).json({ error: 'bookingRef is required' });
      return;
    }
    const updated = await cancelBookingSql(uid, bookingRef);
    res.json({ booking: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel booking';
    res.status(500).json({ error: message });
  }
});

app.post('/api/sql/itineraries', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user!.uid;
    const email = req.user!.email || '';
    const plan = req.body?.plan;
    if (!plan || !plan.id || !plan.title) {
      res.status(400).json({ error: 'Valid itinerary plan is required' });
      return;
    }
    const saved = await saveAiItinerarySql(uid, email, plan);
    res.json({ plan: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save itinerary';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// Gemini AI Endpoints (Server-Side SDK)
// ---------------------------------------------------------------------------

// 1. Google Maps Grounding with gemini-4-hydrogen
app.post('/api/ai/maps-grounding', async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    const lat = typeof req.body?.lat === 'number' ? req.body.lat : undefined;
    const lng = typeof req.body?.lng === 'number' ? req.body.lng : undefined;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `You are the North East India travel atlas assistant for Highland Sanctuary. Answer this traveler query accurately with real places, travel logistics, and highlights: ${prompt}`,
      config: {
        tools: [{ googleMaps: {} }],
        ...(lat !== undefined && lng !== undefined
          ? {
              toolConfig: {
                retrievalConfig: {
                  latLng: { latitude: lat, longitude: lng },
                },
              },
            }
          : {}),
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const places: { title: string; uri: string; reviewSnippets?: string[] }[] = [];
    const seenUris = new Set<string>();

    for (const chunk of rawChunks) {
      const mapsData = chunk.maps;
      if (mapsData?.uri && !seenUris.has(mapsData.uri)) {
        seenUris.add(mapsData.uri);
        const snippets =
          mapsData.placeAnswerSources?.reviewSnippets
            ?.map((r) => {
              const snippetObj = r as { content?: string; title?: string; googleMapsUri?: string };
              return snippetObj.content || snippetObj.title || '';
            })
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0) ?? [];
        places.push({
          title: mapsData.title || 'Google Maps Place',
          uri: mapsData.uri,
          ...(snippets.length > 0 ? { reviewSnippets: snippets } : {}),
        });
      }
    }

    res.json({
      text: response.text ?? '',
      places,
    });
  } catch (error) {
    console.error('Maps grounding error:', error);
    const message = error instanceof Error ? error.message : 'Unable to query Maps grounding.';
    res.status(500).json({ error: message });
  }
});

// 2. Audio Transcription with gemini-3.5-transcribe
app.post('/api/ai/transcribe', async (req, res) => {
  try {
    const audioBase64 = String(req.body?.audioBase64 || '').trim();
    const mimeType = String(req.body?.mimeType || 'audio/webm').trim();

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio data is required.' });
      return;
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe this spoken North East India travel search or question accurately into plain text. Return only the transcribed words.',
          },
        ],
      },
    });

    res.json({
      transcript: (response.text ?? '').trim(),
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    const message = error instanceof Error ? error.message : 'Unable to transcribe audio.';
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// HTTP Server + WebSocket Live API Bridge (gemini-3.8-live)
// ---------------------------------------------------------------------------

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  let session: Awaited<ReturnType<ReturnType<typeof getGeminiClient>['live']['connect']>> | null =
    null;

  try {
    const ai = getGeminiClient();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction:
          'You are the Highland Sanctuary voice travel concierge for North East India (Assam, Meghalaya, Arunachal Pradesh, Nagaland, Sikkim, Manipur, Mizoram, and Tripura). Speak warmly and concisely. Help travelers pick experiential homestays, bamboo huts, houseboats, tea bungalows, and check ILP/Nathula permit tips or seasonal weather.',
      },
      callbacks: {
        onopen: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ ready: true }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;
          const content = message.serverContent;

          if (content?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ inputTranscript: content.inputTranscription.text })
            );
          }
          if (content?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({ outputTranscript: content.outputTranscription.text })
            );
          }
          for (const part of content?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
          }
          if (content?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
          if (content?.turnComplete) {
            clientWs.send(JSON.stringify({ turnComplete: true }));
          }
        },
        onerror: (err) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: 'Voice concierge connection error.' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
      },
    });
  } catch (error) {
    console.error('Failed to connect Gemini Live:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unable to start live voice session.',
        })
      );
      clientWs.close();
    }
    return;
  }

  clientWs.on('message', (raw) => {
    if (!session) return;
    try {
      const payload = JSON.parse(raw.toString()) as { audio?: string; text?: string };
      if (payload.audio) {
        session.sendRealtimeInput({
          audio: {
            data: payload.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      } else if (payload.text) {
        session.sendRealtimeInput({ text: payload.text });
      }
    } catch (err) {
      console.error('Error forwarding WS message to Live session:', err);
    }
  });

  clientWs.on('close', () => {
    try {
      session?.close();
    } catch {
      // ignore close errors
    }
  });
});

// ---------------------------------------------------------------------------
// Frontend Serving (Vite dev middleware in dev, dist/ static in production)
// ---------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    app.get('/download-code.zip', (_req, res) => {
      const zipPath = path.resolve(process.cwd(), 'highland-sanctuary-source.zip');
      res.download(zipPath, 'highland-sanctuary-source.zip', (err) => {
        if (err && !res.headersSent) {
          res.status(404).json({ error: 'Source archive not found.' });
        }
      });
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Highland Sanctuary server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
