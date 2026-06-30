import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface UseAudioLiveProps {
  sessionId: string;
  onTranscript: (speaker: 'INTERVIEWER' | 'CANDIDATE', text: string) => void;
  onStateUpdate: (session: any) => void;
  onCompleted: () => void;
  onReady: () => void;
  onConnected: () => void;
}

export function useAudioLive({
  sessionId,
  onTranscript,
  onStateUpdate,
  onCompleted,
  onReady,
  onConnected
}: UseAudioLiveProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false);
  const [useRestFallback, setUseRestFallback] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micNodeRef = useRef<ScriptProcessorNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Playback queue variables (for WebSocket mode)
  const playbackQueueRef = useRef<{ source: AudioBufferSourceNode; duration: number }[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Analyser nodes for input and output visualizers
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const speakerAnalyserRef = useRef<AnalyserNode | null>(null);

  // Clean up active playback nodes
  const stopAllPlayback = useCallback(() => {
    console.log('[Audio] Stopping all speaker playbacks.');
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        // Source might have already finished
      }
    });
    activeSourcesRef.current = [];
    playbackQueueRef.current = [];
    nextPlayTimeRef.current = 0;
    isPlayingRef.current = false;
    setInterviewerSpeaking(false);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Browser Speech Synthesis Voice Output (for REST mode)
  const speakTextFallback = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn('[REST Fallback] Speech synthesis not supported in this browser.');
      setIsProcessing(false);
      return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer English voice
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      setInterviewerSpeaking(true);
      setIsProcessing(false);
    };

    utterance.onend = () => {
      setInterviewerSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.error('[REST Fallback] Speech synthesis error:', e);
      setInterviewerSpeaking(false);
      setIsProcessing(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Upload recorded audio clip via REST
  const uploadAudioAndGetNextTurn = useCallback(async (blob: Blob) => {
    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('audio', blob, 'candidate-response.webm');

      console.log('[REST Fallback] Uploading audio chunk to REST API...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/interview/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`REST message error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('[REST Fallback] Response payload received:', data);

      // 1. Render Candidate Transcript
      if (data.candidateText) {
        onTranscript('CANDIDATE', data.candidateText);
      }

      // 2. Render and Speak Interviewer Response
      if (data.message && data.message.text) {
        onTranscript('INTERVIEWER', data.message.text);
        speakTextFallback(data.message.text);
      } else {
        setIsProcessing(false);
      }

      // 3. Update session indicators
      if (data.session) {
        onStateUpdate(data.session);
        if (data.session.status === 'completed') {
          onCompleted();
        }
      }
    } catch (error) {
      console.error('[REST Fallback] Failed uploading audio:', error);
      alert('Error transcribing audio. Please speak clearly and try again.');
      setIsProcessing(false);
    }
  }, [sessionId, onTranscript, onStateUpdate, onCompleted, speakTextFallback]);

  // Initialize WebSocket connection (with automated REST fallback triggers)
  useEffect(() => {
    if (useRestFallback) {
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token || !sessionId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000'}/api/interview/live/${sessionId}?token=${token}`;
    console.log('[WS Client] Connecting to', wsUrl);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;
    } catch (e) {
      console.error('[WS Client] Socket creation failed. Falling back to REST mode:', e);
      setUseRestFallback(true);
      setIsConnected(true);
      onConnected();
      onReady();
      return;
    }

    ws.onopen = () => {
      console.log('[WS Client] WebSocket open.');
      setIsConnected(true);
      onConnected();
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        switch (payload.event) {
          case 'connected':
            console.log('[WS Client] Handshake:', payload.message);
            break;

          case 'ready':
            console.log('[WS Client] Gemini Live setup completed. Interviewer is ready.');
            onReady();
            break;

          case 'audio':
            // Incoming PCM 24kHz Base64 audio chunk from interviewer
            playIncomingAudioChunk(payload.data);
            break;

          case 'interrupted':
            console.log('[WS Client] Server notified of interruption.');
            stopAllPlayback();
            break;

          case 'transcript':
            onTranscript(payload.speaker, payload.text);
            if (payload.speaker === 'INTERVIEWER') {
              setIsProcessing(false);
            }
            break;

          case 'state_update':
            onStateUpdate(payload.session);
            break;

          case 'completed':
            onCompleted();
            break;

          case 'error':
            console.error('[WS Client] Server error returned, triggering REST fallback:', payload.error);
            setUseRestFallback(true);
            setIsConnected(true);
            onReady();
            break;
        }
      } catch (err) {
        console.error('[WS Client] Failed parsing WebSocket payload:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS Client] WebSocket closed.');
      if (!useRestFallback) {
        console.log('[WS Client] Closed before fallback. Activating REST fallback.');
        setUseRestFallback(true);
        setIsConnected(true);
        onConnected();
        onReady();
      } else {
        setIsConnected(false);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS Client] WebSocket connection error, switching to REST mode:', err);
      setUseRestFallback(true);
      setIsConnected(true);
      onConnected();
      onReady();
    };

    return () => {
      ws.close();
      stopAllPlayback();
    };
  }, [sessionId, onConnected, onReady, onTranscript, onStateUpdate, onCompleted, stopAllPlayback, useRestFallback]);

  // Convert Base64 back to Float32Array PCM and queue it for playback (WebSocket mode)
  const playIncomingAudioChunk = (base64Data: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      speakerAnalyserRef.current = audioCtxRef.current.createAnalyser();
      speakerAnalyserRef.current.fftSize = 256;
      speakerAnalyserRef.current.connect(audioCtxRef.current.destination);
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16Buffer = new Int16Array(bytes.buffer);
    const float32Buffer = new Float32Array(int16Buffer.length);
    for (let i = 0; i < int16Buffer.length; i++) {
      float32Buffer[i] = int16Buffer[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32Buffer.length, 24000);
    audioBuffer.getChannelData(0).set(float32Buffer);

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;

    if (speakerAnalyserRef.current) {
      sourceNode.connect(speakerAnalyserRef.current);
    }

    activeSourcesRef.current.push(sourceNode);

    const currentTime = ctx.currentTime;
    let playTime = nextPlayTimeRef.current;

    if (playTime < currentTime) {
      playTime = currentTime + 0.05;
    }

    sourceNode.start(playTime);
    nextPlayTimeRef.current = playTime + audioBuffer.duration;

    setInterviewerSpeaking(true);

    sourceNode.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((node) => node !== sourceNode);
      if (activeSourcesRef.current.length === 0) {
        setInterviewerSpeaking(false);
      }
    };
  };

  // Convert Float32Array PCM input from mic to Int16 PCM Base64 (WebSocket mode)
  const processAndSendMicAudio = (float32Samples: Float32Array) => {
    const len = float32Samples.length;
    const int16Buffer = new Int16Array(len);

    for (let i = 0; i < len; i++) {
      const sample = float32Samples[i];
      const clamped = Math.max(-1, Math.min(1, sample));
      int16Buffer[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    }

    const uint8Array = new Uint8Array(int16Buffer.buffer);
    let binary = '';
    const bytesLen = uint8Array.byteLength;
    for (let i = 0; i < bytesLen; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = window.btoa(binary);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event: 'audio',
        data: base64Audio
      }));
    }
  };

  // Start recording microphone
  const startRecording = async () => {
    try {
      if (isRecording) return;
      stopAllPlayback();

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        speakerAnalyserRef.current = audioCtxRef.current.createAnalyser();
        speakerAnalyserRef.current.fftSize = 256;
        speakerAnalyserRef.current.connect(audioCtxRef.current.destination);
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      micStreamRef.current = stream;

      const micSource = ctx.createMediaStreamSource(stream);
      micSourceRef.current = micSource;

      const micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 256;
      micSource.connect(micAnalyser);
      micAnalyserRef.current = micAnalyser;

      if (useRestFallback) {
        recordedChunksRef.current = [];
        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        } catch (e) {
          mediaRecorder = new MediaRecorder(stream);
        }
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start();
      }

      const bufferSize = 2048;
      const micNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      micNode.onaudioprocess = (e) => {
        const float32Samples = e.inputBuffer.getChannelData(0);

        if (isPlayingRef.current || interviewerSpeaking) {
          let sum = 0;
          for (let i = 0; i < float32Samples.length; i++) {
            sum += float32Samples[i] * float32Samples[i];
          }
          const rms = Math.sqrt(sum / float32Samples.length);
          if (rms > 0.04) {
            console.log('[Interruption] Speech threshold crossed:', rms);
            stopAllPlayback();
            if (!useRestFallback && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({ event: 'interrupt' }));
            }
          }
        }

        if (!useRestFallback) {
          processAndSendMicAudio(float32Samples);
        }
      };

      micNode.connect(ctx.destination);
      micNodeRef.current = micNode;
      micSource.connect(micNode);

      setIsRecording(true);
      console.log('[Audio] Recording microphone input.');
    } catch (error) {
      console.error('[Audio] Failed starting microphone capture:', error);
      alert('Could not access microphone. Please verify website permissions.');
    }
  };

  // Stop recording microphone
  const stopRecording = async () => {
    if (!isRecording) return;

    console.log('[Audio] Stopping microphone capture.');
    setIsRecording(false);
    setIsProcessing(true);

    if (useRestFallback) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        // Wait for MediaRecorder to finalize chunks
        await new Promise<void>((resolve) => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = () => resolve();
          } else {
            resolve();
          }
        });

        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        await uploadAudioAndGetNextTurn(audioBlob);
      }
    } else {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ event: 'audio_done' }));
      }
    }

    if (micNodeRef.current) {
      micNodeRef.current.disconnect();
      micNodeRef.current = null;
    }

    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  };

  useEffect(() => {
    isPlayingRef.current = interviewerSpeaking;
  }, [interviewerSpeaking]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isRecording,
    isProcessing,
    isConnected,
    interviewerSpeaking,
    startRecording,
    stopRecording,
    stopAllPlayback,
    micAnalyser: micAnalyserRef.current,
    speakerAnalyser: speakerAnalyserRef.current,
    isRestMode: useRestFallback
  };
}
