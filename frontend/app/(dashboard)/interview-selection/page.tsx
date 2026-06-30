'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '../../../store/interviewStore';
import { api } from '../../../services/api';
import { 
  Mic, 
  ArrowLeft, 
  Settings, 
  Terminal, 
  Users, 
  Briefcase, 
  Database,
  Loader2,
  Play
} from 'lucide-react';

interface PersonaCard {
  id: string;
  name: string;
  role: string;
  voice: string;
  tone: string;
  description: string;
  topics: string[];
  colorClass: string;
  bgGlow: string;
  icon: React.ReactNode;
}

export default function InterviewSelectionPage() {
  const router = useRouter();
  const { experienceLevel, resumeText, jobDescriptionText } = useInterviewStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const personas: PersonaCard[] = [
    {
      id: 'system_design',
      name: 'Sarah',
      role: 'Lead Systems Architect',
      voice: 'Aoede (Feminine)',
      tone: 'Demanding & Analytical',
      description: 'Chief Systems Architect. Focuses on scalability, database tradeoffs, sharding, distributed caches, high availability, and CAP theorem bottlenecks.',
      topics: ['Scalability & Latency', 'Database Sharding/Replica', 'Distributed Caches', 'CAP Theorem', 'Fault Tolerance'],
      colorClass: 'text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50',
      bgGlow: 'bg-indigo-500/5',
      icon: <Database className="w-6 h-6 text-indigo-400" />
    },
    {
      id: 'technical',
      name: 'Alex',
      role: 'Staff Software Engineer',
      voice: 'Fenrir (Masculine)',
      tone: 'Precise & Detailed',
      description: 'Staff Engineer in Core Infrastructure. Probes algorithmic runtime, data structures, Big O, concurrency threads, and clean SOLID structures.',
      topics: ['Big O Complexity', 'Data Structures', 'Concurrency & Locking', 'SOLID Patterns', 'Edge Case Tests'],
      colorClass: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50',
      bgGlow: 'bg-emerald-500/5',
      icon: <Terminal className="w-6 h-6 text-emerald-400" />
    },
    {
      id: 'behavioral',
      name: 'Elena',
      role: 'Engineering Manager',
      voice: 'Kore (Feminine)',
      tone: 'Pragmatic & Empathic',
      description: 'Engineering Manager. Demands structured response utilizing STAR framework. Evaluates action ownership, team conflicts, failures, and timelines.',
      topics: ['STAR Response Pattern', 'Initiative & Leadership', 'Conflict Resolution', 'Pragmatism & Planning', 'Timeline Pressure'],
      colorClass: 'text-violet-400 border-violet-500/20 hover:border-violet-500/50',
      bgGlow: 'bg-violet-500/5',
      icon: <Briefcase className="w-6 h-6 text-violet-400" />
    },
    {
      id: 'hr',
      name: 'David',
      role: 'Talent Acquisition Director',
      voice: 'Puck (Masculine)',
      tone: 'Warm & Probing',
      description: 'Talent Director with 15+ years of experience. Evaluates team collaborations, career vision, adaptability, growth grit, and culture values.',
      topics: ['Culture-fit Alignment', 'Cross-team Operations', 'Resilience & Grit', 'Career Trajectory', 'Growth Mindset'],
      colorClass: 'text-purple-400 border-purple-500/20 hover:border-purple-500/50',
      bgGlow: 'bg-purple-500/5',
      icon: <Users className="w-6 h-6 text-purple-400" />
    }
  ];

  const handleSelectPersona = async (personaId: string) => {
    setLoadingId(personaId);
    try {
      // Start the interview session in the backend using the cached candidate details
      const response = await api.startInterview({
        type: personaId,
        experienceLevel,
        resumeText: resumeText || undefined,
        jobDescriptionText: jobDescriptionText || undefined
      });

      // Redirect directly to the interview room
      router.push(`/interview-room/${response.session.id}`);
    } catch (error) {
      console.error('Failed to create interview session:', error);
      alert('Error initializing interview session. Please try again.');
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between py-12 px-6">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto relative z-10 flex-1 flex flex-col justify-center space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
          <div className="space-y-1 text-center sm:text-left">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Select Your Interviewer</h1>
            <p className="text-sm text-neutral-400">Choose a track persona to conduct your mock session. Dynamic VAD voice interaction will start immediately.</p>
          </div>
        </div>

        {/* Personas Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {personas.map((persona) => {
            const isLoading = loadingId === persona.id;
            return (
              <div 
                key={persona.id}
                onClick={() => !loadingId && handleSelectPersona(persona.id)}
                className={`glass-card p-6 md:p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                  loadingId ? 'opacity-60 cursor-not-allowed' : 'glass-card-hover'
                } ${persona.colorClass}`}
              >
                {/* Background glow hover */}
                <div className={`absolute inset-0 ${persona.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                      {persona.icon}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                      Voice: {persona.voice}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {persona.name}
                    </h3>
                    <p className="text-xs font-semibold text-neutral-400">
                      {persona.role} • <span className="italic">{persona.tone}</span>
                    </p>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed pt-2">
                    {persona.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-2">Key Areas assessed:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="bg-white/[0.03] border border-white/[0.06] text-[10px] text-neutral-400 px-2.5 py-1 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 relative z-10 flex items-center justify-end">
                  <button 
                    disabled={!!loadingId}
                    className="inline-flex items-center justify-center gap-1.5 bg-white text-neutral-950 font-semibold px-4 py-2.5 rounded-xl hover:bg-neutral-200 text-xs shadow-lg shadow-white/5 transition-transform active:scale-[0.97]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        Start Session
                        <Play className="w-3 h-3 fill-current" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <footer className="w-full border-t border-white/[0.05] py-6 text-center text-xs text-neutral-600 mt-20">
        <span>© {new Date().getFullYear()} Intrvyu AI. Select Persona.</span>
      </footer>
    </div>
  );
}
