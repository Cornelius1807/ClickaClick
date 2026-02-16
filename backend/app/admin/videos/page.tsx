'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Video {
  id: string;
  title: string;
  youtubeId?: string;
  device: string;
  intent?: { id: string; name: string };
}

// Extract YouTube ID from various URL formats or plain ID
function extractYoutubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Try matching full URLs
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  // If it looks like a plain ID (11 chars, valid chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return trimmed;
}

export default function AdminVideos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    intentId: '',
    device: 'android',
    youtubeUrl: '',
    title: '',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [videosRes, intentsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/admin/videos`, {
          headers: { 'admin-token': 'authenticated' },
        }),
        axios.get(`${BACKEND_URL}/api/admin/intents`, {
          headers: { 'admin-token': 'authenticated' },
        }),
      ]);

      setVideos(videosRes.data.videos);
      setIntents(intentsRes.data.intents);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const youtubeId = extractYoutubeId(formData.youtubeUrl);

    if (!youtubeId) {
      alert('Por favor ingresa un enlace de YouTube válido');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/admin/videos`, {
        intentId: formData.intentId,
        device: formData.device,
        youtubeId,
        title: formData.title,
      }, {
        headers: { 'admin-token': 'authenticated' },
      });

      setFormData({
        intentId: '',
        device: 'android',
        youtubeUrl: '',
        title: '',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error saving video:', error);
      if (error?.response?.status === 409 || error?.response?.data?.error?.includes('Unique')) {
        alert('Ya existe un video para esta intención y dispositivo');
      } else {
        alert('Error al guardar video');
      }
    }
  };

  const handleDelete = async (videoId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este video?')) {
      try {
        await axios.delete(`${BACKEND_URL}/api/admin/videos/${videoId}`, {
          headers: { 'admin-token': 'authenticated' },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Error al eliminar');
      }
    }
  };

  const previewYoutubeId = extractYoutubeId(formData.youtubeUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-orange-700 font-semibold">Cargando videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎥</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Videos</h1>
              <p className="text-orange-100 text-sm">Asocia videos de YouTube a intenciones</p>
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
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
            ➕ Nuevo Video
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                  Intención
                </label>
                <select
                  value={formData.intentId}
                  onChange={(e) =>
                    setFormData({ ...formData, intentId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all bg-white"
                >
                  <option value="">Selecciona una intención</option>
                  {intents.map((intent: any) => (
                    <option key={intent.id} value={intent.id}>
                      {intent.name} ({intent.deviceScope})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                  Dispositivo
                </label>
                <select
                  value={formData.device}
                  onChange={(e) =>
                    setFormData({ ...formData, device: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all bg-white"
                >
                  <option value="android">🤖 Android</option>
                  <option value="ios">🍎 iOS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Enlace de YouTube
              </label>
              <input
                type="text"
                value={formData.youtubeUrl}
                onChange={(e) =>
                  setFormData({ ...formData, youtubeUrl: e.target.value })
                }
                required
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">Pega el enlace completo o el ID del video</p>
            </div>

            {/* YouTube Preview */}
            {previewYoutubeId && previewYoutubeId.length === 11 && (
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={`https://img.youtube.com/vi/${previewYoutubeId}/mqdefault.jpg`}
                  alt="Vista previa"
                  className="w-full max-w-md mx-auto block"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Título del Video
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Cómo aumentar brillo en Android"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Guardar Video
            </button>
          </form>
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Videos <span className="text-orange-500">({videos.length})</span>
            </h2>
          </div>

          {videos.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <span className="text-4xl block mb-2">🎬</span>
              No hay videos cargados aún
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {videos.map((video) => (
              <div key={video.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                {/* Thumbnail */}
                {video.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg">▶</span>
                    </div>
                  </a>
                )}

                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2">{video.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-xs font-medium border border-orange-200">
                      {video.intent?.name || 'Sin intención'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                      {video.device === 'ios' ? '🍎 iOS' : '🤖 Android'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="w-full px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
