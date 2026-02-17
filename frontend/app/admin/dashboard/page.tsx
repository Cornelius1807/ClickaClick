'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const BACKEND_URL = '';

interface Metrics {
  avgSEQ: number;
  resolutionRate: number;
  recurrenceRate: number;
  intentRecognitionRate: number;
  totalSessions: number;
  totalMessages: number;
  escalatedCount: number;
  unrecognizedCount: number;
}

interface Alert {
  level: string;
  message: string;
}

interface DeviceData {
  name: string;
  value: number;
}

interface FreqQuestion {
  name: string;
  count: number;
}

const DEVICE_COLORS: Record<string, string> = {
  ios: '#F97316',
  android: '#22C55E',
  desconocido: '#94A3B8',
};

const PIE_COLORS = ['#F97316', '#22C55E', '#3B82F6', '#8B5CF6', '#EF4444'];

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [deviceDistribution, setDeviceDistribution] = useState<DeviceData[]>([]);
  const [frequentQuestions, setFrequentQuestions] = useState<FreqQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchMetrics();
  }, [router]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/metrics`, {
        headers: { 'admin-token': 'authenticated' },
      });
      setMetrics(response.data.metrics);
      setAlerts(response.data.alerts || []);
      setDeviceDistribution(response.data.deviceDistribution || []);
      setFrequentQuestions(response.data.frequentQuestions || []);
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

  // Helper: color de KPI según meta
  const kpiColor = (value: number, goal: number, invert = false) => {
    if (invert) return value <= goal ? 'text-green-600' : 'text-red-500';
    return value >= goal ? 'text-green-600' : 'text-red-500';
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

        {/* ═══ KPIs PRINCIPALES ═══ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800">KPIs del Proyecto</h2>
          <p className="text-gray-500 text-sm">4 métricas clave — última semana</p>
        </div>

        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* KPI 1: Resolución Autónoma */}
              <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Resolución Autónoma
                  </h2>
                  <span className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-base">✅</span>
                </div>
                <div className={`text-3xl font-bold mb-1 ${kpiColor(metrics.resolutionRate, 80)}`}>
                  {metrics.resolutionRate}<span className="text-lg text-gray-400">%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.resolutionRate >= 80
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${Math.min(metrics.resolutionRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Meta: &gt;80% sin escalada</p>
              </div>

              {/* KPI 2: Reincidencia */}
              <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Reincidencia
                  </h2>
                  <span className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-base">🔄</span>
                </div>
                <div className={`text-3xl font-bold mb-1 ${kpiColor(metrics.recurrenceRate, 50)}`}>
                  {metrics.recurrenceRate}<span className="text-lg text-gray-400">%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.recurrenceRate >= 50
                        ? 'bg-gradient-to-r from-purple-400 to-purple-500'
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    }`}
                    style={{ width: `${Math.min(metrics.recurrenceRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Meta: &gt;50% vuelven otro día</p>
              </div>

              {/* KPI 3: SEQ */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Facilidad SEQ
                  </h2>
                  <span className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-base">⭐</span>
                </div>
                <div className={`text-3xl font-bold mb-1 ${kpiColor(metrics.avgSEQ, 4)}`}>
                  {metrics.avgSEQ.toFixed(1)}<span className="text-lg text-gray-400">/5</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.avgSEQ >= 4
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${(metrics.avgSEQ / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Meta: promedio ≥4.0/5</p>
              </div>

              {/* KPI 4: Reconocimiento de Intención */}
              <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Reconocimiento
                  </h2>
                  <span className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-base">🧠</span>
                </div>
                <div className={`text-3xl font-bold mb-1 ${kpiColor(metrics.intentRecognitionRate, 80)}`}>
                  {metrics.intentRecognitionRate}<span className="text-lg text-gray-400">%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metrics.intentRecognitionRate >= 80
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                        : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                    style={{ width: `${Math.min(metrics.intentRecognitionRate, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Meta: &gt;80% intenciones detectadas</p>
              </div>
            </div>

            {/* ═══ ESTADÍSTICAS GENERALES ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">👥</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{metrics.totalSessions}</p>
                  <p className="text-xs text-gray-500">Sesiones</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-lg">💬</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{metrics.totalMessages}</p>
                  <p className="text-xs text-gray-500">Mensajes</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-lg">🆘</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{metrics.escalatedCount}</p>
                  <p className="text-xs text-gray-500">Escaladas</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-lg">❓</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{metrics.unrecognizedCount}</p>
                  <p className="text-xs text-gray-500">No reconocidas</p>
                </div>
              </div>
            </div>

            {/* ═══ GRÁFICOS ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* Distribución por dispositivo */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  📱 Distribución por Dispositivo
                </h3>
                {deviceDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }: any) =>
                          `${name === 'ios' ? 'iPhone' : name === 'android' ? 'Android' : name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {deviceDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={DEVICE_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`${value} sesiones`, 'Cantidad']}
                      />
                      <Legend
                        formatter={(value: any) =>
                          value === 'ios' ? '🍎 iPhone' : value === 'android' ? '🤖 Android' : value
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <p>Sin datos de dispositivos esta semana</p>
                  </div>
                )}
              </div>

              {/* Preguntas frecuentes */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  🔥 Preguntas Más Frecuentes
                </h3>
                {frequentQuestions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={frequentQuestions}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value} veces`, 'Consultas']}
                      />
                      <Bar
                        dataKey="count"
                        fill="#F97316"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <p>Sin preguntas detectadas esta semana</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══ NAVEGACIÓN ═══ */}
        <div className="mt-2">
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
                    Descarga datos SEQ en CSV o JSON
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
