'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = '';

interface Intent {
  id: string;
  name: string;
  deviceScope: string;
  answerText: string;
  phrases: { id: string; phrase: string }[];
  videos?: any[];
}

export default function AdminBot() {
  const router = useRouter();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    deviceScope: 'all',
    phrases: '',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    fetchIntents();
  }, [router]);

  const fetchIntents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/intents`, {
        headers: { 'admin-token': 'authenticated' },
      });
      setIntents(response.data.intents);
    } catch (error) {
      console.error('Error fetching intents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (intentId?: string) => {
    try {
      const phrases = formData.phrases
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const payload = {
        name: formData.name,
        deviceScope: formData.deviceScope,
        answerText: '(Gemini genera la respuesta)',
        phrases,
      };

      if (intentId) {
        await axios.put(`${BACKEND_URL}/api/admin/intents/${intentId}`, payload, {
          headers: { 'admin-token': 'authenticated' },
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/intents`, payload, {
          headers: { 'admin-token': 'authenticated' },
        });
      }

      setEditingId(null);
      setFormData({ name: '', deviceScope: 'all', phrases: '' });
      fetchIntents();
    } catch (error) {
      console.error('Error saving intent:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (intentId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta intención?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/admin/intents/${intentId}`, {
          headers: { 'admin-token': 'authenticated' },
        });
        fetchIntents();
      } catch (error) {
        console.error('Error deleting intent:', error);
        alert('Error al eliminar');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-orange-700 font-semibold">Cargando intenciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Editor de Intenciones</h1>
              <p className="text-orange-100 text-sm">Gestiona las intenciones que Gemini utiliza</p>
            </div>
          </div>
          <a
            href="/admin/dashboard"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-all text-sm border border-white/30"
          >
            ← Volver
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* New/Edit Intent Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            {editingId ? '✏️ Editar Intención' : '➕ Nueva Intención'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Nombre de la Intención
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all"
                placeholder="Ej: Aumentar brillo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Alcance del Dispositivo
              </label>
              <select
                value={formData.deviceScope}
                onChange={(e) =>
                  setFormData({ ...formData, deviceScope: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all bg-white"
              >
                <option value="all">📱 Todos (Android e iOS)</option>
                <option value="android">🤖 Solo Android</option>
                <option value="ios">🍎 Solo iOS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Sinónimos / Frases clave (separados por comas)
              </label>
              <input
                type="text"
                value={formData.phrases}
                onChange={(e) =>
                  setFormData({ ...formData, phrases: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all"
                placeholder="brillo, aumentar brillo, pantalla oscura, subir luminosidad..."
              />
              <p className="text-xs text-gray-400 mt-1">Estas frases ayudan a asociar videos con las preguntas del usuario</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleSave(editingId || undefined)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>

              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      name: '',
                      deviceScope: 'all',
                      phrases: '',
                    });
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Intents List */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Intenciones <span className="text-orange-500">({intents.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {intents.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <span className="text-4xl block mb-2">📭</span>
                No hay intenciones creadas aún
              </div>
            )}

            {intents.map((intent) => (
              <div key={intent.id} className="p-5 hover:bg-orange-50/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm">
                      {intent.deviceScope === 'ios' ? '🍎' : intent.deviceScope === 'android' ? '🤖' : '📱'}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-gray-800">
                        {intent.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {intent.deviceScope === 'all' ? 'Todos los dispositivos' : intent.deviceScope === 'ios' ? 'Solo iOS' : 'Solo Android'}
                        {intent.videos && intent.videos.length > 0 && (
                          <span className="ml-2 text-green-600">• {intent.videos.length} video(s)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(intent.id);
                        setFormData({
                          name: intent.name,
                          deviceScope: intent.deviceScope,
                          phrases: intent.phrases
                            .map((p) => p.phrase)
                            .join(', '),
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(intent.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {intent.phrases.map((p) => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium border border-orange-200"
                    >
                      {p.phrase}
                    </span>
                  ))}
                  {intent.phrases.length === 0 && (
                    <span className="text-xs text-gray-400 italic">Sin sinónimos</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
