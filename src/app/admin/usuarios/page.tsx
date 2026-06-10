"use client";

import { useEffect, useState } from 'react';
import { useStore, User } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Trash2, X, Check, Edit2, Activity } from 'lucide-react';
import { generateUUID } from '@/lib/uuid';
import clsx from 'clsx';

export default function AdminUsuariosPage() {
  const { currentUser, users, addUser, updateUser, deleteUser, loginLogs, settings, updateSettings, _hasHydrated, fetchLoginLogs, clearLoginLogs } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'logs' | 'config'>('usuarios');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: '', pin: '', celular: '', rol: 'asesora' as 'asesora' | 'admin' });
  const [newIp, setNewIp] = useState('');

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.rol !== 'admin') {
        router.push('/ventas/nuevo');
      } else {
        fetchLoginLogs();
      }
    }
  }, [currentUser, router, _hasHydrated, fetchLoginLogs]);

  if (!mounted || !_hasHydrated || !currentUser || currentUser.rol !== 'admin') return null;

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateUser(editingId, {
        ...formData,
        id: editingId,
        estado: 'activo'
      } as User);
    } else {
      addUser({
        id: generateUUID(),
        ...formData,
        estado: 'activo',
        fecha_creacion: new Date().toISOString()
      } as User);
    }
    setIsModalOpen(false);
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', pin: '', celular: '', rol: 'asesora' });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingId(u.id);
    setFormData({ nombre: u.nombre, pin: u.pin, celular: u.celular || '', rol: u.rol });
    setIsModalOpen(true);
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIp && !settings.allowedIps.includes(newIp)) {
      updateSettings({ allowedIps: [...settings.allowedIps, newIp] });
      setNewIp('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    updateSettings({ allowedIps: settings.allowedIps.filter(i => i !== ip) });
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-pink-500" />
            Seguridad y Accesos
          </h1>
          <p className="text-zinc-500 mt-1">Gestiona los usuarios, restringe por IPs y revisa las auditorías.</p>
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button onClick={() => setActiveTab('usuarios')} className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2", activeTab === 'usuarios' ? "border-pink-500 text-pink-600 dark:text-pink-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}>
          Usuarios
        </button>
        <button onClick={() => setActiveTab('config')} className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2", activeTab === 'config' ? "border-pink-500 text-pink-600 dark:text-pink-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}>
          Reglas de IP
        </button>
        <button onClick={() => setActiveTab('logs')} className={clsx("px-6 py-3 text-sm font-medium transition-colors border-b-2", activeTab === 'logs' ? "border-pink-500 text-pink-600 dark:text-pink-400" : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300")}>
          Auditoría (Logs)
        </button>
      </div>

      {/* Pestaña: Usuarios */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openNewModal} className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
              <Plus className="w-5 h-5" /> Nuevo Usuario
            </button>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                  <th className="p-4 font-medium">Nombre</th>
                  <th className="p-4 font-medium">Celular</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="p-4 font-semibold">{u.nombre}</td>
                    <td className="p-4 text-zinc-500">{u.celular || 'No registrado'}</td>
                    <td className="p-4">
                      <span className={clsx("px-2 py-1 rounded text-xs font-bold", u.rol === 'admin' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}>
                        {u.rol.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(u)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(u.id)} disabled={u.id === currentUser.id} className="p-2 text-zinc-400 hover:text-red-500 disabled:opacity-30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pestaña: Config (IPs) */}
      {activeTab === 'config' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-4">Lista Blanca de IPs</h3>
            <p className="text-sm text-zinc-500 mb-4">Si agregas al menos una IP, el sistema bloqueará a las asesoras que intenten ingresar desde una red no autorizada.</p>
            
            <form onSubmit={handleAddIp} className="flex gap-2 mb-6">
              <input type="text" value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="Ej. 192.168.1.50" className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 outline-none font-mono" />
              <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-5 rounded-lg font-medium">Añadir</button>
            </form>

            <ul className="space-y-2">
              {settings.allowedIps.map(ip => (
                <li key={ip} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
                  <span className="font-mono text-sm">{ip}</span>
                  <button onClick={() => handleRemoveIp(ip)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
              {settings.allowedIps.length === 0 && (
                <li className="text-sm text-zinc-500 p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-center">
                  Ninguna IP configurada (Acceso Abierto).
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Pestaña: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex justify-end p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <button 
              onClick={() => { if(confirm('¿Estás seguro de vaciar todo el historial de accesos?')) clearLoginLogs(); }} 
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-sm disabled:opacity-50"
              disabled={loginLogs.length === 0}
            >
              <Trash2 className="w-4 h-4" /> Vaciar Registros
            </button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                <th className="p-4 font-medium">Fecha y Hora</th>
                <th className="p-4 font-medium">Usuario</th>
                <th className="p-4 font-medium">IP de Origen</th>
                <th className="p-4 font-medium text-center">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm font-mono">
              {loginLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">{log.nombre}</td>
                  <td className="p-4">{log.ip}</td>
                  <td className="p-4 text-center">
                    {log.status === 'success' ? (
                      <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold">AUTORIZADO</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">BLOQUEADO</span>
                    )}
                  </td>
                </tr>
              ))}
              {loginLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 font-sans">
                    No hay registros de inicio de sesión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-lg font-bold">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre Completo</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">PIN / Contraseña</label>
                <input required type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Celular</label>
                <input type="text" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rol</label>
                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as 'asesora' | 'admin'})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none">
                  <option value="asesora">Asesora</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="submit" className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
