import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener configuración de soporte
    const config = await prisma.supportConfig.findFirst();
    const contacts = await prisma.supportContact.findMany({
      where: {
        isActive: true,
      },
    });

    if (!config) {
      return NextResponse.json(
        {
          isOpen: false,
          message: 'Soporte no disponible en este momento',
          hours: null,
        },
        { status: 200 }
      );
    }

    // Determinar si es hora de soporte
    const now = new Date();
    const peruTz = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      weekday: 'long',
    }).format(now);

    const hoursPerDay: any = JSON.parse(config.hoursJson);
    const dayName = peruTz.toLowerCase();

    const dayHours = hoursPerDay[dayName];
    if (!dayHours) {
      return NextResponse.json(
        {
          isOpen: false,
          message: 'Soporte cerrado hoy',
          hours: hoursPerDay,
        },
        { status: 200 }
      );
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isOpen =
      currentTime >= dayHours.inicio && currentTime <= dayHours.fin;

    return NextResponse.json(
      {
        isOpen,
        currentDay: dayName,
        todayHours: dayHours,
        allHours: hoursPerDay,
        activeContacts: contacts.length,
        onlineContacts: contacts.filter((c) => c.isOnline).length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/support/availability:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
