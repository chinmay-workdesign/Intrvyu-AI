import { PERSONAS, EVALUATION_SYSTEM_PROMPT, FEEDBACK_REPORT_PROMPT } from './prompts/prompts.js';
import { generateJSON } from '../services/geminiService.js';
import { prisma } from '../db/prisma.js';
/**
 * Node 1: Evaluation Node
 * Evaluates the candidate's last response.
 */
export async function evaluationNode(state) {
    if (!state.lastCandidateResponse || !state.lastInterviewerResponse) {
        return state;
    }
    const prompt = `
Interviewer's Question: "${state.lastInterviewerResponse}"
Candidate's Answer: "${state.lastCandidateResponse}"
Conversation History so far:
${state.transcript.map(m => `${m.speaker}: ${m.text}`).join('\n')}

Please evaluate the candidate's answer. Target Role Level: ${state.experienceLevel}.
`;
    try {
        const evaluation = await generateJSON(prompt, EVALUATION_SYSTEM_PROMPT);
        state.lastEvaluation = evaluation;
        // Accumulate running scores (rolling average)
        const count = state.transcript.filter(t => t.speaker === 'CANDIDATE').length || 1;
        state.scores.communication = Math.round((((state.scores.communication || 0) * (count - 1)) + evaluation.communication) / count * 10) / 10;
        state.scores.technicalDepth = Math.round((((state.scores.technicalDepth || 0) * (count - 1)) + evaluation.technicalDepth) / count * 10) / 10;
        state.scores.problemSolving = Math.round((((state.scores.problemSolving || 0) * (count - 1)) + evaluation.problemSolving) / count * 10) / 10;
        state.scores.confidence = Math.round((((state.scores.confidence || 0) * (count - 1)) + evaluation.confidence) / count * 10) / 10;
        if (state.interviewType === 'behavioral') {
            state.scores.starFrameworkScore = Math.round((((state.scores.starFrameworkScore || 0) * (count - 1)) + (evaluation.starFrameworkScore || 5)) / count * 10) / 10;
            state.scores.leadershipScore = Math.round((((state.scores.leadershipScore || 0) * (count - 1)) + (evaluation.leadershipScore || 5)) / count * 10) / 10;
            state.scores.behavioralScore = Math.round((((state.scores.behavioralScore || 0) * (count - 1)) + (evaluation.behavioralScore || 5)) / count * 10) / 10;
        }
    }
    catch (error) {
        console.error('Error in evaluationNode:', error);
        // Fallback default evaluation if LLM fails
        state.lastEvaluation = {
            communication: 6,
            technicalDepth: 6,
            problemSolving: 6,
            confidence: 6,
            feedback: 'Could not generate detailed evaluation due to an API timeout.',
            alignment: 'Relevant',
            isWeak: false,
            isExcellent: false,
            isIncorrect: false,
            isRepeated: false
        };
    }
    return state;
}
/**
 * Node 2: Difficulty Adjustment Node
 * Adjusts difficulty parameter based on performance scores.
 */
export async function difficultyAdjustmentNode(state) {
    if (!state.lastEvaluation)
        return state;
    const { communication, technicalDepth, problemSolving } = state.lastEvaluation;
    const avg = (communication + technicalDepth + problemSolving) / 3;
    if (avg >= 8.0 && state.difficulty < 5) {
        state.difficulty += 1;
        console.log(`[Difficulty Adjustment] Increasing difficulty to ${state.difficulty}`);
    }
    else if (avg <= 4.5 && state.difficulty > 1) {
        state.difficulty -= 1;
        console.log(`[Difficulty Adjustment] Decreasing difficulty to ${state.difficulty}`);
    }
    return state;
}
/**
 * Node 3: Coverage Tracker Node
 * Updates the topic coverage map.
 */
