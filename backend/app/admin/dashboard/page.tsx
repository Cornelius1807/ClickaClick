'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Metrics {
  avgSEQ: number;
  resolutionRate: number;
  recurrenceCount: number;
  totalSessions: number;
  totalMessages: number;
  escalatedCount: number;
}

interface Alert {
  level: string;
  message: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({ from: '7days', to: 'today' });

  useEffect(() => {
    // Verificar autenticación
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    fetchMetrics();
  }, [dateRange, router]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/metrics`, {
        headers: {
          'admin-token': 'authenticated',
        },
      });

      setMetrics(response.data.metrics);
      setAlerts(response.data.alerts);
      setError('');
    } catch (err: any) {
      setError('Error cargando métricas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">ClickaClick Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg mb-4 ${
                alert.level === 'warning'
                  ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700'
                  : 'bg-red-100 border-l-4 border-red-500 text-red-700'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* SEQ Score Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Promedio SEQ (Facilidad)
              </h2>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {metrics.avgSEQ.toFixed(1)}/5
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(metrics.avgSEQ / 5) * 100}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Puntuación de satisfacción del usuario
              </p>
            </div>

            {/* Resolution Rate Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Tasa de Resolución
              </h2>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {metrics.resolutionRate}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.resolutionRate >= 70
                      ? 'bg-green-600'
                      : 'bg-red-600'
                  }`}
                  style={{
                    width: `${metrics.resolutionRate}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Mensajes resueltos sin escalada
              </p>
            </div>

            {/* Recurrence Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Reincidencia
              </h2>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {metrics.recurrenceCount.toFixed(1)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Usuarios por día promedio
              </p>
            </div>

            {/* Total Sessions Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Sesiones (Esta Semana)
              </h2>
              <div className="text-4xl font-bold text-indigo-600">
                {metrics.totalSessions}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Total de inicios de sesión
              </p>
            </div>

            {/* Total Messages Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Mensajes Totales
              </h2>
              <div className="text-4xl font-bold text-orange-600">
                {metrics.totalMessages}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Interacciones usuario-bot
              </p>
            </div>

            {/* Escalated Messages Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-2">
                Escaladas a Humano
              </h2>
              <div className="text-4xl font-bold text-red-600">
                {metrics.escalatedCount}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Mensajes derivados a soporte
              </p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/admin/bot"
            className="bg-white hover:shadow-lg transition-shadow rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              📝 Editor de Bot
            </h3>
            <p className="text-gray-600">
              Gestiona intenciones, respuestas y sinónimos en tiempo real
            </p>
          </a>

          <a
            href="/admin/videos"
            className="bg-white hover:shadow-lg transition-shadow rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              🎥 Gestión de Videos
            </h3>
            <p className="text-gray-600">
              Carga y asocia videos de YouTube a intenciones
            </p>
          </a>

          <a
            href="/admin/support"
            className="bg-white hover:shadow-lg transition-shadow rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              💬 Soporte Humano
            </h3>
            <p className="text-gray-600">
              Configura horarios y gestiona voluntarios
            </p>
          </a>

          <a
            href="/admin/surveys"
            className="bg-white hover:shadow-lg transition-shadow rounded-lg shadow-md p-6 cursor-pointer"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              📊 Exportar Encuestas
            </h3>
            <p className="text-gray-600">
              Descarga datos SEQ en CSV o Excel
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
