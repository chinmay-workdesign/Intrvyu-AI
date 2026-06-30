import { useAuthStore } from '../store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired, log out user
    useAuthStore.getState().logout();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(data: any) {
    return apiFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async login(data: any) {
    return apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Profile / Analytics
  async getProfile() {
    return apiFetch('/interview/profile');
  },

  // Sessions
  async getSessions() {
    return apiFetch('/interview/sessions');
  },

  // Interview Management
  async startInterview(data: { type: string; experienceLevel: string; resumeText?: string; jobDescriptionText?: string }) {
    return apiFetch('/interview/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async sendAudioMessage(sessionId: string, audioBlob: Blob) {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio', audioBlob, 'candidate-answer.webm');

    return apiFetch('/interview/message', {
      method: 'POST',
      body: formData
      // Note: Do not set Content-Type header here, the browser does it automatically for FormData
    });
  },

  async endInterview(sessionId: string) {
    return apiFetch('/interview/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
  },

  async getFeedback(sessionId: string) {
    return apiFetch(`/interview/feedback/${sessionId}`);
  }
};
