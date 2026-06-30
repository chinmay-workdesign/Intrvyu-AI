import { create } from 'zustand';

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'staff';

interface InterviewState {
  experienceLevel: ExperienceLevel;
  resumeText: string;
  jobDescriptionText: string;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setResumeText: (text: string) => void;
  setJobDescriptionText: (text: string) => void;
  hydrateConfig: () => void;
}

export const useInterviewStore = create<InterviewState>((set) => ({
  experienceLevel: 'senior',
  resumeText: '',
  jobDescriptionText: '',
  setExperienceLevel: (experienceLevel) => {
    localStorage.setItem('intrvyu_exp_level', experienceLevel);
    set({ experienceLevel });
  },
  setResumeText: (resumeText) => {
    localStorage.setItem('intrvyu_resume_text', resumeText);
    set({ resumeText });
  },
  setJobDescriptionText: (jobDescriptionText) => {
    localStorage.setItem('intrvyu_jd_text', jobDescriptionText);
    set({ jobDescriptionText });
  },
  hydrateConfig: () => {
    try {
      const experienceLevel = localStorage.getItem('intrvyu_exp_level') as ExperienceLevel | null;
      const resumeText = localStorage.getItem('intrvyu_resume_text');
      const jobDescriptionText = localStorage.getItem('intrvyu_jd_text');

      if (experienceLevel) set({ experienceLevel });
      if (resumeText) set({ resumeText });
      if (jobDescriptionText) set({ jobDescriptionText });
    } catch (e) {
      console.error('Failed to hydrate interview store config', e);
    }
  }
}));
