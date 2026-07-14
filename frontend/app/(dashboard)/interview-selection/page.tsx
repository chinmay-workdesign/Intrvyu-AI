'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '../../../store/interviewStore';
import { api } from '../../../services/api';
import { 
  Mic, 
  ArrowLeft, 
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
  code: string;
  voice: string;
  tone: string;
  description: string;
  topics: string[];
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
      code: 'SYS-DESIGN / SR-902',
      voice: 'aoede (feminine)',
      tone: 'demanding & analytical',
      description: 'Chief Systems Architect. Focuses on scalability, database tradeoffs, sharding, distributed caches, high availability, and CAP theorem bottlenecks.',
      topics: ['Scalability & Latency', 'Database Sharding/Replica', 'Distributed Caches', 'CAP Theorem', 'Fault Tolerance'],
      icon: <Database className="w-5 h-5 text-accent" />
    },
    {
      id: 'technical',
      name: 'Alex',
      role: 'Staff Software Engineer',
      code: 'CORE-INFRA / AX-104',
      voice: 'fenrir (masculine)',
      tone: 'precise & detailed',
      description: 'Staff Engineer in Core Infrastructure. Probes algorithmic runtime, data structures, Big O complexity, concurrency threads, and clean SOLID structures.',
      topics: ['Big O Complexity', 'Data Structures', 'Concurrency & Locking', 'SOLID Patterns', 'Edge Case Tests'],
      icon: <Terminal className="w-5 h-5 text-accent" />
    },
    {
      id: 'behavioral',
      name: 'Elena',
      role: 'Engineering Manager',
      code: 'ENG-MGMNT / EL-411',
      voice: 'kore (feminine)',
      tone: 'pragmatic & empathic',
      description: 'Engineering Manager. Demands structured response utilizing STAR framework. Evaluates action ownership, team conflicts, failures, and timelines.',
      topics: ['STAR Response Pattern', 'Initiative & Leadership', 'Conflict Resolution', 'Pragmatism & Planning', 'Timeline Pressure'],
      icon: <Briefcase className="w-5 h-5 text-accent" />
    },
    {
      id: 'hr',
      name: 'David',
      role: 'Talent Acquisition Director',
      code: 'TALENT-ACQ / DV-730',
      voice: 'puck (masculine)',
      tone: 'warm & probing',
      description: 'Talent Director with 15+ years of experience. Evaluates team collaborations, career vision, adaptability, growth grit, and culture values.',
      topics: ['Culture-fit Alignment', 'Cross-team Operations', 'Resilience & Grit', 'Career Trajectory', 'Growth Mindset'],
      icon: <Users className="w-5 h-5 text-accent" />
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
    <div className="min-h-screen bg-base text-txt-primary flex flex-col justify-between py-12 px-6">
      <div className="w-full max-w-6xl mx-auto relative z-10 flex-1 flex flex-col justify-center space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="space-y-1 text-center sm:text-left">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-txt-secondary hover:text-txt-primary transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-display font-semibold text-txt-primary tracking-tight">Select Your Interviewer</h1>
            <p className="text-xs text-txt-secondary max-w-xl">
              Choose a track persona to conduct your mock session. Dynamic voice interaction will start immediately.
            </p>
          </div>
        </div>

        {/* Personas Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {personas.map((persona) => {
            const isLoading = loadingId === persona.id;
            return (
              <div 
                key={persona.id}
                onClick={() => !loadingId && handleSelectPersona(persona.id)}
                className={`flat-card p-6 md:p-8 rounded-xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                  loadingId ? 'opacity-40 cursor-not-allowed' : 'hover:border-accent/40'
                }`}
              >
                <div className="space-y-5 relative z-10">
                  {/* Top card bar */}
                  <div className="flex items-center justify-between border-b border-hairline pb-3">
                    <span className="text-[10px] font-mono text-accent font-semibold tracking-wider">
                      {persona.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-widest">
                        voice: {persona.voice}
                      </span>
                      {persona.icon}
                    </div>
                  </div>

                  {/* Persona details */}
                  <div className="space-y-1">
                    <h3 className="text-xl font-display font-semibold text-txt-primary tracking-tight">
                      {persona.name}
                    </h3>
                    <p className="text-xs font-mono text-txt-secondary uppercase tracking-tight">
                      {persona.role} · <span className="text-accent">{persona.tone}</span>
                    </p>
                  </div>

                  <p className="text-xs md:text-sm text-txt-secondary leading-relaxed pt-1">
                    {persona.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-wider block mb-2 font-bold">Key Areas Assessed:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="bg-base border border-hairline text-[10px] text-txt-secondary px-2.5 py-0.5 rounded font-mono"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-6 relative z-10 flex items-center justify-end">
                  <button 
                    disabled={!!loadingId}
                    className="inline-flex items-center justify-center gap-1.5 bg-accent text-base font-semibold px-4 py-2 rounded text-xs hover:bg-opacity-95 transition-all active:scale-[0.98]"
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

      <footer className="w-full border-t border-hairline py-6 text-center text-[10px] text-txt-secondary mt-20">
        <span>© {new Date().getFullYear()} Intrvyu AI. Select Persona.</span>
      </footer>
    </div>
  );
}
