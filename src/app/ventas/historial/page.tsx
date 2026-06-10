"use client";

import { useEffect, useState } from 'react';
import { useStore, Sale } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { FileText, Search, Filter, Calendar, Phone, Trash2, Edit2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function HistorialVentasPage() {
  const { currentUser, sales, settings, deleteSale, deleteMultipleSales, updateSale, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [filterAsesora, setFilterAsesora] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCelular, setFilterCelular] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editFormData, setEditFormData] = useState({ fecha_venta: '', celular_cliente: '', total: 0 });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [filterAsesora, filterStartDate, filterEndDate, filterCelular, itemsPerPage]);

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated) {
      if (!currentUser) {
        router.push('/login');
      }
    }
  }, [currentUser, router, _hasHydrated]);

  if (!mounted || !_hasHydrated || !currentUser) return null;

  // Si es asesora y no tiene permiso para ver globales, forzar el filtro a su nombre
  const canSeeAll = currentUser.rol === 'admin' || settings.asesorasCanSeeGlobalStats;
  const appliedFilterAsesora = canSeeAll ? filterAsesora : currentUser.nombre;

  // Ordenados por ingreso (los últimos registrados primero)
  let filteredSales = [...sales].reverse();

  if (appliedFilterAsesora) {
    filteredSales = filteredSales.filter(s => s.asesora_nombre === appliedFilterAsesora);
  }
  
  if (filterStartDate) {
    filteredSales = filteredSales.filter(s => new Date(s.fecha_venta) >= new Date(filterStartDate));
  }
  
  if (filterEndDate) {
    const end = new Date(filterEndDate);
    end.setHours(23, 59, 59, 999);
    filteredSales = filteredSales.filter(s => new Date(s.fecha_venta) <= end);
  }
  
  if (filterCelular) {
    filteredSales = filteredSales.filter(s => s.celular_cliente.includes(filterCelular));
  }

  // Agrupar nombres únicos para el selector
  const asesorasUnicas = Array.from(new Set(sales.map(s => s.asesora_nombre)));

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedSales.length && paginatedSales.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedSales.map(s => s.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`¿Estás seguro que deseas ELIMINAR ${selectedIds.size} ventas de forma permanente? Se recalcularán todos los reportes.`)) {
      deleteMultipleSales(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-pink-500" />
            Historial de Ventas
          </h1>
          <p className="text-zinc-500 mt-1">Explora las órdenes registradas en el sistema.</p>
        </div>
      </div>

      {/* Panel de Filtros Avanzados */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <Filter className="w-5 h-5 text-pink-500" />
          <h3 className="font-bold text-lg">Filtros de Búsqueda</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {canSeeAll && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Asesora</label>
              <select value={filterAsesora} onChange={e => setFilterAsesora(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none text-sm">
                <option value="">Todas las Asesoras</option>
                {asesorasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Desde</label>
            <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none text-sm font-mono" />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Hasta</label>
            <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none text-sm font-mono" />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Celular / Dato</label>
            <input type="text" placeholder="Ej. 987..." value={filterCelular} onChange={e => setFilterCelular(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          {canSeeAll && selectedIds.size > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20 p-3 flex items-center justify-between px-4">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {selectedIds.size} {selectedIds.size === 1 ? 'venta seleccionada' : 'ventas seleccionadas'}
              </span>
              <button 
                onClick={handleDeleteSelected}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Eliminar Selección
              </button>
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                {canSeeAll && (
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                      checked={selectedIds.size === paginatedSales.length && paginatedSales.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="p-4 font-medium">Fecha y Hora</th>
                <th className="p-4 font-medium">Asesora</th>
                <th className="p-4 font-medium">Cliente (Dato)</th>
                <th className="p-4 font-medium text-center">Prendas</th>
                <th className="p-4 font-medium text-right">Total Cobrado</th>
                {canSeeAll && <th className="p-4 font-medium text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {paginatedSales.map((s) => (
                <tr key={s.id} className={clsx("transition-colors", selectedIds.has(s.id) ? "bg-pink-50/50 dark:bg-pink-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}>
                  {canSeeAll && (
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelection(s.id)}
                      />
                    </td>
                  )}
                  <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{new Date(s.fecha_venta).toLocaleString()}</td>
                  <td className="p-4 font-medium">{s.asesora_nombre}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{s.celular_cliente}</td>
                  <td className="p-4 text-center">{s.detalles.reduce((acc, d) => acc + (d.cantidad || 1), 0)}</td>
                  <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">S/{s.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  {canSeeAll && (
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => {
                        setEditingSale(s);
                        // Convertir a formato local datetime-local
                        const localISOTime = new Date(new Date(s.fecha_venta).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0,16);
                        setEditFormData({ fecha_venta: localISOTime, celular_cliente: s.celular_cliente, total: s.total });
                        setIsEditModalOpen(true);
                      }} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        if (confirm('¿Anular esta venta? Esta acción recalculará los reportes financieros.')) {
                          deleteSale(s.id);
                        }
                      }} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedSales.length === 0 && (
                <tr>
                  <td colSpan={canSeeAll ? 7 : 5} className="p-8 text-center text-zinc-500">
                    No se encontraron registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Mostrar</span>
            <select 
              value={itemsPerPage} 
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span>por página</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-500">
              Página {currentPage} de {Math.max(1, totalPages)} <span className="hidden sm:inline">({filteredSales.length} registros en total)</span>
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || totalPages === 0}
                className="p-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-lg font-bold">Editar Venta</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              updateSale(editingSale.id, {
                ...editingSale,
                fecha_venta: new Date(editFormData.fecha_venta).toISOString(),
                celular_cliente: editFormData.celular_cliente,
                total: editFormData.total
              });
              setIsEditModalOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fecha de Venta</label>
                <input required type="datetime-local" value={editFormData.fecha_venta} onChange={e => setEditFormData({...editFormData, fecha_venta: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cliente / Celular</label>
                <input required type="text" value={editFormData.celular_cliente} onChange={e => setEditFormData({...editFormData, celular_cliente: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Total Cobrado (S/)</label>
                <input required type="number" step="0.01" value={editFormData.total} onChange={e => setEditFormData({...editFormData, total: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 outline-none font-mono" />
                <p className="text-xs text-amber-600 mt-1">Nota: Modificar el total afectará los reportes de ganancia neta asumiendo que los costos de los productos no cambiaron.</p>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="submit" className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                  <Check className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
