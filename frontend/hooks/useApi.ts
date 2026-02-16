import { useCallback } from 'react';
import type { DeviceType, Session, SupportStatus } from '@/types';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function useSession() {
  const createSession = useCallback(async (device: DeviceType): Promise<Session> => {
    const response = await fetch(`${BACKEND_URL}/api/session/start`, {
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
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
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
    const response = await fetch(`${BACKEND_URL}/api/videos?device=${device}`);
    if (!response.ok) throw new Error('Failed to fetch videos');
    return response.json();
  }, []);

  return { getVideos };
}

export function useSurvey() {
  const submitSurveySEQ = useCallback(async (sessionId: string, score: number) => {
    const response = await fetch(`${BACKEND_URL}/api/survey/seq`, {
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
    const response = await fetch(`${BACKEND_URL}/api/support/availability`);
    if (!response.ok) throw new Error('Failed to fetch support availability');
    return response.json();
  }, []);

  const getRoute = useCallback(
    async (sessionId?: string): Promise<SupportStatus> => {
      const url = sessionId
        ? `${BACKEND_URL}/api/support/route?sessionId=${sessionId}`
        : `${BACKEND_URL}/api/support/route`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch support route');
      return response.json();
    },
    []
  );

  return { getAvailability, getRoute };
}