export async function coverageTrackerNode(state) {
    const currentTopic = state.currentTopic;
    if (!currentTopic || !state.lastEvaluation)
        return state;
    // If topic is not started, mark it as probing
    if (!state.coverage[currentTopic] || state.coverage[currentTopic] === 'not_started') {
        state.coverage[currentTopic] = 'probing';
    }
    else if (state.coverage[currentTopic] === 'probing' && !state.lastEvaluation.isWeak) {
        // If we've probed and the user has given a non-weak response, consider this topic covered
        state.coverage[currentTopic] = 'completed';
    }
    return state;
}
/**
 * Node 4: Follow-up Decision Node
 * Decides whether to follow up or move on.
 */
export async function followUpDecisionNode(state) {
    if (!state.lastEvaluation) {
        state.nextAction = 'ask_question';
        return state;
    }
    const currentTopic = state.currentTopic;
    const topicCoverage = state.coverage[currentTopic];
    // Force follow-up if answer is weak, incorrect, or interesting (isExcellent)
    if (state.lastEvaluation.isWeak || state.lastEvaluation.isIncorrect) {
        state.nextAction = 'follow_up';
        console.log(`[Follow-up Decision] Vague/incorrect answer. Deciding follow_up on topic: ${currentTopic}`);
    }
    else if (state.lastEvaluation.isExcellent && topicCoverage !== 'completed') {
        // If excellent but not fully complete, dig deeper to test limits
        state.nextAction = 'follow_up';
        console.log(`[Follow-up Decision] Excellent answer. Deciding follow_up to dig deeper on topic: ${currentTopic}`);
    }
    else {
        state.nextAction = 'ask_question';
        console.log(`[Follow-up Decision] Adequate response. Deciding ask_question (move on)`);
    }
    // Cap the number of follow ups per topic to prevent getting stuck
    const topicMessageCount = state.transcript.filter(m => m.text.toLowerCase().includes(currentTopic.toLowerCase())).length;
    if (topicMessageCount >= 4) {
        state.nextAction = 'ask_question';
        state.coverage[currentTopic] = 'completed';
        console.log(`[Follow-up Decision] Topic limit reached. Forcing transition to next topic.`);
    }
    return state;
}
/**
 * Node 5: Next Question Node
 * Selects the next topic and updates state.
 */
export async function nextQuestionNode(state) {
    if (state.timeRemaining <= 60) {
        state.nextAction = 'close_interview';
        return state;
    }
    if (state.nextAction === 'ask_question') {
        const persona = PERSONAS[state.interviewType];
        const topics = persona.topics;
        // Find the first topic not started or incomplete
        const nextTopic = topics.find(t => !state.coverage[t] || state.coverage[t] === 'not_started');
        if (nextTopic) {
            state.currentTopic = nextTopic;
            state.coverage[nextTopic] = 'probing';
            console.log(`[Next Question] Advancing to topic: ${nextTopic}`);
        }
        else {
            // All topics completed
            state.nextAction = 'close_interview';
            console.log(`[Next Question] All topics assessed. Deciding close_interview`);
        }
    }
    return state;
}
/**
 * Executes the entire node pipeline for a candidate response.
 */
export async function runGraphPipeline(state) {
    let currentState = { ...state };
    // Step 1: Evaluate Answer
    currentState = await evaluationNode(currentState);
    // Step 2: Adjust Difficulty
    currentState = await difficultyAdjustmentNode(currentState);
    // Step 3: Track Coverage
    currentState = await coverageTrackerNode(currentState);
    // Step 4: Decision on follow-up
    currentState = await followUpDecisionNode(currentState);
    // Step 5: Advance topic if moving on
    currentState = await nextQuestionNode(currentState);
    return currentState;
}
/**
 * Calls Gemini to generate the comprehensive feedback report.
 */
export async function generateFeedbackReport(state, jobDescriptionText, resumeText) {
    const transcriptString = state.transcript.map(m => `${m.speaker}: ${m.text}`).join('\n');
    const prompt = `
Interview Type: ${state.interviewType}
Candidate Experience Level: ${state.experienceLevel}
Resume Text: ${resumeText || 'None provided'}
Job Description Text: ${jobDescriptionText || 'None provided'}

Full Interview Transcript:
${transcriptString}
  `;
    return await generateJSON(prompt, FEEDBACK_REPORT_PROMPT);
}
/**
 * Background / Helper to build feedback report
 */
