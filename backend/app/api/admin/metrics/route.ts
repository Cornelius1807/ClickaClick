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

    // Obtener todas las encuestas de la última semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const surveys = await prisma.surveySEQ.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular promedio móvil de SEQ
    const avgSEQ =
      surveys.length > 0
        ? surveys.reduce((sum, s) => sum + s.score, 0) / surveys.length
        : 0;

    // Obtener todas las sesiones de esta semana
    const sessions = await prisma.session.findMany({
      where: {
        startedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        messages: true,
      },
    });

    // Calcular tasa de resolución (no escaladas / total)
    const totalMessages = sessions.reduce(
      (sum, s) => sum + s.messages.length,
      0
    );
    const escalatedMessages = sessions
      .flatMap((s) => s.messages)
      .filter((m) => m.escalatedToWhatsapp).length;

    const resolutionRate =
      totalMessages > 0 ? (totalMessages - escalatedMessages) / totalMessages : 0;

    // Detectar reincidencia: usuarios que aparecen en múltiples días
    const usersByDay: Record<string, Set<string>> = {};
    for (const session of sessions) {
      const day = new Date(session.startedAt)
        .toISOString()
        .split('T')[0];
      if (!usersByDay[day]) {
        usersByDay[day] = new Set();
      }
      usersByDay[day].add(session.userAnonId);
    }

    const dayCount = Object.keys(usersByDay).length;
    const totalUserDays = Object.values(usersByDay).reduce(
      (sum, users) => sum + users.size,
      0
    );
    const recurrenceCount =
      dayCount > 0 ? totalUserDays / dayCount : 0;

    return NextResponse.json(
      {
        period: 'week',
        metrics: {
          avgSEQ: Math.round(avgSEQ * 100) / 100,
          resolutionRate: Math.round(resolutionRate * 100),
          recurrenceCount: Math.round(recurrenceCount * 100) / 100,
          totalSessions: sessions.length,
          totalMessages,
          escalatedCount: escalatedMessages,
        },
        alerts: [
          resolutionRate < 0.7
            ? {
                level: 'warning',
                message: 'Tasa de resolución < 70% esta semana',
              }
            : null,
        ].filter(Boolean),
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
