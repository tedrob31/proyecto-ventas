"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Store, User, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { generateUUID } from '@/lib/uuid';

export default function LoginPage() {
  const { users, setCurrentUser, addLoginLog, settings } = useStore();
  const router = useRouter();
  
  const [selectedAsesoraId, setSelectedAsesoraId] = useState('');
  const [asesoraPin, setAsesoraPin] = useState('');
  
  const [error, setError] = useState('');
  
  const [currentIp, setCurrentIp] = useState('Obteniendo IP...');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setCurrentIp(data.ip))
      .catch(() => setCurrentIp('Desconocida'));
  }, []);

  const asesoras = users.filter(u => u.rol === 'asesora');
  const isIpAllowed = settings.allowedIps.includes(currentIp) || settings.allowedIps.length === 0 || currentIp === 'Desconocida' || currentIp === 'Obteniendo IP...';

  const handleAsesoraLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedAsesoraId && u.pin === asesoraPin);
    
    if (user) {
      const isAllowed = settings.allowedIps.includes(currentIp) || settings.allowedIps.length === 0 || currentIp === 'Desconocida';

      addLoginLog({
        id: generateUUID(),
        userId: user.id,
        nombre: user.nombre,
        ip: currentIp,
        timestamp: new Date().toISOString(),
        status: isAllowed ? 'success' : 'blocked'
      });

      if (isAllowed) {
        setCurrentUser(user);
        router.push('/ventas/nuevo');
      } else {
        setError(`Acceso bloqueado: Tu IP (${currentIp}) no está autorizada.`);
      }
    } else {
      setError('PIN incorrecto o usuario no seleccionado');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className={clsx("w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border-2 overflow-hidden animate-in zoom-in duration-300 transition-colors", isIpAllowed ? "border-emerald-500" : "border-red-500")}>
        <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="inline-flex items-center justify-center p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full mb-4">
            <Store className="w-8 h-8 text-pink-600 dark:text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold">Iniciar Sesión</h1>
          <p className="text-sm text-zinc-500 mt-1">Portal exclusivo para Asesoras</p>
        </div>

        <div className="p-8">

          {error && (
            <div className="mb-6 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900 flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleAsesoraLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Selecciona tu Nombre</label>
              <select 
                value={selectedAsesoraId}
                onChange={(e) => setSelectedAsesoraId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow outline-none"
                required
              >
                <option value="" disabled>-- Elige tu perfil --</option>
                {asesoras.map(asesora => (
                  <option key={asesora.id} value={asesora.id}>{asesora.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">PIN (Contraseña)</label>
              <input 
                type="password" 
                value={asesoraPin}
                onChange={(e) => setAsesoraPin(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-shadow outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-pink-500/20 mt-4"
            >
              Ingresar al Sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
