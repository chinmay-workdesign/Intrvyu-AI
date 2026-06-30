'use client';

import React, { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioLive } from '../../../../hooks/useAudioLive';
import { api } from '../../../../services/api';
import { useAuthStore } from '../../../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Loader2, 
  Volume2, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

interface InterviewRoomProps {
  params: Promise<{ id: string }>;
}

export default function InterviewRoomPage({ params }: InterviewRoomProps) {
  const router = useRouter();
  const { id: sessionId } = use(params);
  const { isAuthenticated } = useAuthStore();
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'connecting' | 'speaking' | 'listening' | 'processing' | 'ready'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1200); // default 20m
  const [isEnding, setIsEnding] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('intrvyu_token');
    if (!token) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch Session details to verify ownership and load state
  const { data: sessionData, error } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSessions().then(list => list.find((s: any) => s.id === sessionId)),
    enabled: !!sessionId
  });

  // Countdown timer hook
  useEffect(() => {
    if (status === 'connecting' || status === 'processing' || isEnding) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, isEnding]);

  // Initialize Audio hook
  const {
    isRecording,
    isProcessing,
    isConnected,
    interviewerSpeaking,
    startRecording,
    stopRecording,
    micAnalyser,
    speakerAnalyser
  } = useAudioLive({
    sessionId,
    onTranscript: (speaker, text) => {
      console.log(`[Transcript] ${speaker}: ${text}`);
      if (speaker === 'INTERVIEWER') {
        setStatus('speaking');
      }
    },
    onStateUpdate: (session) => {
      if (session && session.timeRemaining) {
        setTimeRemaining(session.timeRemaining);
      }
    },
    onCompleted: () => {
      console.log('[Room] Interview completed signal received.');
      handleEndInterview();
    },
    onReady: () => {
      setStatus('speaking'); // Interviewer speaks first (greeting)
    },
    onConnected: () => {
      setStatus('ready');
    }
  });

  // Monitor recording/speaking states to set correct HUD status
  useEffect(() => {
    if (!isConnected) {
      setStatus('connecting');
    } else if (isProcessing) {
      setStatus('processing');
    } else if (interviewerSpeaking) {
      setStatus('speaking');
    } else if (isRecording) {
      setStatus('listening');
    } else {
      setStatus('ready');
    }
  }, [isConnected, isProcessing, interviewerSpeaking, isRecording]);

  // Canvas visualizer rendering loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    // Data buffers for FFT analysers
    const micDataArray = new Uint8Array(128);
    const speakerDataArray = new Uint8Array(128);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      let amplitude = 0.15; // baseline breathing amplitude

      // Read volume data
      if (status === 'listening' && micAnalyser) {
        micAnalyser.getByteFrequencyData(micDataArray);
        let sum = 0;
        for (let i = 0; i < micDataArray.length; i++) {
          sum += micDataArray[i];
        }
        amplitude = Math.max(0.15, (sum / micDataArray.length) / 55); // scale mic input
      } else if (status === 'speaking' && speakerAnalyser) {
        speakerAnalyser.getByteFrequencyData(speakerDataArray);
        let sum = 0;
        for (let i = 0; i < speakerDataArray.length; i++) {
          sum += speakerDataArray[i];
        }
        amplitude = Math.max(0.15, (sum / speakerDataArray.length) / 45); // scale speaker input
      } else if (status === 'processing') {
        amplitude = 0.25 + Math.sin(Date.now() / 150) * 0.08; // processing wave
      }

      // Draw multi-layered orbital glowing rings
      const radius = 90;
      const center = { x: width / 2, y: height / 2 };

      // Outer soft pulse ring
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius + (amplitude * 35), 0, Math.PI * 2);
      ctx.strokeStyle = status === 'listening' 
        ? 'rgba(16, 185, 129, 0.04)' // Green for listening
        : status === 'speaking' 
        ? 'rgba(99, 102, 241, 0.04)' // Indigo for speaking
        : 'rgba(255, 255, 255, 0.02)';
      ctx.fillStyle = status === 'listening'
        ? 'rgba(16, 185, 129, 0.01)'
        : status === 'speaking'
        ? 'rgba(99, 102, 241, 0.01)'
        : 'rgba(255, 255, 255, 0.005)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      // Middle active ring
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius + (amplitude * 18), 0, Math.PI * 2);
      ctx.strokeStyle = status === 'listening'
        ? 'rgba(16, 185, 129, 0.12)'
        : status === 'speaking'
        ? 'rgba(99, 102, 241, 0.12)'
        : 'rgba(255, 255, 255, 0.04)';
      ctx.stroke();

      // Inner wave ripple lines (Circular sine waves)
      const numPoints = 80;
      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Apply sinusoidal noise based on time and audio amplitude
        const offset = Math.sin(angle * 8 + Date.now() / 200) * (amplitude * 10);
        const r = radius + offset;
        const x = center.x + r * Math.cos(angle);
        const y = center.y + r * Math.sin(angle);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = status === 'listening'
        ? 'rgba(16, 185, 129, 0.6)'
        : status === 'speaking'
        ? 'rgba(99, 102, 241, 0.6)'
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, micAnalyser, speakerAnalyser]);

  // Handle click on mic button (unmute/record toggle)
  const handleMicToggle = async () => {
    if (status === 'connecting' || status === 'processing' || isEnding) return;

    if (isRecording) {
      stopRecording();
      setIsMuted(true);
    } else {
      setIsMuted(false);
      await startRecording();
    }
  };

  // Start recording automatically when session transitions to listening
  useEffect(() => {
    if (isConnected && status === 'ready' && !isRecording && !isMuted && !interviewerSpeaking) {
      startRecording();
    }
  }, [isConnected, status, isRecording, isMuted, interviewerSpeaking, startRecording]);

  const handleEndInterview = async () => {
    if (isEnding) return;
    setIsEnding(true);
    setStatus('processing');
    
    // Stop recording first
    if (isRecording) {
      stopRecording();
    }

    try {
      console.log('[Room] Submitting end of interview...');
      const response = await api.endInterview(sessionId);
      router.push(`/feedback/${sessionId}`);
    } catch (error) {
      console.error('Failed to end interview session:', error);
      setIsEnding(false);
      alert('Failed compiling mock feedback. Routing to dashboard.');
      router.push('/dashboard');
    }
  };

  // Format countdown clock
  const formatClock = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <div className="glass-card p-8 rounded-2xl border border-white/10 text-center space-y-4 max-w-sm">
          <Info className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Error Accessing Session</h3>
          <p className="text-sm text-neutral-400">
            This interview session is either invalid or you do not have permission to view it.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white text-neutral-950 font-semibold py-2.5 rounded-xl hover:bg-neutral-200 text-sm transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get active persona name
  const interviewerName = sessionData ? (sessionData.type === 'system_design' ? 'Sarah' : sessionData.type === 'technical' ? 'Alex' : sessionData.type === 'behavioral' ? 'Elena' : 'David') : 'Interviewer';
  const interviewerTitle = sessionData ? (sessionData.type === 'system_design' ? 'Lead Architect' : sessionData.type === 'technical' ? 'Staff Engineer' : sessionData.type === 'behavioral' ? 'Engineering Manager' : 'Talent Director') : 'AI';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between overflow-hidden">
      
      {/* Radial Glow Layer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full bg-indigo-500/2 blur-[180px] pointer-events-none" />

      {/* HUD Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <h2 className="font-bold text-white tracking-tight text-base">
              {interviewerName}
            </h2>
          </div>
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">
            {interviewerTitle} • Active Run
          </span>
        </div>

        {/* Timer HUD */}
        <div className="inline-flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] px-4 py-2 rounded-xl text-neutral-300">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-mono font-bold text-sm tracking-widest">
            {formatClock(timeRemaining)}
          </span>
        </div>
      </header>

      {/* Visual Canvas Visualizer */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6 relative z-10">
        
        <div className="w-full aspect-square relative flex items-center justify-center max-h-[360px]">
          {/* Visual canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-pointer rounded-full" />
          
          {/* Inner Glowing Mic Button */}
          <button
            onClick={handleMicToggle}
            disabled={status === 'connecting' || status === 'processing' || isEnding}
            className={`w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl relative z-10 border transition-all duration-300 active:scale-95 cursor-pointer ${
              status === 'listening'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/5'
                : status === 'speaking'
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-indigo-500/5'
                : 'bg-neutral-900/80 border-white/10 text-neutral-400 hover:text-white'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-8 h-8" />
            ) : status === 'connecting' || status === 'processing' ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            ) : status === 'speaking' ? (
              <Volume2 className="w-8 h-8 animate-pulse" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
            <span className="text-[9px] font-bold tracking-widest uppercase mt-2 block opacity-60">
              {isMuted ? 'Muted' : status === 'listening' ? 'Speak' : status === 'speaking' ? 'Talk' : 'Idle'}
            </span>
          </button>
        </div>

        {/* Live HUD status description */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">
            {status === 'connecting' && 'Connecting to Live Session...'}
            {status === 'ready' && 'Ready. Waiting for user response.'}
            {status === 'listening' && 'Interviewer Listening...'}
            {status === 'speaking' && `${interviewerName} is speaking...`}
            {status === 'processing' && 'Processing vocal analysis...'}
          </p>
          <p className="text-xs text-neutral-500 max-w-sm leading-relaxed mx-auto">
            {status === 'listening' && 'Speak naturally. The AI will hear you and automatically respond when you pause or stop.'}
            {status === 'speaking' && 'You can interrupt the AI at any time. Simply start speaking and it will stop playing.'}
            {status === 'processing' && 'Evaluation nodes are processing scores and coverage guidelines...'}
          </p>
        </div>
      </main>

      {/* HUD Controller footer */}
      <footer className="w-full max-w-md mx-auto px-6 pb-12 flex items-center justify-center gap-6 relative z-10">
        
        {/* Toggle Mute / Mic */}
        <button
          onClick={handleMicToggle}
          disabled={status === 'connecting' || status === 'processing' || isEnding}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            isMuted 
              ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
              : 'bg-white/[0.02] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Force Complete End Session */}
        <button
          onClick={handleEndInterview}
          disabled={isEnding || status === 'connecting'}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-red-500/5 active:scale-[0.98] cursor-pointer"
        >
          {isEnding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Compiling Report...
            </>
          ) : (
            <>
              <PhoneOff className="w-4 h-4" />
              End Interview
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
