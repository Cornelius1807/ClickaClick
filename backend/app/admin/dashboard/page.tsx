'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

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
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-orange-700 font-semibold">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧓</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ClickaClick</h1>
              <p className="text-orange-100 text-sm">Panel de Administración</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all text-sm border border-white/30"
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
              className={`p-4 rounded-xl mb-3 flex items-center gap-3 ${
                alert.level === 'warning'
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{alert.level === 'warning' ? '⚠️' : '🚨'}</span>
              <span className="font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Métricas principales</h2>
          <p className="text-gray-500 text-sm">Resumen de la última semana</p>
        </div>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* SEQ Score Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio SEQ
                </h2>
                <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">⭐</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {metrics.avgSEQ.toFixed(1)}<span className="text-lg text-gray-400">/5</span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${(metrics.avgSEQ / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Facilidad de uso percibida</p>
            </div>

            {/* Resolution Rate Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Tasa de Resolución
                </h2>
                <span className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">✅</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {metrics.resolutionRate}<span className="text-lg text-gray-400">%</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    metrics.resolutionRate >= 70
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${metrics.resolutionRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Resueltos sin escalada</p>
            </div>

            {/* Recurrence Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Reincidencia
                </h2>
                <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-lg">🔄</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {metrics.recurrenceCount.toFixed(1)}
              </div>
              <p className="text-xs text-gray-400 mt-2">Usuarios por día promedio</p>
            </div>

            {/* Total Sessions Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Sesiones
                </h2>
                <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">👥</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.totalSessions}
              </div>
              <p className="text-xs text-gray-400 mt-2">Total esta semana</p>
            </div>

            {/* Total Messages Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Mensajes
                </h2>
                <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">💬</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {metrics.totalMessages}
              </div>
              <p className="text-xs text-gray-400 mt-2">Interacciones usuario-bot</p>
            </div>

            {/* Escalated Messages Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Escaladas
                </h2>
                <span className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg">🆘</span>
              </div>
              <div className="text-3xl font-bold text-red-500">
                {metrics.escalatedCount}
              </div>
              <p className="text-xs text-gray-400 mt-2">Derivados a soporte humano</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Gestión</h2>
          <p className="text-gray-500 text-sm mb-5">Administra el contenido del bot</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/bot"
              className="group bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-300 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center text-2xl transition-colors">📝</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                    Editor de Intenciones
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Gestiona intenciones y sinónimos
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/videos"
              className="group bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-300 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center text-2xl transition-colors">🎥</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                    Gestión de Videos
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Asocia videos de YouTube a intenciones
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/support"
              className="group bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-300 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center text-2xl transition-colors">💬</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                    Soporte Humano
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Configura horarios y voluntarios
                  </p>
                </div>
              </div>
            </a>

            <a
              href="/admin/surveys"
              className="group bg-white hover:bg-orange-50 border border-orange-100 hover:border-orange-300 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center text-2xl transition-colors">📊</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                    Exportar Encuestas
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Descarga datos SEQ en CSV o Excel
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
