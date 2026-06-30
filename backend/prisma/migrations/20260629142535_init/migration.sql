-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL,
    "resumeText" TEXT,
    "jobDescriptionText" TEXT,
    "currentTopic" TEXT NOT NULL DEFAULT '',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "coverage" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "scores" JSONB NOT NULL DEFAULT '{"communication": 0, "technicalDepth": 0, "problemSolving": 0, "confidence": 0}',
    "timeRemaining" INTEGER NOT NULL DEFAULT 1200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "audioUrl" TEXT,
    "evaluation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "technicalDepthScore" DOUBLE PRECISION NOT NULL,
    "problemSolvingScore" DOUBLE PRECISION NOT NULL,
    "starFrameworkScore" DOUBLE PRECISION NOT NULL,
    "leadershipScore" DOUBLE PRECISION NOT NULL,
    "behavioralScore" DOUBLE PRECISION NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "areasToImprove" JSONB NOT NULL,
    "actionPlan" JSONB NOT NULL,
    "transcriptEvidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedbackReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "scoreTrends" JSONB NOT NULL DEFAULT '[]',
    "competencies" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FeedbackReport_sessionId_key" ON "FeedbackReport"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnalytics_userId_key" ON "InterviewAnalytics"("userId");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackReport" ADD CONSTRAINT "FeedbackReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnalytics" ADD CONSTRAINT "InterviewAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
