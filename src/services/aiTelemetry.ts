import { createStore, nowIso, uid, useStore } from '@/lib/store';

// ---------------------------------------------------------------------------------------------
// AI telemetry for the Command Center: what travellers ask, how the planner answers, latency,
// failures, safety flags and feedback. Prompts are redacted (emails, phone numbers, long digit
// runs) before they're stored. Production: written server-side by the AI gateway, which also
// records model, tokens and cost per request, so the model can be replaced without UI changes.
// ---------------------------------------------------------------------------------------------

export type AiAnswerType = 'plan' | 'compare' | 'season' | 'entry' | 'weather' | 'error';
export type SafetyFlag = 'personal_data' | 'unsafe_request' | 'medical' | 'off_topic';

export interface AiInteraction {
  id: string;
  at: string;
  lang: string;
  prompt: string;
  type: AiAnswerType;
  latencyMs: number;
  ok: boolean;
  /** Days/destinations of a generated plan, for recommendation stats. */
  destinations?: string[];
  flags: SafetyFlag[];
  feedback?: 'up' | 'down';
  /** Rule-based demo planner today; a hosted model later. */
  model: string;
  sample?: boolean;
}

export const AI_MODEL = 'demo-rules-v1';

export function redact(text: string): string {
  return text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]')
    .replace(/\+?\d[\d\s()-]{7,}\d/g, '[number]')
    .slice(0, 240);
}

/** Lightweight checks; production uses the AI gateway's safety classifier. */
export function safetyFlags(text: string): SafetyFlag[] {
  const t = text.toLowerCase();
  const out: SafetyFlag[] = [];
  if (/[^\s@]+@[^\s@]+\.[^\s@]+|passport (no|number)|\b\d{9,}\b/.test(t)) out.push('personal_data');
  if (/\b(poach|ivory|rhino horn|weapon|gun|drugs?)\b|偷猎|象牙/.test(t)) out.push('unsafe_request');
  if (/\b(malaria (pills|dose)|prescription|vaccine dose)\b/.test(t)) out.push('medical');
  return out;
}

export const aiLogStore = createStore<AiInteraction[]>('tm.ai.log', () => []);
export const useAiLog = () => useStore(aiLogStore);

export const aiTelemetry = {
  record(i: Omit<AiInteraction, 'id' | 'at' | 'model' | 'flags' | 'prompt'> & { prompt: string }): string {
    const id = uid('ai_');
    aiLogStore.set(list => [{ ...i, id, at: nowIso(), model: AI_MODEL, prompt: redact(i.prompt), flags: safetyFlags(i.prompt) }, ...list].slice(0, 500));
    return id;
  },
  feedback(id: string, value: 'up' | 'down') {
    aiLogStore.set(list => list.map(x => (x.id === id ? { ...x, feedback: x.feedback === value ? undefined : value } : x)));
  }
};
