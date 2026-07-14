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
    <div className="min-h-screen bg-base text-txt-primary flex flex-col justify-between py-12 px-6">
      <div className="w-full max-w-2xl mx-auto relative z-10 flex-1 flex flex-col justify-center">
        
        <div className="space-y-2 mb-8 text-center md:text-left">
          <h1 className="text-3xl font-display font-semibold text-txt-primary tracking-tight">Set Up Your Profile</h1>
          <p className="text-xs text-txt-secondary leading-relaxed">
            Specify seniority and paste your CV or resume details. The AI uses this data to generate contextually relevant, technical interview queries.
          </p>
        </div>

        <div className="flat-card rounded-xl p-6 md:p-8 bg-surface border-hairline shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Experience level dropdown */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-accent" />
                Target Seniority Level
              </label>
              <select
                {...register('experienceLevel')}
                className="w-full bg-base border border-hairline focus:border-accent rounded px-4 py-2.5 text-xs text-txt-primary outline-none transition-all cursor-pointer font-sans"
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
              <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-accent" />
                Resume / CV Content
              </label>
              <textarea
                placeholder="Paste CV/Resume details (work history, tech stacks, projects)..."
                {...register('resumeText')}
                rows={6}
                className="w-full bg-base border border-hairline focus:border-accent rounded px-4 py-3 text-xs text-txt-primary outline-none transition-all resize-none font-mono leading-relaxed"
              />
            </div>

            {/* Job Description Text Input */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                <Briefcase className="w-3.5 h-3.5 text-accent" />
                Target Job Description (Optional)
              </label>
              <textarea
                placeholder="Paste the target job description to customize topics for the mock session..."
                {...register('jobDescriptionText')}
                rows={4}
                className="w-full bg-base border border-hairline focus:border-accent rounded px-4 py-3 text-xs text-txt-primary outline-none transition-all resize-none text-xs"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-accent text-base font-semibold py-3.5 rounded hover:bg-opacity-95 transition-all active:scale-[0.99] text-xs"
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
