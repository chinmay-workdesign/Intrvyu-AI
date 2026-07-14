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
      const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Female'));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.05;
      utterance.rate = 0.95;
    } else {
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
      <div className="min-h-screen flex items-center justify-center bg-base text-txt-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <h3 className="text-xs font-mono tracking-wider uppercase text-txt-secondary">COMPILING RUN INSIGHTS...</h3>
          <p className="text-xs text-txt-secondary">Synthesizing vocal transcripts and STAR scoring blocks.</p>
        </div>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base p-6 text-txt-primary">
        <div className="flat-card p-8 rounded-xl text-center space-y-4 max-w-sm">
          <Info className="w-8 h-8 text-accent mx-auto" />
          <h3 className="text-lg font-display font-semibold">Report Not Found</h3>
          <p className="text-xs text-txt-secondary leading-relaxed">
            This interview session feedback report is not generated yet or failed.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-accent text-base font-semibold py-2.5 rounded text-xs active:scale-[0.98] transition-colors"
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
    <div className="min-h-screen bg-base text-txt-primary flex flex-col justify-between print:bg-white print:text-neutral-900">
      
      {/* Header */}
      <header className="w-full border-b border-hairline bg-base sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO DASHBOARD
          </Link>
          
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-surface border border-hairline hover:bg-base text-txt-primary font-semibold px-4 py-2 rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Print Report / PDF
          </button>
        </div>
      </header>

      {/* Report Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 space-y-8 print:py-0 print:px-0">
        
        {/* Main Dashboard Card (Flat, no radial glow/gradient) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center flat-card p-6 md:p-8 rounded-xl bg-surface print:border-neutral-200 print:bg-none">
          
          {/* Circular Score Gauge */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#34312A"
                  strokeWidth="6"
                  fill="transparent"
                  className="print:stroke-neutral-100"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#D98E3F"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="263.8"
                  strokeDashoffset={263.8 - (263.8 * overallScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out print:stroke-indigo-600"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-mono font-bold text-txt-primary print:text-neutral-900 tracking-tight">{overallScore}%</span>
                <span className="text-[8px] font-mono text-txt-secondary uppercase tracking-widest block">OVERALL</span>
              </div>
            </div>
            <div>
              <span className="bg-accent/15 border border-accent/30 text-accent text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {sessionType.replace('_', ' ')} track
              </span>
            </div>
          </div>

          {/* Sub category score lists */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-display font-semibold text-txt-primary print:text-neutral-900 tracking-tight">Competency Assessment</h2>
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
              ].map((cat, idx) => {
                // Sage for >=70 (strong), clay for <70 (weak)
                const isStrong = cat.score >= 70;
                const barColorClass = isStrong ? 'bg-strong' : 'bg-weak';
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-txt-secondary font-mono uppercase tracking-tight text-[10px] print:text-neutral-600">{cat.label}</span>
                      <span className="text-txt-primary font-mono font-semibold print:text-neutral-900">{cat.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-base border border-hairline print:bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${cat.score}%` }}
                        className={`h-full ${barColorClass} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <section className="border-b border-hairline print:hidden">
          <div className="flex gap-6 text-xs font-mono uppercase tracking-wider font-bold">
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-3 transition-all relative cursor-pointer ${
                activeTab === 'insights' ? 'text-txt-primary border-b border-accent' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              Feedback Insights
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 transition-all relative cursor-pointer ${
                activeTab === 'transcript' ? 'text-txt-primary border-b border-accent' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              Transcript Timeline
            </button>
            <button
              onClick={() => setActiveTab('action_plan')}
              className={`pb-3 transition-all relative cursor-pointer ${
                activeTab === 'action_plan' ? 'text-txt-primary border-b border-accent' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              Action Plan
            </button>
          </div>
        </section>

        {/* Dynamic Tab Renderers */}
        <div className="space-y-6">
          
          {/* TAB 1: INSIGHTS */}
          {(activeTab === 'insights' || typeof window === 'undefined') && (
            <div className="space-y-6 print:block">
              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths */}
                <div className="flat-card p-6 rounded-xl space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-strong font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <h4 className="font-display text-sm uppercase tracking-wider">Core Strengths</h4>
                  </div>
                  <ul className="space-y-3 font-sans text-xs md:text-sm">
                    {strengths.map((str: string, i: number) => (
                      <li key={i} className="text-txt-secondary print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-strong mt-2 flex-shrink-0" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="flat-card p-6 rounded-xl space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-weak font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <h4 className="font-display text-sm uppercase tracking-wider">Identified Gaps</h4>
                  </div>
                  <ul className="space-y-3 font-sans text-xs md:text-sm">
                    {weaknesses.map((weak: string, i: number) => (
                      <li key={i} className="text-txt-secondary print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-weak mt-2 flex-shrink-0" />
                        {weak}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Transcript Evidence Quotes */}
              <div className="flat-card p-6 rounded-xl space-y-4 print:border-neutral-200">
                <div className="flex items-center gap-2 text-accent font-bold">
                  <Award className="w-4 h-4" />
                  <h4 className="font-display text-sm uppercase tracking-wider">Transcript Highlights Analysis</h4>
                </div>
                <div className="space-y-4">
                  {transcriptEvidence.map((ev: any, i: number) => (
                    <div key={i} className="border-l border-hairline pl-4 py-1 space-y-1.5">
                      <blockquote className="text-xs md:text-sm italic text-txt-secondary print:text-neutral-700 leading-relaxed">
                        &ldquo;{ev.quote}&rdquo;
                      </blockquote>
                      <p className="text-[11px] text-txt-secondary print:text-neutral-600 font-medium">
                        <span className="text-accent font-mono text-[9px] uppercase tracking-wider mr-1.5">Evaluation:</span>
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
            <div className="space-y-4 print:block print:mt-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary print:text-neutral-900 mb-2 uppercase font-mono tracking-wider">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3>Conversation Log Replay</h3>
              </div>

              {messages.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 relative print:max-h-none print:overflow-visible">
                  {messages.map((msg: any, index: number) => {
                    const isAI = msg.speaker === 'INTERVIEWER';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                          isAI 
                            ? 'bg-surface/40 border-hairline mr-8 md:mr-16' 
                            : 'bg-surface border-hairline ml-8 md:ml-16'
                        }`}
                      >
                        <button
                          onClick={() => handlePlayVoice(msg.text, index, msg.speaker)}
                          className={`p-2 rounded border flex-shrink-0 active:scale-95 transition-all print:hidden cursor-pointer ${
                            speakingIndex === index
                              ? 'bg-live/10 border-live text-live'
                              : isAI 
                              ? 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20'
                              : 'bg-base border-hairline text-txt-secondary hover:bg-surface'
                          }`}
                          title="Replay speech audio"
                        >
                          {speakingIndex === index ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono uppercase tracking-wider ${isAI ? 'text-accent' : 'text-txt-secondary'}`}>
                              {isAI ? 'Interviewer' : 'Candidate'}
                            </span>
                            <span className="text-[9px] font-mono text-txt-secondary">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-txt-primary print:text-neutral-800 leading-relaxed">
                            {msg.text}
                          </p>
                          
                          {/* Evaluator block */}
                          {!isAI && msg.evaluation && (
                            <div className="mt-3 bg-base/50 border border-hairline p-3 rounded text-xs space-y-1.5 print:border-neutral-200">
                              <div className="flex gap-4 text-[9px] font-mono text-txt-secondary uppercase tracking-tight">
                                <span>Comm: {msg.evaluation.communication}/10</span>
                                <span>Depth: {msg.evaluation.technicalDepth}/10</span>
                                <span>Problem Solving: {msg.evaluation.problemSolving}/10</span>
                              </div>
                              <p className="text-txt-secondary print:text-neutral-600 mt-1 italic">&ldquo;{msg.evaluation.feedback}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-txt-secondary text-xs font-mono">NO MESSAGES AVAILABLE IN THIS SESSION.</div>
              )}
            </div>
          )}

          {/* TAB 3: ACTION STUDY PLAN */}
          {(activeTab === 'action_plan' || typeof window === 'undefined') && (
            <div className="space-y-6 print:block print:mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Areas to improve */}
                <div className="flat-card p-6 rounded-xl space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-accent font-bold">
                    <BookOpen className="w-4 h-4" />
                    <h4 className="font-display text-sm uppercase tracking-wider">Recommended Areas of Study</h4>
                  </div>
                  <ul className="space-y-3 font-sans text-xs md:text-sm">
                    {areasToImprove.map((item: string, i: number) => (
                      <li key={i} className="text-txt-secondary print:text-neutral-800 leading-relaxed flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Structured Action Steps */}
                <div className="flat-card p-6 rounded-xl space-y-4 print:border-neutral-200">
                  <div className="flex items-center gap-2 text-accent font-bold">
                    <Layers className="w-4 h-4" />
                    <h4 className="font-display text-sm uppercase tracking-wider">Action Plan Steps</h4>
                  </div>
                  <div className="space-y-3 font-sans text-xs md:text-sm">
                    {actionPlan.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-[9px] font-mono font-bold text-accent flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-txt-secondary print:text-neutral-800 leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Next steps CTA */}
              <div className="flat-card p-6 md:p-8 rounded-xl text-center space-y-3 bg-surface print:hidden">
                <h4 className="text-base font-semibold text-txt-primary font-display">Ready to iterate and scale your score?</h4>
                <p className="text-xs text-txt-secondary max-w-sm mx-auto leading-relaxed">
                  Take another mock run on the same track or challenge other interviewer personas to build your adaptability.
                </p>
                <Link
                  href="/interview-selection"
                  className="inline-flex items-center gap-2 bg-accent text-base font-semibold px-6 py-2.5 rounded hover:bg-opacity-95 active:scale-95 transition-all text-xs"
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
      <footer className="w-full border-t border-hairline py-6 text-center text-[10px] text-txt-secondary mt-20 print:hidden">
        <span>© {new Date().getFullYear()} Intrvyu AI. Feedback Card.</span>
      </footer>
    </div>
  );
}
