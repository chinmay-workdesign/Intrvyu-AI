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
  Settings, 
  User, 
  LogOut, 
  Plus, 
  TrendingUp, 
  Award, 
  Clock, 
  History,
  FileText,
  Calendar,
  MessageSquare,
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

    const size = 300;
    const center = size / 2;
    const radius = 100;
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
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines and Labels */}
        {keys.map((key, index) => {
          const angle = (Math.PI * 2 / keys.length) * index - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          const labelX = center + (radius + 24) * Math.cos(angle);
          const labelY = center + (radius + 14) * Math.sin(angle);

          return (
            <g key={index}>
              {/* Line from center to edge */}
              <line
                x1={center}
                y1={center}
                x2={endX}
                y2={endY}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1.5"
              />
              {/* Text label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10"
                fill="rgba(255, 255, 255, 0.4)"
                fontWeight="500"
                className="select-none"
              >
                {key}
              </text>
            </g>
          );
        })}

        {/* Competency score polygon */}
        <polygon
          points={points.join(' ')}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="rgba(99, 102, 241, 0.85)"
          strokeWidth="2"
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* Navigation bar */}
      <header className="w-full border-b border-white/[0.05] bg-neutral-950/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">Intrvyu AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/profile-setup"
              className="p-2 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-colors"
              title="Edit Profile"
            >
              <User className="w-4 h-4" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/10 text-neutral-400 hover:text-red-400 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-transparent border border-white/[0.05] p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none" />
          
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome Back, {user?.name || 'Developer'}!
            </h2>
            <p className="text-sm text-neutral-400 max-w-lg leading-relaxed">
              Track your prep metrics, review feedback from mock runs, and challenge yourself with different interviewer personas.
            </p>
          </div>

          <Link
            href="/interview-selection"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all cursor-pointer hover:shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            New Mock Interview
          </Link>
        </section>

        {/* Analytics Highlights Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/[0.05] flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Average Score</span>
              <span className="text-2xl font-bold text-white">{analytics?.averageScore || 0}%</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/[0.05] flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Sessions Practiced</span>
              <span className="text-2xl font-bold text-white">{analytics?.sessionsCount || 0} Runs</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/[0.05] flex items-center gap-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Time Invested</span>
              <span className="text-2xl font-bold text-white">{formatTime(analytics?.timeSpent || 0)}</span>
            </div>
          </div>
        </section>

        {/* Visual Charts Layout */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="glass-card p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Competency Radar</h3>
              <p className="text-xs text-neutral-400 mb-6">Aggregated score categories breakdown.</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {profileLoading ? (
                <div className="h-64 flex items-center justify-center text-neutral-500 text-sm">Loading visualizers...</div>
              ) : (
                renderRadarChart()
              )}
            </div>
          </div>

          {/* Historical Trends */}
          <div className="glass-card p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">Progress Trends</h3>
              <p className="text-xs text-neutral-400">Score trajectories over mock session iterations.</p>
            </div>
            <div className="flex-1 flex flex-col justify-center min-h-[260px] pt-8">
              {profileLoading ? (
                <div className="text-center text-sm text-neutral-500">Loading charts...</div>
              ) : analytics?.scoreTrends && JSON.parse(JSON.stringify(analytics.scoreTrends)).length > 0 ? (
                <div className="w-full flex items-end justify-between h-40 px-4 border-b border-white/10 relative">
                  {/* Dynamic Trend Bars */}
                  {(JSON.parse(JSON.stringify(analytics.scoreTrends)) as { date: string; score: number }[]).slice(-8).map((trend, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group cursor-help relative z-10">
                      {/* Tooltip */}
                      <span className="absolute bottom-full mb-2 bg-neutral-900 border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {trend.score}% ({trend.date})
                      </span>
                      <div 
                        style={{ height: `${trend.score}%` }}
                        className="w-8 max-w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center space-y-2 py-10">
                  <TrendingUp className="w-8 h-8 text-neutral-600 mx-auto" />
                  <p className="text-sm text-neutral-500">No score trend metrics compiled yet. Complete your first session.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Previous session history */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <History className="w-5 h-5 text-indigo-400" />
            <h3>Previous Mock Runs</h3>
          </div>

          {sessionsLoading ? (
            <div className="glass-card rounded-2xl p-10 text-center text-sm text-neutral-500">
              Retrieving session indexes...
            </div>
          ) : sessions.length > 0 ? (
            <div className="glass-card rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.01]">
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Interviewer Track</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Seniority</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {sessions.map((sess: any) => (
                      <tr key={sess.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-neutral-300 font-medium whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            {new Date(sess.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white font-semibold whitespace-nowrap">
                          <span className="capitalize">{sess.type.replace('_', ' ')}</span>
                        </td>
                        <td className="px-6 py-4 text-neutral-400 capitalize whitespace-nowrap">{sess.experienceLevel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sess.feedbackReport ? (
                            <span className="inline-flex items-center bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                              {sess.feedbackReport.overallScore}%
                            </span>
                          ) : (
                            <span className="text-neutral-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sess.status === 'completed' ? (
                            <span className="text-green-400 text-xs font-medium">Completed</span>
                          ) : (
                            <span className="text-amber-400 text-xs font-medium">Incomplete</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {sess.status === 'completed' ? (
                            <Link 
                              href={`/feedback/${sess.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Report Card
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <Link 
                              href={`/interview-room/${sess.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
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
            <div className="glass-card rounded-2xl border border-white/[0.08] py-16 text-center space-y-4">
              <History className="w-10 h-10 text-neutral-600 mx-auto" />
              <div className="space-y-1">
                <p className="font-bold text-white text-base">No Mock Interview Logs</p>
                <p className="text-sm text-neutral-400 max-w-sm mx-auto">
                  You haven&apos;t run any AI interview practice runs yet. Start a session now.
                </p>
              </div>
              <Link
                href="/interview-selection"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg active:scale-95 transition-transform"
              >
                Start First Session
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.05] py-6 text-center text-xs text-neutral-600 mt-20">
        <span>© {new Date().getFullYear()} Intrvyu AI. Full-Stack Practice Platform.</span>
      </footer>
    </div>
  );
}
