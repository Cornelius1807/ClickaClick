import { useCallback } from 'react';
import type { DeviceType, Session, SupportStatus } from '@/types';

// API is now same-origin (no separate backend), use relative paths
const API_BASE = '';

export function useSession() {
  const createSession = useCallback(async (device: DeviceType): Promise<Session> => {
    const response = await fetch(`${API_BASE}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device }),
    });

    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  }, []);

  return { createSession };
}

export function useChat() {
  const sendMessage = useCallback(
    async (
      sessionId: string,
      device: DeviceType,
      text: string
    ) => {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, device, text }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    []
  );

  return { sendMessage };
}

export function useVideos() {
  const getVideos = useCallback(async (device: DeviceType) => {
    const response = await fetch(`${API_BASE}/api/videos?device=${device}`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  }, []);

  return { getVideos };
}

export function useSurvey() {
  const submitSurveySEQ = useCallback(async (sessionId: string, score: number) => {
    const response = await fetch(`${API_BASE}/api/survey/seq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, score }),
    });

    if (!response.ok) throw new Error('Failed to submit survey');
    return response.json();
  }, []);

  return { submitSurveySEQ };
}

export function useSupport() {
  const getAvailability = useCallback(async (): Promise<SupportStatus> => {
    const response = await fetch(`${API_BASE}/api/support/availability`);
    if (!response.ok) throw new Error('Failed to fetch support availability');
    return response.json();
  }, []);

  const getRoute = useCallback(
    async (sessionId?: string): Promise<SupportStatus> => {
      const url = sessionId
        ? `${API_BASE}/api/support/route?sessionId=${sessionId}`
        : `${API_BASE}/api/support/route`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch support route');
      return response.json();
    },
    []
  );

  return { getAvailability, getRoute };
}
