'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Video {
  id: string;
  title: string;
  youtubeId?: string;
  intentName: string;
  device: string;
}

export default function AdminVideos() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [intents, setIntents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    intentId: '',
    device: 'android',
    youtubeId: '',
    title: '',
    durationSeconds: '',
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

    try {
      await axios.post(`${BACKEND_URL}/api/admin/videos`, {
        ...formData,
        durationSeconds: formData.durationSeconds
          ? parseInt(formData.durationSeconds)
          : null,
      }, {
        headers: { 'admin-token': 'authenticated' },
      });

      setFormData({
        intentId: '',
        device: 'android',
        youtubeId: '',
        title: '',
        durationSeconds: '',
      });

      fetchData();
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Error al guardar video');
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
          <h1 className="text-3xl font-bold">Gestión de Videos</h1>
          <a
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg"
          >
            ← Volver
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">➕ Nuevo Video</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Intención
                </label>
                <select
                  value={formData.intentId}
                  onChange={(e) =>
                    setFormData({ ...formData, intentId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Selecciona una intención</option>
                  {intents.map((intent) => (
                    <option key={intent.id} value={intent.id}>
                      {intent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Dispositivo
                </label>
                <select
                  value={formData.device}
                  onChange={(e) =>
                    setFormData({ ...formData, device: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                YouTube ID
              </label>
              <input
                type="text"
                value={formData.youtubeId}
                onChange={(e) =>
                  setFormData({ ...formData, youtubeId: e.target.value })
                }
                placeholder="dQw4w9WgXcQ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Cómo aumentar brillo en Android"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Duración (segundos)
              </label>
              <input
                type="number"
                value={formData.durationSeconds}
                onChange={(e) =>
                  setFormData({ ...formData, durationSeconds: e.target.value })
                }
                placeholder="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              Guardar Video
            </button>
          </form>
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold p-6 border-b">
            Videos ({videos.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {videos.map((video) => (
              <div key={video.id} className="border rounded-lg p-4 hover:shadow-md">
                <h3 className="font-bold text-lg mb-2">{video.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Intención: {video.intentName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Dispositivo: {video.device}
                </p>
                {video.youtubeId && (
                  <p className="text-sm text-gray-600">
                    YouTube ID: {video.youtubeId}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
