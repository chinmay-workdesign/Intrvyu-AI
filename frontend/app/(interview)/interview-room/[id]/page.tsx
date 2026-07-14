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
  Clock
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

  // Canvas visualizer rendering loop (Horizontal Equalizer / Waveform)
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    // Buffer for FFT analyser
    const dataArray = new Uint8Array(48);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      let hasData = false;

      // Read volume data
      if (status === 'listening' && micAnalyser && !isMuted) {
        micAnalyser.getByteFrequencyData(dataArray);
        hasData = true;
      } else if (status === 'speaking' && speakerAnalyser) {
        speakerAnalyser.getByteFrequencyData(dataArray);
        hasData = true;
      }

      // Draw horizontal equalizer bars centered around the middle line
      const barWidth = 3;
      const barGap = 3;
      const totalWidth = dataArray.length * (barWidth + barGap);
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;

      // Select color token based on state
      let barColor = '#34312A'; // idle hairline grey
      if (status === 'listening' && !isMuted) {
        barColor = '#E5484D'; // True Red for active user recording
      } else if (status === 'speaking') {
        barColor = '#D98E3F'; // Copper/Amber for interviewer voice
      } else if (status === 'processing') {
        barColor = '#7A9B85'; // Muted Sage for backend processing
      }

      ctx.fillStyle = barColor;

      for (let i = 0; i < dataArray.length; i++) {
        let value = dataArray[i];
        let heightPercent = value / 255;
        let barHeight = heightPercent * (height * 0.6);

        // Breathing effect for idle states
        if (!hasData) {
          barHeight = 4 + Math.sin(i * 0.4 + Date.now() / 250) * 3;
        } else if (status === 'processing') {
          // Scanning pulse for processing
          barHeight = 6 + Math.sin((i - Date.now() / 60) * 0.3) * 6;
        }

        const x = startX + i * (barWidth + barGap);
        const y = centerY - barHeight / 2;

        ctx.beginPath();
        // Drawing symmetric bars growing up & down
        ctx.roundRect(x, y, barWidth, Math.max(2, barHeight), 1.5);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [status, micAnalyser, speakerAnalyser, isMuted]);

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
      <div className="min-h-screen flex items-center justify-center bg-base p-6 text-txt-primary">
        <div className="flat-card p-8 rounded-xl text-center space-y-4 max-w-sm">
          <Info className="w-8 h-8 text-accent mx-auto" />
          <h3 className="text-lg font-display font-semibold">Error Accessing Session</h3>
          <p className="text-xs text-txt-secondary leading-relaxed">
            This interview session is either invalid or you do not have permission to view it.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-accent text-base font-semibold py-2.5 rounded text-xs active:scale-[0.98] transition-all"
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
    <div className="min-h-screen bg-base text-txt-primary flex flex-col justify-between overflow-hidden">
      
      {/* HUD Header */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {/* Live recording indicator light pulses ONLY when actively recording (status is 'listening') */}
            <span className={`w-2.5 h-2.5 rounded-full ${
              status === 'listening' && !isMuted 
                ? 'bg-live animate-rec-pulse' 
                : 'bg-txt-secondary opacity-30'
            }`} />
            <h2 className="font-display font-semibold text-txt-primary text-base">
              {interviewerName}
            </h2>
          </div>
          <span className="text-[9px] text-txt-secondary font-mono uppercase tracking-wider block">
            {interviewerTitle} · LIVE SESSION
          </span>
        </div>

        {/* Timer HUD */}
        <div className="inline-flex items-center gap-2 bg-surface border border-hairline px-3 py-1.5 rounded text-txt-primary">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="font-mono font-bold text-xs tracking-widest">
            {formatClock(timeRemaining)}
          </span>
        </div>
      </header>

      {/* Visual Canvas Visualizer */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6 relative z-10">
        
        <div className="w-full aspect-[4/3] max-h-[300px] relative flex items-center justify-center">
          {/* Responsive Equalizer Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          
          {/* Inner Studio Mic Button */}
          <button
            onClick={handleMicToggle}
            disabled={status === 'connecting' || status === 'processing' || isEnding}
            className={`w-24 h-24 rounded-full flex flex-col items-center justify-center relative z-10 border transition-all duration-250 active:scale-95 cursor-pointer ${
              status === 'listening' && !isMuted
                ? 'bg-surface border-live text-live'
                : status === 'speaking'
                ? 'bg-surface border-accent text-accent'
                : 'bg-surface border-hairline text-txt-secondary hover:text-txt-primary'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : status === 'connecting' || status === 'processing' ? (
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            ) : status === 'speaking' ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
            <span className="text-[8px] font-mono tracking-wider uppercase mt-1.5 block opacity-70">
              {isMuted ? 'Muted' : status === 'listening' ? 'Speak' : status === 'speaking' ? 'Talk' : 'Idle'}
            </span>
          </button>
        </div>

        {/* Live HUD status description */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs font-mono tracking-wider text-txt-primary uppercase">
            {status === 'connecting' && 'CONNECTING TO DUPLEX STREAM...'}
            {status === 'ready' && 'READY · WAITING FOR RESPONSE'}
            {status === 'listening' && 'STUDIO LIVE · LISTENING'}
            {status === 'speaking' && `STUDIO LIVE · ${interviewerName.toUpperCase()} SPEAKING`}
            {status === 'processing' && 'ANALYZING VOCAL DATA NODES...'}
          </p>
          <p className="text-xs text-txt-secondary max-w-sm leading-relaxed mx-auto">
            {status === 'listening' && 'Speak naturally. The AI will hear you and respond when you pause or stop speaking.'}
            {status === 'speaking' && 'You can interrupt Sarah at any time. Simply start speaking and she will pause.'}
            {status === 'processing' && 'STAR metrics are compiling. Scoring engine is evaluating candidate response.'}
          </p>
        </div>
      </main>

      {/* HUD Controller footer */}
      <footer className="w-full max-w-md mx-auto px-6 pb-12 flex items-center justify-center gap-4 relative z-10">
        
        {/* Toggle Mute / Mic */}
        <button
          onClick={handleMicToggle}
          disabled={status === 'connecting' || status === 'processing' || isEnding}
          className={`p-3.5 rounded border transition-all cursor-pointer ${
            isMuted 
              ? 'bg-live/15 border-live text-live' 
              : 'bg-surface border-hairline text-txt-secondary hover:text-txt-primary hover:bg-base'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Force Complete End Session - Not red, flat neutral grey styled button */}
        <button
          onClick={handleEndInterview}
          disabled={isEnding || status === 'connecting'}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-surface border border-hairline hover:bg-base disabled:opacity-40 text-txt-primary font-semibold py-3.5 px-6 rounded text-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          {isEnding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              Compiling Report...
            </>
          ) : (
            <>
              <PhoneOff className="w-4 h-4 text-txt-secondary" />
              End Interview
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
