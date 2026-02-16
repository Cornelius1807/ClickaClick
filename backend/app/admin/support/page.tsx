'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      <div className="flex items-center justify-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestión de Soporte</h1>
          <a
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg"
          >
            ← Volver
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold p-6 border-b">
            Voluntarios de Soporte ({contacts.length})
          </h2>

          <div className="divide-y">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-6 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <h3 className="text-lg font-bold">{contact.name}</h3>
                  <p className="text-gray-600">{contact.phoneE164}</p>
                  <div className="flex gap-2 mt-2">
                    {contact.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        ✓ Activo
                      </span>
                    )}
                    {contact.isOnline && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        🟢 En línea
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleOnline(contact.id, contact.isOnline)}
                  className={`px-6 py-2 font-bold rounded-lg text-white ${
                    contact.isOnline
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {contact.isOnline ? 'Marcar Offline' : 'Marcar Online'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-8">
          <h3 className="font-bold text-lg mb-2">ℹ️ Información de Horarios</h3>
          <p>
            Los horarios de soporte se configuran en la BD. Actualmente están
            en formato JSON. Puedes editar directamente en Prisma Studio o
            mediante la API de admin.
          </p>
          <p className="mt-2 text-sm">
            Tiempo del servidor: America/Lima
          </p>
        </div>
      </div>
    </div>
  );
}
