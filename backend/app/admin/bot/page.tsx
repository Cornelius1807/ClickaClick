'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
    answerText: '',
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

      if (intentId) {
        await axios.put(`${BACKEND_URL}/api/admin/intents/${intentId}`, {
          ...formData,
          phrases,
        }, {
          headers: { 'admin-token': 'authenticated' },
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/intents`, {
          ...formData,
          phrases,
        }, {
          headers: { 'admin-token': 'authenticated' },
        });
      }

      setEditingId(null);
      setFormData({ name: '', deviceScope: 'all', answerText: '', phrases: '' });
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
      <div className="flex items-center justify-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Editor de Bot - Intenciones</h1>
          <a
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg"
          >
            ← Volver
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* New Intent Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingId ? '✏️ Editar' : '➕ Nueva Intención'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Ej: Aumentar brillo"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Alcance del Dispositivo
              </label>
              <select
                value={formData.deviceScope}
                onChange={(e) =>
                  setFormData({ ...formData, deviceScope: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Todos (Android e iOS)</option>
                <option value="android">Solo Android</option>
                <option value="ios">Solo iOS</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Respuesta
              </label>
              <textarea
                value={formData.answerText}
                onChange={(e) =>
                  setFormData({ ...formData, answerText: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="Respuesta por defecto..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Sinónimos (separados por comas)
              </label>
              <input
                type="text"
                value={formData.phrases}
                onChange={(e) =>
                  setFormData({ ...formData, phrases: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="brillo, aumentar brillo, pantalla oscura, ..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSave(editingId || undefined)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
              >
                Guardar
              </button>

              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      name: '',
                      deviceScope: 'all',
                      answerText: '',
                      phrases: '',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Intents List */}
        <div className="bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold p-6 border-b">
            Intenciones ({intents.length})
          </h2>

          <div className="divide-y">
            {intents.map((intent) => (
              <div key={intent.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {intent.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Alcance: {intent.deviceScope}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(intent.id);
                        setFormData({
                          name: intent.name,
                          deviceScope: intent.deviceScope,
                          answerText: intent.answerText,
                          phrases: intent.phrases
                            .map((p) => p.phrase)
                            .join(', '),
                        });
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(intent.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mb-2">{intent.answerText}</p>

                <div className="flex flex-wrap gap-1">
                  {intent.phrases.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {p.phrase}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
