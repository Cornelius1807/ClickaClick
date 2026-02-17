'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Survey {
  id: string;
  sessionId: string;
  score: number;
  createdAt: string;
  userAnonId: string;
  device: string;
  sessionDate: string;
}

interface ScoreDistribution {
  score: number;
  count: number;
}

interface Stats {
  totalSurveys: number;
  avgScore: number;
  scoreDistribution: ScoreDistribution[];
}

export default function AdminSurveys() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }
    fetchSurveys();
  }, [router]);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/surveys`, {
        headers: { 'admin-token': 'authenticated' },
      });
      setSurveys(response.data.surveys);
      setStats(response.data.stats);
      setError('');
    } catch (err: any) {
      setError('Error cargando encuestas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (surveys.length === 0) return;

    const header = 'ID,Sesión,Usuario,Dispositivo,Puntaje,Fecha Sesión,Fecha Encuesta\n';
    const rows = surveys
      .map(
        (s) =>
          `${s.id},${s.sessionId},${s.userAnonId},${s.device},${s.score},${new Date(s.sessionDate).toLocaleString('es-PE')},${new Date(s.createdAt).toLocaleString('es-PE')}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `encuestas_seq_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (surveys.length === 0) return;

    const blob = new Blob([JSON.stringify({ surveys, stats }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `encuestas_seq_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scoreEmoji = (score: number) => {
    const emojis: Record<number, string> = {
      1: '😞',
      2: '😕',
      3: '😐',
      4: '😊',
      5: '🤩',
    };
    return emojis[score] || '❓';
  };

  const scoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (score === 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl text-orange-700 font-semibold">Cargando encuestas...</p>
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
            <a
              href="/admin/dashboard"
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              ← Dashboard
            </a>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">📊 Encuestas SEQ</h1>
              <p className="text-orange-100 text-sm">Resultados y exportación</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              disabled={surveys.length === 0}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all text-sm border border-white/30 disabled:opacity-50"
            >
              📥 Exportar CSV
            </button>
            <button
              onClick={exportJSON}
              disabled={surveys.length === 0}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all text-sm border border-white/30 disabled:opacity-50"
            >
              📥 Exportar JSON
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <span>❌</span> {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {/* Total Surveys */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Total Encuestas
                </h2>
                <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">📋</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalSurveys}
              </div>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Promedio SEQ
                </h2>
                <span className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">⭐</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.avgScore.toFixed(1)}
                <span className="text-lg text-gray-400">/5</span>
              </div>
              <div className="w-full bg-orange-100 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full"
                  style={{ width: `${(stats.avgScore / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Distribución
              </h2>
              <div className="flex items-end gap-2 h-16">
                {stats.scoreDistribution.map((d) => {
                  const maxCount = Math.max(
                    ...stats.scoreDistribution.map((x) => x.count),
                    1
                  );
                  const heightPct = (d.count / maxCount) * 100;
                  return (
                    <div key={d.score} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">{d.count}</span>
                      <div
                        className="w-full bg-gradient-to-t from-orange-400 to-orange-300 rounded-t"
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-xs mt-1">{scoreEmoji(d.score)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Surveys Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="p-6 border-b border-orange-100">
            <h2 className="text-lg font-bold text-gray-800">
              Respuestas individuales
            </h2>
            <p className="text-gray-500 text-sm">
              {surveys.length} encuesta{surveys.length !== 1 ? 's' : ''} registrada{surveys.length !== 1 ? 's' : ''}
            </p>
          </div>

          {surveys.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <span className="text-4xl block mb-3">📭</span>
              <p className="font-semibold">No hay encuestas registradas aún</p>
              <p className="text-sm mt-1">Las encuestas SEQ aparecerán aquí cuando los usuarios las completen</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Puntaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sesión
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {surveys.map((survey) => (
                    <tr key={survey.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(survey.createdAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {survey.userAnonId.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                          {survey.device === 'ios' ? '🍎' : '🤖'} {survey.device}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${scoreColor(survey.score)}`}
                        >
                          {scoreEmoji(survey.score)} {survey.score}/5
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                        {survey.sessionId.slice(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-8 text-center">
          <a
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
          >
            ← Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
