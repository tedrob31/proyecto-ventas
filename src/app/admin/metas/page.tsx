"use client";

import { useEffect, useState } from 'react';
import { useStore, Goal, GoalMetric, GoalTier } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Target, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { generateUUID } from '@/lib/uuid';
import clsx from 'clsx';

export default function MetasAdminPage() {
  const { currentUser, goals, addGoal, updateGoal, deleteGoal, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Goal>>({
    name: '',
    metric: 'ordenes',
    target: 0,
    is_active: true,
    has_tiers: false,
    tiers: [],
    mes: new Date().getMonth(),
    anio: new Date().getFullYear()
  });

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  // Años disponibles (año pasado, actual y próximo)
  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated) {
      if (!currentUser) {
        router.push('/login');
      } else if (currentUser.rol !== 'admin') {
        router.push('/ventas/nuevo');
      }
    }
  }, [currentUser, router, _hasHydrated]);

  if (!mounted || !_hasHydrated || !currentUser || currentUser.rol !== 'admin') return null;

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', metric: 'ordenes', target: 0, is_active: true, has_tiers: false, tiers: [], mes: new Date().getMonth(), anio: new Date().getFullYear() });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingId(goal.id);
    setFormData({ ...goal, tiers: goal.tiers || [] });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar escalones
    let finalTiers = formData.tiers || [];
    if (formData.has_tiers) {
      finalTiers = finalTiers.filter(t => t.name.trim() !== '' && t.target > 0).sort((a, b) => a.target - b.target);
      if (finalTiers.length === 0) {
        alert("Si activas escalones, debes añadir al menos uno válido.");
        return;
      }
    }

    const payload: Goal = {
      ...(formData as Goal),
      id: editingId || generateUUID(),
      tiers: finalTiers,
      target: formData.has_tiers && finalTiers.length > 0 ? finalTiers[finalTiers.length - 1].target : (formData.target || 0)
    };

    if (editingId) {
      updateGoal(editingId, payload);
    } else {
      addGoal(payload);
    }
    setIsModalOpen(false);
  };

  const toggleActive = (goal: Goal) => {
    updateGoal(goal.id, { ...goal, is_active: !goal.is_active });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta meta? Esto la borrará del ranking permanentemente.')) {
      deleteGoal(id);
    }
  };

  const updateTier = (index: number, field: keyof GoalTier, value: any) => {
    const newTiers = [...(formData.tiers || [])];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const addTier = () => {
    if ((formData.tiers || []).length >= 3) return;
    setFormData({ ...formData, tiers: [...(formData.tiers || []), { name: '', target: 0 }] });
  };

  const removeTier = (index: number) => {
    const newTiers = [...(formData.tiers || [])];
    newTiers.splice(index, 1);
    setFormData({ ...formData, tiers: newTiers });
  };

  const metricLabels: Record<GoalMetric, string> = {
    ordenes: 'Cantidad de Ventas',
    prendas: 'Prendas Vendidas',
    monto: 'Dinero Recaudado (Soles)'
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500 space-y-8">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Target className="w-8 h-8 text-pink-500" />
            Configuración de Metas
          </h1>
          <p className="text-zinc-500 mt-1">
            Define los objetivos mensuales y escalones para fomentar la competencia.
          </p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-pink-500/20"
        >
          <Plus className="w-5 h-5" /> Nueva Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(g => (
          <div key={g.id} className={clsx("relative p-6 rounded-2xl border transition-all shadow-sm flex flex-col", g.is_active ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 opacity-60 grayscale")}>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={clsx("w-3 h-3 rounded-full", g.is_active ? "bg-emerald-500" : "bg-zinc-400")} />
                <span className="text-sm font-bold text-zinc-500">{g.is_active ? 'ACTIVA' : 'INACTIVA'}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(g)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(g.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-1">{g.name}</h3>
            <div className="flex gap-2 mb-4">
              <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-md font-bold uppercase">
                {monthNames[g.mes]} {g.anio}
              </span>
            </div>
            <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-6 flex-1">Mide: {metricLabels[g.metric]}</p>

            {g.has_tiers && g.tiers && g.tiers.length > 0 ? (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-zinc-400 uppercase">Escalones configurados:</span>
                {g.tiers.map((t, idx) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-3 flex justify-between text-sm border border-zinc-100 dark:border-zinc-800">
                    <span className="text-zinc-600 dark:text-zinc-400">{t.name}</span>
                    <span className="font-bold font-mono">{g.metric === 'monto' ? `S/${t.target}` : t.target}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 flex items-center justify-between border border-zinc-100 dark:border-zinc-800 mb-4">
                <span className="text-sm text-zinc-500">Objetivo Fijo:</span>
                <span className="font-mono font-bold text-xl text-zinc-900 dark:text-zinc-100">
                  {g.metric === 'monto' ? `S/${g.target.toFixed(2)}` : g.target}
                </span>
              </div>
            )}

            <button 
              onClick={() => toggleActive(g)}
              className={clsx("w-full py-2 rounded-xl text-sm font-bold transition-colors border mt-auto", g.is_active ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/40" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:hover:bg-emerald-900/40")}
            >
              {g.is_active ? 'Desactivar Meta' : 'Activar Meta'}
            </button>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-500">
            <Target className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold mb-1">No hay metas configuradas</h3>
            <p>Crea tu primera meta para motivar a tu equipo de ventas.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800 my-8">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-pink-500" />
                {editingId ? 'Editar Meta' : 'Nueva Meta'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre del Bono / Meta</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" placeholder="Ej. Reina de Ventas Mensual" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">¿Qué atributo se va a medir?</label>
                <select value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value as GoalMetric})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none">
                  <option value="ordenes">Cantidad Total de Ventas Registradas</option>
                  <option value="prendas">Cantidad Total de Prendas/Productos</option>
                  <option value="monto">Dinero Total Recaudado (Soles)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mes de la Meta</label>
                  <select value={formData.mes} onChange={e => setFormData({...formData, mes: parseInt(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none">
                    {monthNames.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Año</label>
                  <select value={formData.anio} onChange={e => setFormData({...formData, anio: parseInt(e.target.value)})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Estado de la Meta</h4>
                  <p className="text-xs text-zinc-500">¿Está activa actualmente para el ranking?</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.is_active || false} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                  <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Meta Escalonada (Tiers)</h4>
                    <p className="text-xs text-zinc-500">Añade varios niveles (ej. Normal, Experto)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={formData.has_tiers || false} onChange={e => setFormData({...formData, has_tiers: e.target.checked})} />
                    <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {formData.has_tiers ? (
                  <div className="mt-4 space-y-3">
                    {(formData.tiers || []).map((t, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input required type="text" value={t.name} onChange={e => updateTier(idx, 'name', e.target.value)} placeholder="Ej. Mínimo" className="w-1/2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-pink-500" />
                        <input required type="number" step={formData.metric === 'monto' ? '0.01' : '1'} min="1" value={t.target || ''} onChange={e => updateTier(idx, 'target', parseFloat(e.target.value) || 0)} placeholder="Objetivo" className="w-1/3 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-pink-500" />
                        <button type="button" onClick={() => removeTier(idx)} className="p-2 text-zinc-400 hover:text-red-500 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    ))}
                    {(formData.tiers || []).length < 3 && (
                      <button type="button" onClick={addTier} className="text-sm font-medium text-pink-600 hover:text-pink-700 flex items-center gap-1 mt-2">
                        <Plus className="w-4 h-4"/> Añadir Escalón (Max 3)
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-amber-600 mt-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" /> Los escalones deben ordenarse de menor a mayor exigencia.
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Monto Fijo Objetivo</label>
                    <input required={!formData.has_tiers} type="number" step={formData.metric === 'monto' ? '0.01' : '1'} min="1" value={formData.target || ''} onChange={e => setFormData({...formData, target: parseFloat(e.target.value) || 0})} className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono text-lg" placeholder="Ej. 150" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-zinc-600 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/20">
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
