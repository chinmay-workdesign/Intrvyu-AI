import { prisma } from '../db/prisma.js';
import { PERSONAS } from '../graph/prompts/prompts.js';
import { runGraphPipeline, triggerAsyncFeedbackGeneration } from '../graph/graphEngine.js';
// Helper to call Gemini REST API for text responses (Live audio conversation is handled via WebSockets)
async function generateSpeechResponse(prompt, systemPrompt, voiceName) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        }
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini REST API Error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text, audioBase64: '' };
}
// Helper to transcribe candidate audio using Gemini
async function transcribeAudio(audioBuffer, mimeType) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const base64Audio = audioBuffer.toString('base64');
    const cleanMime = mimeType.split(';')[0].trim();
    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        inlineData: {
                            mimeType: cleanMime, // e.g. audio/webm or audio/wav
                            data: base64Audio
                        }
                    },
                    {
                        text: 'Transcribe what was said in the audio clip precisely. Do not add any filler text, headers, explanations, or commentary. Output only the verbatim transcription.'
                    }
                ]
            }
        ]
    };
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Transcription Error (${response.status}): ${errorText}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : '';
}
export async function startInterview(req, res) {
    try {
        const { type, experienceLevel, resumeText, jobDescriptionText } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        if (!type || !experienceLevel) {
            return res.status(400).json({ error: 'Interview type and experience level are required.' });
        }
        const persona = PERSONAS[type];
        if (!persona) {
            return res.status(400).json({ error: 'Invalid interview type.' });
        }
        // Initialize coverage map
        const coverage = {};
        persona.topics.forEach(topic => {
            coverage[topic] = 'not_started';
        });
        const currentTopic = persona.topics[0];
        coverage[currentTopic] = 'probing';
        // Create initial state
        const session = await prisma.interviewSession.create({
            data: {
                userId,
                type,
                experienceLevel,
                resumeText,
                jobDescriptionText,
                currentTopic,
                difficulty: 3,
                coverage,
                scores: {
                    communication: 0,
                    technicalDepth: 0,
                    problemSolving: 0,
                    confidence: 0,
                    starFrameworkScore: 0,
                    leadershipScore: 0,
                    behavioralScore: 0
                },
                timeRemaining: 1200, // 20 minutes
                status: 'ongoing'
            }
        });
        // Generate initial greeting
        const prompt = `You are starting a mock interview. Introduce yourself, state your role (${persona.role}), name (${persona.name}), and ask the first question regarding the first topic: "${currentTopic}". Experience Level: ${experienceLevel}. Keep it brief, conversational, and direct.`;
        const greetingResponse = await generateSpeechResponse(prompt, persona.systemPrompt, persona.voice);
        // Save initial interviewer greeting message
        await prisma.conversationMessage.create({
            data: {
                sessionId: session.id,
                speaker: 'INTERVIEWER',
                text: greetingResponse.text
            }
        });
        return res.status(201).json({
            session,
            message: {
                text: greetingResponse.text,
                audioBase64: greetingResponse.audioBase64
            }
        });
    }
    catch (error) {
        console.error('Start Interview Error:', error);
        return res.status(500).json({ error: 'Failed to start interview session.' });
    }
}
export async function handleMessage(req, res) {
    try {
        const { sessionId } = req.body;
        const file = req.file;
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }
        if (!file) {
            return res.status(400).json({ error: 'Audio file is required.' });
        }
        // Load session
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            include: { messages: true }
        });
        if (!session || session.status !== 'ongoing') {
            return res.status(400).json({ error: 'Interview session not found or already closed.' });
        }
        // 1. Transcribe Candidate Audio
        const mimeType = file.mimetype || 'audio/webm';
        console.log(`[Audio Upload] Transcribing clip: ${mimeType}, size: ${file.size} bytes`);
        const candidateText = await transcribeAudio(file.buffer, mimeType);
        if (!candidateText) {
            return res.status(400).json({ error: 'Could not transcribe speech. Please speak clearly.' });
        }
        // Save candidate message
        const candidateMsg = await prisma.conversationMessage.create({
            data: {
                sessionId,
                speaker: 'CANDIDATE',
                text: candidateText
            }
        });
        // 2. Prepare LangGraph State
        const transcript = session.messages.map(m => ({
            speaker: m.speaker,
            text: m.text,
            timestamp: m.createdAt
        }));
        transcript.push({
            speaker: 'CANDIDATE',
            text: candidateText,
            timestamp: candidateMsg.createdAt
        });
        const lastInterviewerMsg = session.messages.filter(m => m.speaker === 'INTERVIEWER').pop();
        const graphState = {
            sessionId,
            interviewType: session.type,
            experienceLevel: session.experienceLevel,
            resumeText: session.resumeText || undefined,
            jobDescriptionText: session.jobDescriptionText || undefined,
            currentTopic: session.currentTopic,
            difficulty: session.difficulty,
            coverage: session.coverage,
            transcript,
            scores: session.scores,
            timeRemaining: session.timeRemaining,
            status: session.status,
            nextAction: 'ask_question',
            lastInterviewerResponse: lastInterviewerMsg?.text,
            lastCandidateResponse: candidateText
        };
        // 3. Execute LangGraph pipeline
        const updatedState = await runGraphPipeline(graphState);
        // Save last evaluation metrics in candidate message
        if (updatedState.lastEvaluation) {
            await prisma.conversationMessage.update({
                where: { id: candidateMsg.id },
                data: {
                    evaluation: updatedState.lastEvaluation
                }
            });
        }
        // 4. Generate Interviewer Speech Response
        const persona = PERSONAS[session.type];
        // Construct instructions based on LangGraph output
        let dynamicInstructions = '';
        if (updatedState.nextAction === 'close_interview') {
            dynamicInstructions = 'The interview duration is complete. Conclude the interview warmly and professionally. Do not ask any more questions.';
        }
        else if (updatedState.nextAction === 'follow_up') {
            const isWeak = updatedState.lastEvaluation?.isWeak;
            const isIncorrect = updatedState.lastEvaluation?.isIncorrect;
            if (isWeak) {
                dynamicInstructions = `The candidate's response on topic "${updatedState.currentTopic}" was vague or incomplete. Politely ask a probing follow-up question asking them to elaborate.`;
            }
            else if (isIncorrect) {
                dynamicInstructions = `The candidate's response on topic "${updatedState.currentTopic}" was incorrect or flawed. Politely challenge their assertion and ask them to explain their reasoning.`;
            }
            else {
                dynamicInstructions = `The candidate gave an interesting response on topic "${updatedState.currentTopic}". Ask a deeper follow-up question to dig into the details.`;
            }
        }
        else {
            // ask_question (next topic)
            dynamicInstructions = `Transition smoothly and ask a new question about the next topic: "${updatedState.currentTopic}". Target difficulty: level ${updatedState.difficulty} out of 5.`;
        }
        const nextInterviewerPrompt = `
Conversation History:
${updatedState.transcript.slice(-4).map(m => `${m.speaker}: ${m.text}`).join('\n')}

LangGraph Instruction: ${dynamicInstructions}
Generate the next natural response. Keep it conversational, brief (1-3 sentences), and do not use headers, placeholders or lists. Speak directly.
`;
        const interviewerResponse = await generateSpeechResponse(nextInterviewerPrompt, persona.systemPrompt, persona.voice);
        // Save interviewer message
        await prisma.conversationMessage.create({
            data: {
                sessionId,
                speaker: 'INTERVIEWER',
                text: interviewerResponse.text
            }
        });
        // Update Session
        const updatedSession = await prisma.interviewSession.update({
            where: { id: sessionId },
            data: {
                currentTopic: updatedState.currentTopic,
                difficulty: updatedState.difficulty,
                coverage: updatedState.coverage,
                scores: updatedState.scores,
                status: updatedState.nextAction === 'close_interview' ? 'completed' : 'ongoing',
                timeRemaining: Math.max(0, session.timeRemaining - 60) // decrement 60s per exchange
            }
        });
        // If completed, trigger async feedback report generation
        if (updatedSession.status === 'completed') {
            triggerAsyncFeedbackGeneration(sessionId);
        }
        return res.json({
            session: updatedSession,
            candidateText,
            message: {
                text: interviewerResponse.text,
                audioBase64: interviewerResponse.audioBase64
            }
        });
    }
    catch (error) {
        console.error('Handle Message Error:', error);
        return res.status(500).json({ error: 'Failed to process message.' });
    }
}
// End interview session and generate report card
export async function endInterview(req, res) {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required.' });
        }
        const session = await prisma.interviewSession.findUnique({
            where: { id: sessionId },
            include: { messages: true }
        });
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        // Update status to completed
        const updatedSession = await prisma.interviewSession.update({
            where: { id: sessionId },
            data: { status: 'completed' }
        });
        // Generate feedback report
        const feedback = await triggerAsyncFeedbackGeneration(sessionId);
        return res.json({
            session: updatedSession,
            feedback
        });
    }
    catch (error) {
        console.error('End Interview Error:', error);
        return res.status(500).json({ error: 'Failed to end interview session.' });
    }
}
// Background / Helper to build feedback report is now imported from graphEngine.ts
export async function getSessions(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized.' });
        const sessions = await prisma.interviewSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { feedbackReport: true }
        });
        return res.json(sessions);
    }
    catch (error) {
        console.error('Get Sessions Error:', error);
        return res.status(500).json({ error: 'Failed to retrieve sessions.' });
    }
}
export async function getFeedback(req, res) {
    try {
        const { id } = req.params;
        const feedback = await prisma.feedbackReport.findUnique({
            where: { sessionId: id },
            include: {
                session: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            }
        });
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback report not found.' });
        }
        return res.json(feedback);
    }
    catch (error) {
        console.error('Get Feedback Error:', error);
        return res.status(500).json({ error: 'Failed to retrieve feedback report.' });
    }
}
export async function getProfile(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized.' });
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, createdAt: true }
        });
        const analytics = await prisma.interviewAnalytics.findUnique({
            where: { userId }
        });
        return res.json({ user, analytics });
    }
    catch (error) {
        console.error('Get Profile Error:', error);
        return res.status(500).json({ error: 'Failed to retrieve profile data.' });
    }
}
