import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Pass_Forte_123!2024';

// Función para verificar si el usuario está autenticado
export async function verifyAdminAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  error?: string;
}> {
  const sessionCookie = request.cookies.get('admin_session');

  if (!sessionCookie) {
    return {
      isAuthenticated: false,
      error: 'No session cookie',
    };
  }

  // En una app real, validarías el token en la cookie
  // Por ahora, simple verificación
  if (sessionCookie.value === 'authenticated') {
    return { isAuthenticated: true };
  }

  return {
    isAuthenticated: false,
    error: 'Invalid session',
  };
}

// Función para crear sesión admin
export function createAdminSession(): {
  response: NextResponse;
  sessionToken: string;
} {
  const sessionToken = 'authenticated'; // En producción, generar JWT o sesión segura
  const response = new NextResponse();

  response.cookies.set('admin_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 horas
  });

  return { response, sessionToken };
}

// Función para verificar CSRF token
export function verifyCSRFToken(token: string, sessionCookie: string): boolean {
  // En una app real, validarías el CSRF token apropiadamente
  // Por ahora, simple verificación
  return !!token && !!sessionCookie;
}
