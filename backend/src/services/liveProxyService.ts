import WebSocket from 'ws';
import { prisma } from '../db/prisma.js';
import { PERSONAS } from '../graph/prompts/prompts.js';
import { runGraphPipeline, triggerAsyncFeedbackGeneration } from '../graph/graphEngine.js';
import { InterviewState } from '../graph/state/state.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_LIVE_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

export async function handleLiveSession(clientWs: WebSocket, sessionId: string) {
  console.log(`[WS Proxy] Starting live session handler for: ${sessionId}`);

  // 1. Fetch Session from Database
  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { messages: true, user: true }
  });

  if (!session || session.status !== 'ongoing') {
    clientWs.send(JSON.stringify({ error: 'Session not found or already completed.' }));
    clientWs.close();
    return;
  }

  const persona = PERSONAS[session.type];
  if (!persona) {
    clientWs.send(JSON.stringify({ error: 'Invalid session type.' }));
    clientWs.close();
    return;
  }

  // 2. Connect to Google Gemini Live API
  console.log(`[WS Proxy] Connecting to Gemini Live API...`);
  const geminiWs = new WebSocket(GEMINI_LIVE_URL);

  let currentInterviewerText = '';
  let currentCandidateText = '';
  let transcriptAccumulator: { speaker: 'INTERVIEWER' | 'CANDIDATE'; text: string; timestamp: Date }[] = 
    session.messages.map(m => ({
      speaker: m.speaker as 'INTERVIEWER' | 'CANDIDATE',
      text: m.text,
      timestamp: m.createdAt
    }));

  let isInterrupted = false;

  geminiWs.on('open', () => {
    console.log(`[WS Proxy] Gemini Live Connection established.`);

    // Compile customized system instruction for Gemini Live setup
    const systemInstructionText = `
${persona.systemPrompt}

Candidate Information:
- Target Role Level: ${session.experienceLevel}
${session.resumeText ? `- Resume Context: ${session.resumeText}` : ''}
${session.jobDescriptionText ? `- Target Job Description: ${session.jobDescriptionText}` : ''}

Session Parameters:
- Current Target Competency: "${session.currentTopic}"
- Current Target Difficulty: Level ${session.difficulty} out of 5.

CRITICAL WORKFLOW:
1. Conduct the interview entirely through real-time spoken audio conversation.
2. Ask only ONE question at a time. Keep your turns brief (1-3 sentences).
3. Do not output markdown, bullet points, headers, or structural formatting in your text transcript.
4. Listen carefully, challenge vague answers, and adjust difficulty.
5. If the system prompts you with hidden developer directions (e.g., "[SYSTEM GUIDANCE: ...]"), execute that guidance immediately.
`;

    const modelEnv = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const socketModel = modelEnv.startsWith('models/') ? modelEnv : `models/${modelEnv}`;

    // Send Setup Message
    const setupMessage = {
      setup: {
        model: socketModel,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: persona.voice // Aoede, Fenrir, Puck, Kore
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        }
      }
    };

    geminiWs.send(JSON.stringify(setupMessage));
    clientWs.send(JSON.stringify({ event: 'connected', message: 'Connected to Gemini Live.' }));
  });

  geminiWs.on('message', async (data: WebSocket.Data) => {
    try {
      const response = JSON.parse(data.toString());

      // Handle Gemini setup complete
      if (response.setupComplete) {
        console.log(`[WS Proxy] Setup complete.`);
        clientWs.send(JSON.stringify({ event: 'ready' }));
        return;
      }

      // Handle Server Content (Audio streams & transcripts)
      if (response.serverContent) {
        const { modelTurn, turnComplete, interrupted } = response.serverContent;

        if (interrupted) {
          console.log(`[WS Proxy] Gemini received interruption signal.`);
          isInterrupted = true;
          clientWs.send(JSON.stringify({ event: 'interrupted' }));
          return;
        }

        if (modelTurn && modelTurn.parts) {
          for (const part of modelTurn.parts) {
            // Forward PCM 24kHz audio chunk to client
            if (part.inlineData && part.inlineData.data) {
              clientWs.send(JSON.stringify({
                event: 'audio',
                data: part.inlineData.data
              }));
            }

            // Accumulate textual transcript
            if (part.text) {
              currentInterviewerText += part.text;
            }
          }
        }

        // Hook on Turn Complete
        if (turnComplete) {
          console.log(`[WS Proxy] Turn Complete. Interviewer said: "${currentInterviewerText}"`);
          
          if (currentInterviewerText.trim()) {
            // Save Interviewer Response in DB
            await prisma.conversationMessage.create({
              data: {
                sessionId,
                speaker: 'INTERVIEWER',
                text: currentInterviewerText
              }
            });

            // Add to in-memory transcript list
            transcriptAccumulator.push({
              speaker: 'INTERVIEWER',
              text: currentInterviewerText,
              timestamp: new Date()
            });

            // Send textual transcription to the frontend for auxiliary display/logs
            clientWs.send(JSON.stringify({
              event: 'transcript',
              speaker: 'INTERVIEWER',
              text: currentInterviewerText
            }));

            // Reset current turn storage
            currentInterviewerText = '';
          }

          // If the candidate completed a speech turn (meaning we had candidate content prior to this turn complete)
          if (currentCandidateText.trim()) {
            console.log(`[WS Proxy] Executing LangGraph pipeline on candidate response: "${currentCandidateText}"`);
            
            // Save candidate response to DB
            const candMsg = await prisma.conversationMessage.create({
              data: {
                sessionId,
                speaker: 'CANDIDATE',
                text: currentCandidateText
              }
            });

            transcriptAccumulator.push({
              speaker: 'CANDIDATE',
              text: currentCandidateText,
              timestamp: new Date()
            });

            // Send textual transcription to the frontend
            clientWs.send(JSON.stringify({
              event: 'transcript',
              speaker: 'CANDIDATE',
              text: currentCandidateText
            }));

            // Read session state
            const currentSession = await prisma.interviewSession.findUnique({
              where: { id: sessionId }
            });

            if (currentSession) {
              // Construct State Object
              const graphState: InterviewState = {
                sessionId,
                interviewType: currentSession.type as any,
                experienceLevel: currentSession.experienceLevel as any,
                resumeText: currentSession.resumeText || undefined,
                jobDescriptionText: currentSession.jobDescriptionText || undefined,
                currentTopic: currentSession.currentTopic,
                difficulty: currentSession.difficulty,
                coverage: currentSession.coverage as any,
                transcript: transcriptAccumulator,
                scores: currentSession.scores as any,
                timeRemaining: currentSession.timeRemaining,
                status: currentSession.status as any,
                nextAction: 'ask_question',
                lastCandidateResponse: currentCandidateText
              };

              // Run LangGraph Node Cycles
              const updatedState = await runGraphPipeline(graphState);

              // Update message in DB with score metrics
              if (updatedState.lastEvaluation) {
                await prisma.conversationMessage.update({
                  where: { id: candMsg.id },
                  data: { evaluation: updatedState.lastEvaluation as any }
                });
              }

              // Update Session State in DB
              const updatedSession = await prisma.interviewSession.update({
                where: { id: sessionId },
                data: {
                  currentTopic: updatedState.currentTopic,
                  difficulty: updatedState.difficulty,
                  coverage: updatedState.coverage,
                  scores: updatedState.scores,
                  status: updatedState.nextAction === 'close_interview' ? 'completed' : 'ongoing',
                  timeRemaining: Math.max(0, currentSession.timeRemaining - 45) // decrements per response
                }
              });

              // Notify client of status updates
              clientWs.send(JSON.stringify({
                event: 'state_update',
                session: updatedSession
              }));

              // If interview is complete, trigger closing and feedback report
              if (updatedSession.status === 'completed') {
                console.log(`[WS Proxy] Interview session completed.`);
                clientWs.send(JSON.stringify({ event: 'completed' }));
                
                // Inject closing instruction
                const endMessage = {
                  clientContent: {
                    turns: [
                      {
                        role: 'user',
                        parts: [{ text: '[SYSTEM GUIDANCE: The interview has finished. Please give a warm, professional closing response and end the conversation.]' }]
                      }
                    ],
                    turnComplete: true
                  }
                };
                geminiWs.send(JSON.stringify(endMessage));
                triggerAsyncFeedbackGeneration(sessionId);
              } else {
                // Otherwise, inject the LangGraph instructions into the Live API context!
                let injectText = '';
                if (updatedState.nextAction === 'follow_up') {
                  const evalRes = updatedState.lastEvaluation;
                  if (evalRes?.isWeak) {
                    injectText = `[SYSTEM GUIDANCE: The candidate's response was weak or vague. Ask a follow-up probing question to challenge them on this topic: "${updatedSession.currentTopic}".]`;
                  } else {
                    injectText = `[SYSTEM GUIDANCE: Dig deeper into their explanation regarding topic: "${updatedSession.currentTopic}".]`;
                  }
                } else {
                  injectText = `[SYSTEM GUIDANCE: Move on to the next topic: "${updatedSession.currentTopic}". Ask a new question matching difficulty level ${updatedSession.difficulty}.]`;
                }

                const guidanceMessage = {
                  clientContent: {
                    turns: [
                      {
                        role: 'user',
                        parts: [{ text: injectText }]
                      }
                    ],
                    turnComplete: true
                  }
                };
                geminiWs.send(JSON.stringify(guidanceMessage));
              }
            }

            // Reset candidate buffer
            currentCandidateText = '';
          }
        }
      }
    } catch (err) {
      console.error('Error processing message from Gemini Live API:', err);
    }
  });

  // 3. Pipe Client WebSocket Messages -> Gemini Live API
  clientWs.on('message', (message: WebSocket.Data) => {
    try {
      const payload = JSON.parse(message.toString());

      // Client sends PCM 16kHz audio chunk
      if (payload.event === 'audio' && payload.data) {
        if (geminiWs.readyState === WebSocket.OPEN) {
          const mediaMessage = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: 'audio/pcm;rate=16000',
                  data: payload.data // Base64 PCM data
                }
              ]
            }
          };
          geminiWs.send(JSON.stringify(mediaMessage));
        }
      }

      // Client transcribes text turn (e.g. backup or speech transcription)
      if (payload.event === 'text' && payload.text) {
        currentCandidateText = payload.text;
        if (geminiWs.readyState === WebSocket.OPEN) {
          const textMessage = {
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: payload.text }]
                }
              ],
              turnComplete: true
            }
          };
          geminiWs.send(JSON.stringify(textMessage));
        }
      }

      // Client signals interruption
      if (payload.event === 'interrupt') {
        console.log(`[WS Proxy] Client triggered interrupt signal. Cancelling Gemini generation...`);
        if (geminiWs.readyState === WebSocket.OPEN) {
          // Interrupt signal is sent by submitting a blank user content turn
          const interruptMessage = {
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: []
                }
              ],
              turnComplete: false
            }
          };
          geminiWs.send(JSON.stringify(interruptMessage));
        }
      }
    } catch (error) {
      console.error('Error processing client message:', error);
    }
  });

  // Handle Close / Cleanup
  clientWs.on('close', () => {
    console.log(`[WS Proxy] Client disconnected.`);
    if (geminiWs.readyState === WebSocket.OPEN || geminiWs.readyState === WebSocket.CONNECTING) {
      geminiWs.close();
    }
  });

  geminiWs.on('close', () => {
    console.log(`[WS Proxy] Gemini Live connection closed.`);
    clientWs.send(JSON.stringify({ event: 'disconnected', message: 'Gemini Live disconnected.' }));
    clientWs.close();
  });

  geminiWs.on('error', (err) => {
    console.error(`[WS Proxy] Gemini Live Error:`, err);
    clientWs.send(JSON.stringify({ event: 'error', error: 'Gemini Live error occurred.' }));
    clientWs.close();
  });
}
