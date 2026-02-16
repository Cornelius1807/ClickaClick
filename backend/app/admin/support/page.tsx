'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface SupportContact {
  id: string;
  name: string;
  phoneE164: string;
  isActive: boolean;
  isOnline: boolean;
}

export default function AdminSupport() {
  const router = useRouter();
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    fetchContacts();
  }, [router]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/support`, {
        headers: { 'admin-token': 'authenticated' },
      });
      setContacts(response.data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnline = async (contactId: string, isOnline: boolean) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/admin/support`,
        {
          action: 'toggle_contact',
          data: { contactId, isOnline: !isOnline },
        },
        {
          headers: { 'admin-token': 'authenticated' },
        }
      );

      fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-orange-700 font-semibold">Cargando soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestión de Soporte</h1>
              <p className="text-orange-100 text-sm">Administra voluntarios de soporte</p>
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
        {/* Contacts List */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">
              Voluntarios de Soporte <span className="text-orange-500">({contacts.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {contacts.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <span className="text-4xl block mb-2">👤</span>
                No hay voluntarios registrados
              </div>
            )}
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-5 flex justify-between items-center hover:bg-orange-50/50 transition-colors"
              >
                <div>
                  <h3 className="text-base font-bold text-gray-800">{contact.name}</h3>
                  <p className="text-sm text-gray-500">{contact.phoneE164}</p>
                  <div className="flex gap-2 mt-2">
                    {contact.isActive && (
                      <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-medium border border-green-200">
                        ✓ Activo
                      </span>
                    )}
                    {contact.isOnline && (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-200">
                        🟢 En línea
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleOnline(contact.id, contact.isOnline)}
                  className={`px-5 py-2 font-semibold rounded-xl text-sm text-white transition-all ${
                    contact.isOnline
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {contact.isOnline ? 'Marcar Offline' : 'Marcar Online'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mt-8">
          <h3 className="font-bold text-base text-orange-800 mb-2">ℹ️ Información de Horarios</h3>
          <p className="text-sm text-orange-700">
            Los horarios de soporte se configuran en la BD. Puedes editar
            directamente en Prisma Studio o mediante la API de admin.
          </p>
          <p className="mt-2 text-xs text-orange-500">
            Zona horaria: America/Lima
          </p>
        </div>
      </div>
    </div>
  );
}
