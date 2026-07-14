'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { useInterviewStore } from '../../../store/interviewStore';
import { api } from '../../../services/api';
import { useQuery } from '@tanstack/react-query';
import { 
  Mic, 
  User, 
  LogOut, 
  Plus, 
  TrendingUp, 
  History,
  Calendar,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { hydrateConfig } = useInterviewStore();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('intrvyu_token');
    if (!token) {
      router.push('/login');
    } else {
      hydrateConfig();
    }
  }, [isAuthenticated, router, hydrateConfig]);

  // Fetch Profile & Analytics data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('intrvyu_token'),
  });

  // Fetch past sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.getSessions,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('intrvyu_token'),
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const analytics = profileData?.analytics;
  const sessions = sessionsData || [];

  // Helper to draw custom SVG Radar Chart based on competencies object
  const renderRadarChart = () => {
    const competencies = analytics?.competencies || {
      'Communication': 75,
      'Technical Depth': 80,
      'Problem Solving': 70,
      'Confidence': 85,
      'Leadership': 65
    };

    const keys = Object.keys(competencies);
    if (keys.length === 0) return null;

    const size = 260;
    const center = size / 2;
    const radius = 80;
    const points: string[] = [];

    // Calculate vertex coordinates for the polygon
    keys.forEach((key, index) => {
      const angle = (Math.PI * 2 / keys.length) * index - Math.PI / 2;
      const score = (competencies[key] || 0) / 100;
      const x = center + radius * score * Math.cos(angle);
      const y = center + radius * score * Math.sin(angle);
      points.push(`${x},${y}`);
    });

    return (
      <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        {/* Background Grid Circles */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="#34312A"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines and Labels */}
        {keys.map((key, index) => {
          const angle = (Math.PI * 2 / keys.length) * index - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          const labelX = center + (radius + 20) * Math.cos(angle);
          const labelY = center + (radius + 10) * Math.sin(angle);

          return (
            <g key={index}>
              {/* Line from center to edge */}
              <line
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="#34312A"
                strokeWidth="1"
              />
              {/* Text label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="8"
                fill="#9A968D"
                fontWeight="500"
                fontFamily="var(--font-mono)"
                className="select-none uppercase tracking-wider"
              >
                {key}
              </text>
            </g>
          );
        })}

        {/* Competency score polygon (copper fill/stroke) */}
        <polygon
          points={points.join(' ')}
          fill="rgba(217, 142, 63, 0.12)"
          stroke="#D98E3F"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  // Helper to format practice duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  return (
    <div className="min-h-screen bg-base text-txt-primary flex flex-col justify-between">
      {/* Navigation bar */}
      <header className="w-full border-b border-hairline bg-base sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Mic className="w-4 h-4 text-base" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-txt-primary">Intrvyu AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/profile-setup"
              className="p-2 rounded hover:bg-surface text-txt-secondary hover:text-txt-primary transition-colors"
              title="Edit Profile"
            >
              <User className="w-4 h-4" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 rounded hover:bg-surface text-txt-secondary hover:text-txt-primary transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Welcome Section (Flat card, no gradients) */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 flat-card p-6 md:p-8 rounded-xl relative overflow-hidden bg-surface">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-txt-primary tracking-tight">
              Welcome Back, {user?.name || 'Developer'}!
            </h2>
            <p className="text-xs text-txt-secondary max-w-md leading-relaxed">
              Track your prep metrics, review feedback from mock runs, and challenge yourself with different interviewer personas.
            </p>
          </div>

          <Link
            href="/interview-selection"
            className="inline-flex items-center gap-2 bg-accent text-base font-semibold px-5 py-3 rounded active:scale-[0.98] transition-all hover:bg-opacity-95 text-xs"
          >
            <Plus className="w-4 h-4" />
            New Mock Interview
          </Link>
        </section>

        {/* Analytics Highlights Grid (Differentiated stat weight) */}
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Average Score (Primary Stat Tile: double width) */}
          <div className="sm:col-span-2 flat-card p-6 rounded-xl flex items-center justify-between border-hairline bg-surface relative overflow-hidden">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-8 h-8 text-accent" />
              <div>
                <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-wider block">Average Technical Score</span>
                <span className="text-3xl font-display font-bold text-txt-primary mt-1 block">{analytics?.averageScore || 0}%</span>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[9px] font-mono text-txt-secondary block">BENCHMARK LEVEL</span>
              <span className="text-xs font-mono text-strong uppercase">
                {Number(analytics?.averageScore || 0) >= 80 ? 'L5 Architect' : Number(analytics?.averageScore || 0) >= 60 ? 'L4 Software Eng' : 'Developing'}
              </span>
            </div>
          </div>

          {/* Sessions Completed (Secondary Stat Tile) */}
          <div className="flat-card p-5 rounded-xl flex flex-col justify-between border-hairline bg-surface">
            <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-wider block">Sessions Completed</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-mono font-bold text-txt-primary">{analytics?.sessionsCount || 0}</span>
              <span className="text-[9px] font-mono text-txt-secondary uppercase">runs</span>
            </div>
          </div>

          {/* Practice Time (Secondary Stat Tile) */}
          <div className="flat-card p-5 rounded-xl flex flex-col justify-between border-hairline bg-surface">
            <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-wider block">Total Practice Time</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-mono font-bold text-txt-primary">{formatTime(analytics?.timeSpent || 0)}</span>
            </div>
          </div>
        </section>

        {/* Visual Charts Layout */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="flat-card p-6 rounded-xl border border-hairline flex flex-col justify-between bg-surface">
            <div>
              <h3 className="text-sm font-semibold text-txt-primary font-display">Competency Radar</h3>
              <p className="text-[10px] text-txt-secondary font-mono uppercase tracking-wider mb-4">Aggregated score categories breakdown</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {profileLoading ? (
                <div className="h-64 flex items-center justify-center text-txt-secondary text-xs font-mono">LOADING VISUALIZERS...</div>
              ) : (
                renderRadarChart()
              )}
            </div>
          </div>

          {/* Historical Trends */}
          <div className="flat-card p-6 rounded-xl border border-hairline flex flex-col justify-between bg-surface">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-txt-primary font-display">Progress Trends</h3>
              <p className="text-[10px] text-txt-secondary font-mono uppercase tracking-wider mb-4">Score trajectories over mock session iterations</p>
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[220px] pt-4">
              {profileLoading ? (
                <div className="text-center text-xs font-mono text-txt-secondary">LOADING CHARTS...</div>
              ) : analytics?.scoreTrends && JSON.parse(JSON.stringify(analytics.scoreTrends)).length > 0 ? (
                <div className="w-full flex items-end justify-between h-36 px-4 border-b border-hairline relative">
                  {/* Dynamic Trend Bars */}
                  {(JSON.parse(JSON.stringify(analytics.scoreTrends)) as { date: string; score: number }[]).slice(-8).map((trend, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-help relative z-10">
                      {/* Tooltip */}
                      <span className="absolute bottom-full mb-2 bg-surface border border-hairline px-2 py-1 rounded text-[9px] font-mono text-txt-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.score}% ({trend.date})
                      </span>
                      {/* Sage color flat bars instead of indigo gradients */}
                      <div 
                        style={{ height: `${trend.score}%` }}
                        className="w-7 max-w-full rounded-t bg-strong hover:bg-opacity-80 transition-all"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-2 py-8">
                  <TrendingUp className="w-6 h-6 text-txt-secondary mx-auto opacity-45" />
                  <p className="text-xs text-txt-secondary font-mono">NO SCORE TREND METRICS COMPILED YET</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Previous session history */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary uppercase tracking-wider font-mono">
            <History className="w-4 h-4 text-accent" />
            <h3>Previous Mock Runs</h3>
          </div>

          {sessionsLoading ? (
            <div className="flat-card rounded-xl p-10 text-center text-xs font-mono text-txt-secondary bg-surface">
              RETRIEVING SESSION INDEXES...
            </div>
          ) : sessions.length > 0 ? (
            <div className="flat-card rounded-xl border border-hairline overflow-hidden bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-hairline bg-base/30">
                      <th className="px-6 py-4 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider">Interviewer Track</th>
                      <th className="px-6 py-4 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider">Seniority</th>
                      <th className="px-6 py-4 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {sessions.map((sess: any) => (
                      <tr key={sess.id} className="hover:bg-base/30 transition-colors">
                        <td className="px-6 py-4 text-txt-secondary font-mono whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 opacity-60" />
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-txt-primary font-semibold whitespace-nowrap">
                          <span className="capitalize font-display">{sess.type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-txt-secondary capitalize whitespace-nowrap font-mono">{sess.experienceLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sess.feedbackReport ? (
                            <span className="inline-flex items-center bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-mono text-xs font-semibold">
                              {sess.feedbackReport.overallScore}%
                            </span>
                          ) : (
                            <span className="text-txt-secondary text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sess.status === 'completed' ? (
                            <span className="text-strong text-xs font-semibold font-mono">Completed</span>
                          ) : (
                            <span className="text-weak text-xs font-semibold font-mono">Incomplete</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {sess.status === 'completed' ? (
                            <Link 
                              href={`/feedback/${sess.id}`}
                              className="inline-flex items-center gap-0.5 text-xs font-mono text-accent hover:underline transition-colors"
                            >
                              Report Card
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <Link 
                              href={`/interview-room/${sess.id}`}
                              className="inline-flex items-center gap-0.5 text-xs font-mono text-accent hover:underline transition-colors"
                            >
                              Resume Room
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flat-card rounded-xl border border-hairline py-16 text-center space-y-4 bg-surface">
              <History className="w-8 h-8 text-txt-secondary mx-auto opacity-35" />
              <div className="space-y-1">
                <p className="font-semibold text-txt-primary text-base font-display">No Mock Interview Logs</p>
                <p className="text-xs text-txt-secondary max-w-xs mx-auto leading-relaxed">
                  You haven&apos;t run any AI interview practice runs yet. Start a session now.
                </p>
              </div>
              <Link
                href="/interview-selection"
                className="inline-flex items-center gap-2 bg-accent text-base font-semibold px-4 py-2 rounded active:scale-95 transition-transform text-xs"
              >
                Start First Session
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-hairline py-6 text-center text-[10px] text-txt-secondary mt-20">
        <span>© {new Date().getFullYear()} Intrvyu AI. Practice Platform.</span>
      </footer>
    </div>
  );
}
