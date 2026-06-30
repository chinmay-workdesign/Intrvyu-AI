'use client';

import React, { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../../services/api';
import { useAuthStore } from '../../../../store/authStore';
import { 
  Award, 
  ArrowLeft, 
  Play, 
  Square,
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Info,
  Loader2
} from 'lucide-react';

interface FeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default function FeedbackReportPage({ params }: FeedbackPageProps) {
  const router = useRouter();
  const { id: sessionId } = use(params);
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'insights' | 'transcript' | 'action_plan'>('insights');
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('intrvyu_token');
    if (!token) {
      router.push('/login');
    }
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, [isAuthenticated, router]);

  // Fetch Feedback Report
  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['feedback', sessionId],
    queryFn: () => api.getFeedback(sessionId),
    enabled: !!sessionId
  });

  const handlePlayVoice = (text: string, index: number, speaker: string) => {
    if (!synthRef.current) return;

    // If currently speaking, stop
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      if (speakingIndex === index) {
        setSpeakingIndex(null);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice characteristics
    const voices = synthRef.current.getVoices();
    if (speaker === 'INTERVIEWER') {
      // Find a premium feminine or distinct voice for AI if available
      const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Female'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
    } else {
      // Masculine or generic local user voice
      const maleVoice = voices.find(v => v.name.includes('David') || v.name.includes('Male'));
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.95;
      utterance.rate = 1.0;
    }

    setSpeakingIndex(index);
    utterance.onend = () => {
      setSpeakingIndex(null);
    };
    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    synthRef.current.speak(utterance);
  };

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold">Compiling interview insights...</h3>
          <p className="text-xs text-neutral-500">This will take a few seconds as we structure your report.</p>
        </div>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-6">
        <div className="glass-card p-8 rounded-2xl border border-white/10 text-center space-y-4 max-w-sm">
          <Info className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Report Not Found</h3>
          <p className="text-sm text-neutral-400">
            This interview session feedback report is not generated yet or failed.
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

  const {
    overallScore,
    communicationScore,
    confidenceScore,
    technicalDepthScore,
    problemSolvingScore,
    starFrameworkScore,
    leadershipScore,
    behavioralScore,
    strengths,
    weaknesses,
    areasToImprove,
    actionPlan,
    transcriptEvidence,
    session
  } = feedbackData;

  const messages = session?.messages || [];
  const sessionType = session?.type || 'mock';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between print:bg-white print:text-neutral-900">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none print:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none print:hidden" />

      {/* Header */}
      <header className="w-full border-b border-white/[0.05] bg-neutral-950/70 backdrop-blur-md sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-neutral-200 font-semibold px-4 py-2 rounded-xl text-xs active:scale-95 transition-transform"
          >
            <Download className="w-3.5 h-3.5" />
            Print / PDF Report
          </button>
        </div>
      </header>

      {/* Report Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-10 print:py-0 print:px-0">
        
        {/* Main Dashboard Card */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-gradient-to-tr from-indigo-500/5 via-violet-500/5 to-transparent border border-white/[0.08] p-8 rounded-3xl relative overflow-hidden print:border-neutral-200 print:bg-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none print:hidden" />
          
          {/* Circular Score Gauge */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Background ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="6"
                  fill="transparent"
                  className="print:stroke-neutral-100"
                />
                {/* Active circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#indigoGrad)"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="263.8"
                  strokeDashoffset={263.8 - (263.8 * overallScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out print:stroke-indigo-600"
                />
                <defs>
                  <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white print:text-neutral-900 tracking-tight">{overallScore}</span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block">Overall</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider print:border-indigo-600 print:text-indigo-600">
                {sessionType.replace('_', ' ')} track
              </span>
            </div>
          </div>

          {/* Sub category score sliding lists */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white print:text-neutral-900 tracking-tight">Competency Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Category sliders */}
              {[
                { label: 'Communication', score: communicationScore },
                { label: 'Technical Depth', score: technicalDepthScore },
                { label: 'Problem Solving', score: problemSolvingScore },
                { label: 'Confidence', score: confidenceScore },
                ...(sessionType === 'behavioral' ? [
                  { label: 'STAR Framework', score: starFrameworkScore },
                  { label: 'Leadership', score: leadershipScore },
                  { label: 'Behavioral Fit', score: behavioralScore }
                ] : [])
              ].map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-400 print:text-neutral-600">{cat.label}</span>
                    <span className="text-white print:text-neutral-900">{cat.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.04] print:bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${cat.score}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full print:bg-indigo-600"
                    />
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-white/[0.08] print:hidden">
          <div className="flex gap-6 text-sm font-semibold">
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-4 transition-all relative cursor-pointer ${
                activeTab === 'insights' ? 'text-white border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Feedback Insights
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-4 transition-all relative cursor-pointer ${
                activeTab === 'transcript' ? 'text-white border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Voice Transcript Timeline
            </button>
            <button
              onClick={() => setActiveTab('action_plan')}
              className={`pb-4 transition-all relative cursor-pointer ${
                activeTab === 'action_plan' ? 'text-white border-b-2 border-indigo-500' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Action Study Plan
            </button>
          </div>
        </section>

        {/* Dynamic Tab Renderers */}
        <div className="space-y-8">
          
          {/* TAB 1: INSIGHTS */}
          {(activeTab === 'insights' || typeof window === 'undefined' /* Render all in PDF print */) && (
            <div className="space-y-8 print:block">
              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Strengths */}
                <div className="glass-card p-6 rounded-2xl border border-white/[0.05] space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4>Core Strengths</h4>
                  </div>
                  <ul className="space-y-3.5">
                    {strengths.map((str: string, i: number) => (
                      <li key={i} className="text-sm text-neutral-300 print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="glass-card p-6 rounded-2xl border border-white/[0.05] space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertCircle className="w-5 h-5" />
                    <h4>Identified Gaps</h4>
                  </div>
                  <ul className="space-y-3.5">
                    {weaknesses.map((weak: string, i: number) => (
                      <li key={i} className="text-sm text-neutral-300 print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                        {weak}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Transcript Evidence Quotes */}
              <div className="glass-card p-6 rounded-2xl border border-white/[0.05] space-y-4 print:border-neutral-200">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Award className="w-5 h-5" />
                  <h4>Transcript Highlights Analysis</h4>
                </div>
                <div className="space-y-6">
                  {transcriptEvidence.map((ev: any, i: number) => (
                    <div key={i} className="border-l-2 border-indigo-500/20 pl-4 py-1 space-y-2">
                      <blockquote className="text-sm italic text-neutral-300 print:text-neutral-700 leading-relaxed">
                        &ldquo;{ev.quote}&rdquo;
                      </blockquote>
                      <p className="text-xs text-neutral-400 print:text-neutral-600 font-medium">
                        <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px] mr-1.5">Evaluation:</span>
                        {ev.evaluation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FULL TRANSCRIPT TIMELINE */}
          {(activeTab === 'transcript' || typeof window === 'undefined') && (
            <div className="space-y-6 print:block print:mt-10">
              <div className="flex items-center gap-2 text-lg font-bold text-white print:text-neutral-900 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3>Conversation Log Replay</h3>
              </div>

              {messages.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 relative print:max-h-none print:overflow-visible">
                  {messages.map((msg: any, index: number) => {
                    const isAI = msg.speaker === 'INTERVIEWER';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                          isAI 
                            ? 'bg-indigo-500/[0.02] border-indigo-500/10 mr-12' 
                            : 'bg-white/[0.02] border-white/5 ml-12'
                        }`}
                      >
                        {/* Audio play trigger */}
                        <button
                          onClick={() => handlePlayVoice(msg.text, index, msg.speaker)}
                          className={`p-2.5 rounded-xl border flex-shrink-0 active:scale-95 transition-all print:hidden cursor-pointer ${
                            speakingIndex === index
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : isAI 
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                              : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                          }`}
                          title="Replay speech audio"
                        >
                          {speakingIndex === index ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isAI ? 'text-indigo-400' : 'text-neutral-400'}`}>
                              {isAI ? 'Interviewer' : 'Candidate'}
                            </span>
                            <span className="text-[9px] text-neutral-600">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-300 print:text-neutral-800 leading-relaxed font-medium">
                            {msg.text}
                          </p>
                          
                          {/* Attach node evaluation summary if candidate response exists */}
                          {!isAI && msg.evaluation && (
                            <div className="mt-3 bg-white/[0.01] border border-white/[0.05] p-3 rounded-lg text-xs space-y-1 print:border-neutral-200">
                              <div className="flex gap-4 text-[10px] font-semibold text-neutral-400">
                                <span>Comm: {msg.evaluation.communication}/10</span>
                                <span>Depth: {msg.evaluation.technicalDepth}/10</span>
                                <span>Problem Solving: {msg.evaluation.problemSolving}/10</span>
                              </div>
                              <p className="text-neutral-400 print:text-neutral-600 mt-1 italic">&ldquo;{msg.evaluation.feedback}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-neutral-500 text-sm">No messages available in this session.</div>
              )}
            </div>
          )}

          {/* TAB 3: ACTION STUDY PLAN */}
          {(activeTab === 'action_plan' || typeof window === 'undefined') && (
            <div className="space-y-8 print:block print:mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Areas to improve */}
                <div className="glass-card p-6 rounded-2xl border border-white/[0.05] space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <BookOpen className="w-5 h-5" />
                    <h4>Recommended Areas of Study</h4>
                  </div>
                  <ul className="space-y-3.5">
                    {areasToImprove.map((item: string, i: number) => (
                      <li key={i} className="text-sm text-neutral-300 print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Structured Action Steps */}
                <div className="glass-card p-6 rounded-2xl border border-white/[0.05] space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-violet-400 font-bold">
                    <Layers className="w-5 h-5" />
                    <h4>Action Plan Steps</h4>
                  </div>
                  <div className="space-y-4">
                    {actionPlan.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-neutral-300 print:text-neutral-800 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Next steps CTA */}
              <div className="bg-indigo-500/5 border border-indigo-500/10 p-8 rounded-3xl text-center space-y-4 print:hidden">
                <h4 className="text-lg font-bold text-white">Ready to iterate and scale your score?</h4>
                <p className="text-sm text-neutral-400 max-w-md mx-auto">
                  Take another mock run on the same track or challenge other interviewer personas to build your adaptability.
                </p>
                <Link
                  href="/interview-selection"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium px-6 py-3 rounded-xl hover:shadow-lg active:scale-95 transition-all"
                >
                  Start New Session
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.05] py-6 text-center text-xs text-neutral-600 mt-20 print:hidden">
        <span>© {new Date().getFullYear()} Intrvyu AI. Comprehensive Feedback Card.</span>
      </footer>
    </div>
  );
}
