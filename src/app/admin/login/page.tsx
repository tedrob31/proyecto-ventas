"use client";

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Store } from 'lucide-react';
import { generateUUID } from '@/lib/uuid';

export default function AdminLoginPage() {
  const { users, setCurrentUser, addLoginLog } = useStore();
  const router = useRouter();
  
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admin = users.find(u => u.rol === 'admin' && (u.nombre === adminUser || 'admin' === adminUser) && u.pin === adminPass);
    
    if (admin) {
      addLoginLog({
        id: generateUUID(),
        userId: admin.id,
        nombre: admin.nombre,
        ip: 'ADMIN-ACCESS', // El admin no requiere rastreo estricto de IP
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      setCurrentUser(admin);
      router.push('/dashboard');
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="inline-flex items-center justify-center p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-pink-600 dark:text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold">Portal Administrativo</h1>
          <p className="text-sm text-zinc-500 mt-1">Acceso seguro sin restricciones de IP</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900 flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Usuario</label>
              <input 
                type="text" 
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow outline-none"
                placeholder="Ej. admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-pink-500/20 mt-4"
            >
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
