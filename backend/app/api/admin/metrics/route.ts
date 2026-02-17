import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Período: última semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── 1. Encuestas SEQ ──
    const surveys = await prisma.surveySEQ.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'desc' },
    });

    const avgSEQ =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.score, 0) / surveys.length
        : 0;

    // ── 2. Sesiones con mensajes ──
    const sessions = await prisma.session.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      include: { messages: true },
    });

    const allMessages = sessions.flatMap((s) => s.messages);
    const totalMessages = allMessages.length;

    // ── 3. Tasa de Resolución Autónoma (por sesión) ──
    // Sesiones donde NINGÚN mensaje fue escalado = resuelta autónomamente
    const totalSessionsWithMessages = sessions.filter(
      (s) => s.messages.length > 0
    ).length;
    const escalatedSessions = sessions.filter((s) =>
      s.messages.some((m) => m.escalatedToWhatsapp)
    ).length;
    const autonomousResolutions =
      totalSessionsWithMessages - escalatedSessions;

    const resolutionRate =
      totalSessionsWithMessages > 0
        ? (autonomousResolutions / totalSessionsWithMessages) * 100
        : 0;

    // ── 4. Escaladas totales (mensajes individuales) ──
    const escalatedCount = allMessages.filter(
      (m) => m.escalatedToWhatsapp
    ).length;

    // ── 5. Tasa de Reincidencia ──
    // % de usuarios que regresaron en un día diferente
    const userDays: Record<string, Set<string>> = {};
    for (const session of sessions) {
      const day = new Date(session.startedAt).toISOString().split('T')[0];
      if (!userDays[session.userAnonId]) {
        userDays[session.userAnonId] = new Set();
      }
      userDays[session.userAnonId].add(day);
    }

    const totalUniqueUsers = Object.keys(userDays).length;
    const returningUsers = Object.values(userDays).filter(
      (days) => days.size > 1
    ).length;
    const recurrenceRate =
      totalUniqueUsers > 0
        ? Math.round((returningUsers / totalUniqueUsers) * 100)
        : 0;

    // ── 6. Tasa de Reconocimiento de Intención ──
    // Mensajes donde el bot detectó una intención (intentId != null)
    const recognizedMessages = allMessages.filter(
      (m) => m.intentId !== null
    ).length;
    const intentRecognitionRate =
      totalMessages > 0
        ? Math.round((recognizedMessages / totalMessages) * 100)
        : 0;

    // ── 7. Distribución por dispositivo ──
    const deviceCounts: Record<string, number> = {};
    for (const session of sessions) {
      const dev = session.device || 'desconocido';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    }
    const deviceDistribution = Object.entries(deviceCounts).map(
      ([name, value]) => ({ name, value })
    );

    // ── 8. Preguntas más frecuentes (top 10 intenciones) ──
    const intentCounts: Record<string, { name: string; count: number }> = {};
    for (const msg of allMessages) {
      if (msg.intentId) {
        if (!intentCounts[msg.intentId]) {
          intentCounts[msg.intentId] = { name: msg.intentId, count: 0 };
        }
        intentCounts[msg.intentId].count++;
      }
    }

    // Resolver nombres de intenciones
    const intentIds = Object.keys(intentCounts);
    if (intentIds.length > 0) {
      const intents = await prisma.intent.findMany({
        where: { id: { in: intentIds } },
        select: { id: true, name: true },
      });
      for (const intent of intents) {
        if (intentCounts[intent.id]) {
          intentCounts[intent.id].name = intent.name;
        }
      }
    }

    const frequentQuestions = Object.values(intentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ name, count }) => ({ name, count }));

    // ── 9. Sin intención detectada (para análisis) ──
    const unrecognizedCount = allMessages.filter(
      (m) => m.intentId === null
    ).length;

    // ── Alertas ──
    const alerts = [];
    if (resolutionRate < 80) {
      alerts.push({
        level: 'warning',
        message: `Tasa de resolución autónoma ${Math.round(resolutionRate)}% (meta: >80%)`,
      });
    }
    if (intentRecognitionRate < 80) {
      alerts.push({
        level: 'warning',
        message: `Reconocimiento de intención ${intentRecognitionRate}% (meta: >80%)`,
      });
    }
    if (avgSEQ > 0 && avgSEQ < 4) {
      alerts.push({
        level: 'warning',
        message: `Promedio SEQ ${avgSEQ.toFixed(1)}/5 (meta: ≥4.0)`,
      });
    }

    return NextResponse.json(
      {
        period: 'week',
        metrics: {
          avgSEQ: Math.round(avgSEQ * 100) / 100,
          resolutionRate: Math.round(resolutionRate),
          recurrenceRate,
          intentRecognitionRate,
          totalSessions: sessions.length,
          totalMessages,
          escalatedCount,
          unrecognizedCount,
        },
        deviceDistribution,
        frequentQuestions,
        alerts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/admin/metrics:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
