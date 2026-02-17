import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/utils/auth';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Pass_Forte_123!2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña requeridos' },
        { status: 400 }
      );
    }

    // Verificar credenciales (en producción, hashear y comparar)
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const response = NextResponse.json(
        { message: 'Login exitoso', username },
        { status: 200 }
      );

      // Crear cookie de sesión
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Usuario o contraseña inválidos' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error en /api/admin/login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
