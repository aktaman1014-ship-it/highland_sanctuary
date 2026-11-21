import { useCallback, useRef, useState } from 'react';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

export function useAudioTranscriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startRecording = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      stopTracks();
      setError(
        err instanceof Error ? err.message : 'Unable to access microphone.'
      );
    }
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      stopTracks();
      return null;
    }

    setIsRecording(false);
    setIsTranscribing(true);
    setError(null);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const mimeType = recorder.mimeType || 'audio/webm';
          resolve(new Blob(chunksRef.current, { type: mimeType }));
        };
        recorder.stop();
      });

      stopTracks();
      const base64 = await blobToBase64(blob);
      const cleanMime = (blob.type || 'audio/webm').split(';')[0];

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: cleanMime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed.');
      }

      return String(data.transcript || '').trim();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to transcribe audio.'
      );
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const transcribeUploadedFile = useCallback(async (file: File): Promise<string | null> => {
    setIsTranscribing(true);
    setError(null);
    try {
      const base64 = await blobToBase64(file);
      const cleanMime = (file.type || 'audio/mp3').split(';')[0];
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType: cleanMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transcription failed.');
      }
      return String(data.transcript || '').trim();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to transcribe audio file.'
      );
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    error,
    clearError: () => setError(null),
    startRecording,
    stopAndTranscribe,
    transcribeUploadedFile,
  };
}
