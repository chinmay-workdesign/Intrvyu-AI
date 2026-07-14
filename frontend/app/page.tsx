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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  };

  return (
    <div className="min-h-screen grid-pattern relative flex flex-col justify-between overflow-x-hidden bg-base text-txt-primary">

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-hairline relative z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <Mic className="w-4 h-4 text-base" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight text-txt-primary">Intrvyu AI</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-xs font-semibold text-txt-secondary hover:text-txt-primary transition-colors px-4 py-2"
          >
            Log In
          </Link>
          <Link 
            href="/signup" 
            className="text-xs font-semibold bg-accent text-base hover:bg-opacity-90 transition-all px-4 py-2.5 rounded active:scale-[0.98]"
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
            className="inline-flex items-center gap-2 border border-hairline bg-surface px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-accent"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-rec-pulse" />
            gemini-live · duplex audio
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-6xl font-display font-semibold tracking-tight text-txt-primary leading-[1.1] md:leading-[1.05]"
          >
            Master Your Next Interview.<br />
            <span className="text-accent">Spoken Voice, In Real-Time.</span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-sm md:text-base text-txt-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Talk face-to-voice with professional AI interviewer personas. No text logs, no predefined questions. Dynamic difficulty scaling, STAR evaluation rubrics, and detailed evidence reports.
          </motion.p>

          {/* Actions */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link 
              href="/signup" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent text-base font-semibold px-8 py-3.5 rounded hover:bg-opacity-95 active:scale-[0.99] transition-all text-sm"
            >
              Start Free Mock Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface border border-hairline hover:bg-base text-txt-primary font-medium px-8 py-3.5 rounded transition-all text-sm"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* Real dialogue snippet from report */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          className="mt-16 w-full max-w-3xl flat-card rounded-xl p-5 md:p-6 text-left space-y-5 shadow-xl relative"
        >
          {/* Excerpt Header */}
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-live animate-rec-pulse" />
              <span className="text-[10px] font-mono text-txt-secondary uppercase tracking-wider">EVIDENCE EXCERPT · RUN #8129</span>
            </div>
            <span className="text-[10px] font-mono text-accent">SARAH · SYSTEM DESIGN TRACK</span>
          </div>

          {/* Transcript Dialogue */}
          <div className="space-y-4 text-xs md:text-sm">
            {/* Interviewer */}
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-surface border border-hairline flex items-center justify-center text-[10px] font-mono text-accent">
                SR
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-txt-primary">Sarah (Interviewer)</span>
                  <span className="font-mono text-[9px] text-txt-secondary">[00:14:02]</span>
                </div>
                <p className="text-txt-secondary leading-relaxed">
                  "How do you handle a scenario where your distributed cache becomes hot, causing bottleneck latency at the database level?"
                </p>
                {/* Simulated Audio wave motif */}
                <div className="flex gap-0.5 items-center h-2.5 mt-1.5 opacity-40">
                  <span className="w-0.5 h-2 bg-txt-secondary rounded-full" />
                  <span className="w-0.5 h-2.5 bg-txt-secondary rounded-full animate-pulse" />
                  <span className="w-0.5 h-1 bg-txt-secondary rounded-full" />
                  <span className="w-0.5 h-2 bg-txt-secondary rounded-full" />
                  <span className="w-0.5 h-3 bg-txt-secondary rounded-full animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-txt-secondary rounded-full" />
                </div>
              </div>
            </div>

            {/* Candidate */}
            <div className="flex gap-3 items-start pl-6 border-l border-hairline">
              <div className="flex-shrink-0 w-7 h-7 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-[10px] font-mono text-accent">
                C
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-txt-primary">Candidate (You)</span>
                  <span className="font-mono text-[9px] text-txt-secondary">[00:14:18]</span>
                </div>
                <p className="text-txt-primary leading-relaxed">
                  "I&apos;d implement cache lease locks to ensure only one query populates the cache under load, and apply request hedging at the API gateway to mitigate database-level queue build-ups."
                </p>
              </div>
            </div>
          </div>

          {/* Analyst Annotation Box */}
          <div className="border-t border-hairline pt-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-base/50 p-3 rounded">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono text-txt-secondary uppercase tracking-wider block">ANALYST EVALUATION</span>
              <p className="text-xs text-txt-primary font-medium">Strong systems awareness, balanced mitigation tradeoffs.</p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-right">
                <span className="text-[9px] font-mono text-txt-secondary uppercase block">TECH SCORE</span>
                <span className="font-mono text-xs font-bold text-strong">87%</span>
              </div>
              <div className="bg-surface border border-hairline px-2 py-0.5 rounded text-[9px] font-mono text-accent">
                Distributed Cache
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Value Props Grid */}
        <section className="mt-24 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flat-card p-6 rounded-xl text-left space-y-3">
            <Brain className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-txt-primary font-display">LangGraph Pipeline</h3>
            <p className="text-xs text-txt-secondary leading-relaxed">
              A dynamic state-machine tracks coverage, manages topic progression, and dynamically adjusts difficulty based on answer scores.
            </p>
          </div>

          <div className="flat-card p-6 rounded-xl text-left space-y-3">
            <Star className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-txt-primary font-display">STAR Framework Metrics</h3>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Behavioral reviews evaluate Situations, Actions, and Results, helping you structure response patterns matching tech benchmarks.
            </p>
          </div>

          <div className="flat-card p-6 rounded-xl text-left space-y-3">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-txt-primary font-display">Feedback Score Cards</h3>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Receive comprehensive post-interview feedback outlining strengths, weaknesses, an action plan, and text quotes review.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-hairline text-center text-[10px] text-txt-secondary relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Intrvyu AI. Built for next-generation interview training.</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