export async function triggerAsyncFeedbackGeneration(sessionId) {
    try {
        // Check if report already exists
        const existing = await prisma.feedbackReport.findUnique({
            where: { sessionId }
        });
        if (existing)
            return existing;
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            include: { messages: true }
        });
        if (!session)
            return null;
        const transcript = session.messages.map(m => ({
            speaker: m.speaker,
            text: m.text,
            timestamp: m.createdAt
        }));
        const dummyState = {
            sessionId,
            interviewType: session.type,
            experienceLevel: session.experienceLevel,
            currentTopic: session.currentTopic,
            difficulty: session.difficulty,
            coverage: session.coverage,
            transcript,
            scores: session.scores,
            timeRemaining: session.timeRemaining,
            status: session.status,
            nextAction: 'close_interview'
        };
        console.log(`[Feedback Generator] Compiling report card for session: ${sessionId}`);
        const reportData = await generateFeedbackReport(dummyState, session.jobDescriptionText || '', session.resumeText || '');
        const report = await prisma.feedbackReport.create({
            data: {
                sessionId,
                overallScore: reportData.overallScore || 70,
                communicationScore: reportData.communicationScore || 70,
                confidenceScore: reportData.confidenceScore || 70,
                technicalDepthScore: reportData.technicalDepthScore || 70,
                problemSolvingScore: reportData.problemSolvingScore || 70,
                starFrameworkScore: reportData.starFrameworkScore || 50,
                leadershipScore: reportData.leadershipScore || 50,
                behavioralScore: reportData.behavioralScore || 50,
                strengths: reportData.strengths || [],
                weaknesses: reportData.weaknesses || [],
                areasToImprove: reportData.areasToImprove || [],
                actionPlan: reportData.actionPlan || [],
                transcriptEvidence: reportData.transcriptEvidence || []
            }
        });
        // Update Analytics for user
        const userAnalytics = await prisma.interviewAnalytics.findUnique({
            where: { userId: session.userId }
        });
        if (userAnalytics) {
            const allReports = await prisma.feedbackReport.findMany({
                where: { session: { userId: session.userId } }
            });
            const avgScore = allReports.reduce((acc, curr) => acc + curr.overallScore, 0) / allReports.length;
            const count = allReports.length;
            const timeSpent = userAnalytics.timeSpent + (1200 - session.timeRemaining);
            const trend = JSON.parse(JSON.stringify(userAnalytics.scoreTrends));
            trend.push({
                date: new Date().toLocaleDateString(),
                score: report.overallScore
            });
            // Update competence radar metrics
            const currentComps = JSON.parse(JSON.stringify(userAnalytics.competencies));
            currentComps['Communication'] = Math.round(allReports.reduce((acc, curr) => acc + curr.communicationScore, 0) / count);
            currentComps['Technical Depth'] = Math.round(allReports.reduce((acc, curr) => acc + curr.technicalDepthScore, 0) / count);
            currentComps['Problem Solving'] = Math.round(allReports.reduce((acc, curr) => acc + curr.problemSolvingScore, 0) / count);
            currentComps['Confidence'] = Math.round(allReports.reduce((acc, curr) => acc + curr.confidenceScore, 0) / count);
            currentComps['Leadership'] = Math.round(allReports.reduce((acc, curr) => acc + curr.leadershipScore, 0) / count);
            await prisma.interviewAnalytics.update({
                where: { userId: session.userId },
                data: {
                    averageScore: Math.round(avgScore * 10) / 10,
                    sessionsCount: count,
                    timeSpent,
                    scoreTrends: trend,
                    competencies: currentComps
                }
            });
        }
        return report;
    }
    catch (error) {
        console.error('Error compiling feedback report:', error);
        return null;
    }
}
