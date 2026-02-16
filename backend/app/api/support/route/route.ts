import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // Obtener configuración de soporte
    const config = await prisma.supportConfig.findFirst();
    if (!config) {
      return NextResponse.json(
        {
          isOpen: false,
          message: 'No hay soporte disponible',
        },
        { status: 200 }
      );
    }

    // Verificar horario de soporte
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
          nextAvailable: 'mañana',
        },
        { status: 200 }
      );
    }

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const isOpen =
      currentTime >= dayHours.inicio && currentTime <= dayHours.fin;

    if (!isOpen) {
      return NextResponse.json(
        {
          isOpen: false,
          message: 'Soporte cerrado. Reabre a las ' + dayHours.inicio,
        },
        { status: 200 }
      );
    }

    // Obtener contactos en línea (HU17: enrutamiento aleatorio)
    const onlineContacts = await prisma.supportContact.findMany({
      where: {
        isActive: true,
        isOnline: true,
      },
    });

    if (onlineContacts.length === 0) {
      return NextResponse.json(
        {
          isOpen: true,
          message: 'No hay voluntarios disponibles en este momento',
          phone: null,
          fallbackMessage:
            'Intenta más tarde o déjanos un mensaje por WhatsApp',
        },
        { status: 200 }
      );
    }

    // Seleccionar contacto aleatorio
    const selectedContact =
      onlineContacts[Math.floor(Math.random() * onlineContacts.length)];

    // Si session está disponible, registrar escalada
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (session) {
        // Registrar que fue escalada (se marca en mensaje cuando se abre WhatsApp)
        // Por ahora solo enrutamos
      }
    }

    const messageBody = encodeURIComponent(
      '¡Hola! Necesito ayuda de ClickaClick.'
    );

    return NextResponse.json(
      {
        isOpen: true,
        phone: selectedContact.phoneE164,
        name: selectedContact.name,
        waLink: `https://wa.me/${selectedContact.phoneE164.replace('+', '')}?text=${messageBody}`,
        message: `Conectando con ${selectedContact.name}...`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/support/route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
