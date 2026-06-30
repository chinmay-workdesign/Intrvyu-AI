'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, ArrowRight, Shield, Award, Brain, Volume2, Activity, Star } from 'lucide-react';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <div className="min-h-screen grid-pattern relative flex flex-col justify-between overflow-x-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/[0.05] relative z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-xl tracking-tight text-white">Intrvyu AI</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="text-sm font-medium bg-white text-neutral-950 hover:bg-neutral-200 transition-all px-4 py-2 rounded-xl shadow-lg shadow-white/5 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 text-center relative z-10 pt-16 pb-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-2 bg-neutral-900 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-indigo-400"
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Gemini Live Voice API Powered
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] md:leading-[1.05]"
          >
            Master Your Next Interview.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              Spoken Voice, In Real-Time.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-base md:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed"
          >
            Talk face-to-voice with professional AI interviewers. No chat logs, no predefined questions. Dynamic difficulty scaling, STAR evaluation rubrics, and detailed reports.
          </motion.p>

          {/* Actions */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            <Link 
              href="/signup" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35 active:scale-[0.98] transition-all"
            >
              Start Free Mock Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900/60 border border-white/10 hover:bg-neutral-900 text-neutral-300 font-medium px-8 py-4 rounded-2xl transition-all"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* Dynamic Canvas Visualizer Placeholder Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="mt-20 w-full max-w-4xl glass-card rounded-3xl p-6 md:p-10 border border-white/[0.08] shadow-2xl relative"
        >
          {/* Glowing border effects */}
          <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Volume2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Natural Speech Interactivity</h3>
                <p className="text-sm text-neutral-400">Interrupt the interviewer naturally when you have something to add.</p>
              </div>
            </div>
            
            {/* Visual Ripple effect */}
            <div className="flex items-center gap-1.5 h-12">
              <div className="w-1.5 bg-indigo-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 bg-indigo-400 rounded-full animate-wave-bar" style={{ animationDelay: '0.3s' }} />
              <div className="w-1.5 bg-indigo-300 rounded-full animate-wave-bar" style={{ animationDelay: '0.5s' }} />
              <div className="w-1.5 bg-violet-400 rounded-full animate-wave-bar" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 bg-violet-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.4s' }} />
              <div className="w-1.5 bg-purple-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.6s' }} />
            </div>
          </div>
        </motion.div>

        {/* Core Value Props Grid */}
        <section className="mt-32 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl border border-white/[0.05] text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">LangGraph Pipeline</h3>
            <p className="text-sm text-neutral-400">A dynamic state-machine tracks coverage, manages topic progression, and dynamically adjustments difficulty based on answer scores.</p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-white/[0.05] text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">STAR Framework Metrics</h3>
            <p className="text-sm text-neutral-400">Behavioral reviews evaluate Situations, Actions, and Results, helping you structure response patterns matching tech benchmarks.</p>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-white/[0.05] text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Feedback Score Cards</h3>
            <p className="text-sm text-neutral-400">Receive comprehensive post-interview feedback outlining strengths, weaknesses, an action plan, and text quotes review.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/[0.05] text-center text-xs text-neutral-500 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Intrvyu AI. Built for next-generation interview training.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
