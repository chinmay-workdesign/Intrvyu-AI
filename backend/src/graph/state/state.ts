export interface Message {
  speaker: 'INTERVIEWER' | 'CANDIDATE';
  text: string;
  timestamp: Date;
}

export interface EvaluationMetrics {
  communication: number;      // 1 to 10
  technicalDepth: number;     // 1 to 10
  problemSolving: number;     // 1 to 10
  confidence: number;         // 1 to 10
  starFrameworkScore?: number; // 1 to 10 (behavioral)
  leadershipScore?: number;    // 1 to 10
  behavioralScore?: number;    // 1 to 10
  feedback: string;
  alignment: string;
  isWeak: boolean;
  isExcellent: boolean;
  isIncorrect: boolean;
  isRepeated: boolean;
}

export interface InterviewState {
  sessionId: string;
  interviewType: 'behavioral' | 'technical' | 'system_design' | 'hr';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead' | 'staff';
  resumeText?: string;
  jobDescriptionText?: string;
  currentTopic: string;
  difficulty: number; // 1 to 5
  coverage: Record<string, 'not_started' | 'probing' | 'completed'>;
  transcript: Message[];
  scores: {
    communication: number;
    technicalDepth: number;
    problemSolving: number;
    confidence: number;
    starFrameworkScore: number;
    leadershipScore: number;
    behavioralScore: number;
  };
  timeRemaining: number; // seconds
  status: 'ongoing' | 'completed' | 'paused';
  nextAction: 'ask_question' | 'follow_up' | 'close_interview';
  lastInterviewerResponse?: string;
  lastCandidateResponse?: string;
  lastEvaluation?: EvaluationMetrics;
}
