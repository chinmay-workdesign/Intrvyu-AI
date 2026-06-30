'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useInterviewStore, ExperienceLevel } from '../../../store/interviewStore';
import { useAuthStore } from '../../../store/authStore';
import { User, FileText, Briefcase, ArrowRight } from 'lucide-react';

interface ProfileFormInput {
  experienceLevel: ExperienceLevel;
  resumeText: string;
  jobDescriptionText: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    experienceLevel,
    resumeText,
    jobDescriptionText,
    setExperienceLevel,
    setResumeText,
    setJobDescriptionText,
    hydrateConfig
  } = useInterviewStore();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('intrvyu_token');
    if (!token) {
      router.push('/login');
    } else {
      hydrateConfig();
    }
  }, [isAuthenticated, router, hydrateConfig]);

  const { register, handleSubmit, setValue } = useForm<ProfileFormInput>({
    defaultValues: {
      experienceLevel,
      resumeText,
      jobDescriptionText
    }
  });

  // Prepopulate form values once loaded from Zustand store hydration
  useEffect(() => {
    setValue('experienceLevel', experienceLevel);
    setValue('resumeText', resumeText);
    setValue('jobDescriptionText', jobDescriptionText);
  }, [experienceLevel, resumeText, jobDescriptionText, setValue]);

  const onSubmit = (data: ProfileFormInput) => {
    setExperienceLevel(data.experienceLevel);
    setResumeText(data.resumeText);
    setJobDescriptionText(data.jobDescriptionText);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen grid-pattern relative flex flex-col justify-between py-12 px-6">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto relative z-10 flex-1 flex flex-col justify-center">
        <div className="space-y-2 mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Set Up Your Profile</h1>
          <p className="text-sm text-neutral-400">
            Tell us about your experience, paste your resume details, and add job descriptions. This guides the AI interviewer to generate highly relevant and customized questions.
          </p>
        </div>

        <div className="glass-card rounded-3xl border border-white/[0.08] p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Experience level dropdown */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                <User className="w-4 h-4 text-indigo-400" />
                Target Seniority Level
              </label>
              <select
                {...register('experienceLevel')}
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all cursor-pointer"
              >
                <option value="junior">Junior Software Engineer (1-2 years)</option>
                <option value="mid">Mid-Level Software Engineer (3-5 years)</option>
                <option value="senior">Senior Software Engineer (5+ years)</option>
                <option value="lead">Lead/Staff Engineer (Architectural focus)</option>
                <option value="staff">Principal/Staff (Organizational & Strategy)</option>
              </select>
            </div>

            {/* Resume Text Input */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Resume / CV Content
              </label>
              <textarea
                placeholder="Paste your resume details here (experience, skills, projects, degrees)..."
                {...register('resumeText')}
                rows={6}
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all resize-none font-mono text-xs"
              />
            </div>

            {/* Job Description Text Input */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Target Job Description (Optional)
              </label>
              <textarea
                placeholder="Paste the description of the role you are interviewing for to customize the session topics..."
                {...register('jobDescriptionText')}
                rows={4}
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all resize-none text-xs"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.99] cursor-pointer"
            >
              Save Profile & Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
