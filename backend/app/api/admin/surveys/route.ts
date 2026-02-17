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

    const surveys = await prisma.surveySEQ.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        session: {
          select: {
            userAnonId: true,
            device: true,
            startedAt: true,
          },
        },
      },
    });

    // Estadísticas generales
    const totalSurveys = surveys.length;
    const avgScore =
      totalSurveys > 0
        ? surveys.reduce((sum, s) => sum + s.score, 0) / totalSurveys
        : 0;

    // Distribución de puntajes
    const scoreDistribution = [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: surveys.filter((s) => s.score === score).length,
    }));

    return NextResponse.json(
      {
        surveys: surveys.map((s) => ({
          id: s.id,
          sessionId: s.sessionId,
          score: s.score,
          createdAt: s.createdAt,
          userAnonId: s.session?.userAnonId || 'N/A',
          device: s.session?.device || 'N/A',
          sessionDate: s.session?.startedAt || s.createdAt,
        })),
        stats: {
          totalSurveys,
          avgScore: Math.round(avgScore * 100) / 100,
          scoreDistribution,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/admin/surveys:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
