export type DeviceType = 'android' | 'ios';

export interface Session {
  sessionId: string;
  userAnonId: string;
  device: DeviceType;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  videoId?: string;
  steps?: Step[];
  intentName?: string;
}

export interface Step {
  step: number;
  text: string;
}

export interface SupportStatus {
  isOpen: boolean;
  phone?: string;
  name?: string;
  waLink?: string;
  message?: string;
}

export interface Video {
  id: string;
  youtubeId?: string;
  title: string;
  durationSeconds?: number;
  intentId: string;
  intentName: string;
}
