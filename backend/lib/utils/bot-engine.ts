import { PrismaClient } from '@prisma/client';
import {
  normalizeText,
  expandSynonyms,
  tokenize,
  calculateSimilarity,
} from './text';

const prisma = new PrismaClient();

interface IntentDetectionResult {
  intentId: string | null;
  intentName: string | null;
  confidence: number;
  matchType: 'exact' | 'partial' | 'similarity' | 'none';
}

export async function detectIntent(
  userInput: string,
  deviceScope: string
): Promise<IntentDetectionResult> {
  const normalized = normalizeText(userInput);
  const expanded = expandSynonyms(normalized);
  const tokens = tokenize(expanded);

  // 1. Intentar coincidencia exacta
  const exactMatch = await prisma.intentPhrase.findFirst({
    where: {
      phrase: {
        equals: expanded,
      },
      intent: {
        deviceScope: {
          in: [deviceScope, 'all'],
        },
      },
    },
    include: {
      intent: true,
    },
  });

  if (exactMatch) {
    console.log('detectIntent - exact match for', normalized, '=>', exactMatch.intent.name);
    return {
      intentId: exactMatch.intent.id,
      intentName: exactMatch.intent.name,
      confidence: 1.0,
      matchType: 'exact',
    };
  }

  // 2. Intentar coincidencia parcial (uno o más tokens)
  const allPhrases = await prisma.intentPhrase.findMany({
    include: {
      intent: true,
    },
  });

  const candidatesMap = new Map<
    string,
    { intent: any; maxSimilarity: number }
  >();

  for (const phraseRecord of allPhrases) {
    if (!phraseRecord.intent) continue;
    
    // Filtrar por deviceScope
    if (!['all', deviceScope].includes(phraseRecord.intent.deviceScope)) {
      continue;
    }

    const similarity = calculateSimilarity(expanded, phraseRecord.phrase);

    // Umbral de similitud: aceptar incluso pequeñas coincidencias
    // con frases cortas como "brillo" dentro de una oración más larga.
    if (similarity >= 0.15) {
      // Umbral de similitud
      const existing = candidatesMap.get(phraseRecord.intent.id);
      if (!existing || similarity > existing.maxSimilarity) {
        candidatesMap.set(phraseRecord.intent.id, {
          intent: phraseRecord.intent,
          maxSimilarity: similarity,
        });
      }
    }
  }

  if (candidatesMap.size > 0) {
    let bestMatch = { similarity: 0, intent: null as any };
    for (const [_, candidate] of candidatesMap.entries()) {
      if (candidate.maxSimilarity > bestMatch.similarity) {
        bestMatch = {
          similarity: candidate.maxSimilarity,
          intent: candidate.intent,
        };
      }
    }

    if (bestMatch.intent) {
      console.log('detectIntent - similarity match', expanded, '=>', bestMatch.intent.name, 'confidence', bestMatch.similarity);
      return {
        intentId: bestMatch.intent.id,
        intentName: bestMatch.intent.name,
        confidence: bestMatch.similarity,
        matchType: 'similarity',
      };
    }
  }

  // 3. Sin coincidencia
  return {
    intentId: null,
    intentName: null,
    confidence: 0,
    matchType: 'none',
  };
}

// Obtener respuesta para una intención
export async function getIntentResponse(
  intentId: string,
  device: string
): Promise<{ answerText: string; videoId?: string; stepsJson?: string }> {
  const intent = await prisma.intent.findUnique({
    where: { id: intentId },
    include: {
      videos: {
        where: {
          device: device,
        },
      },
      guides: true,
    },
  });

  if (!intent) {
    return {
      answerText: 'Lo sentimos, no entendemos tu pregunta. Intenta de otra manera.',
    };
  }

  const response: any = {
    answerText: intent.answerText,
  };

  // Si hay video para este dispositivo, devolver video ID
  if (intent.videos && intent.videos.length > 0 && intent.videos[0].youtubeId) {
    response.videoId = intent.videos[0].youtubeId;
  }

  // Si no hay video, devolver guía textual
  if (!response.videoId && intent.guides) {
    response.stepsJson = intent.guides.stepsJson;
  }

  return response;
}
