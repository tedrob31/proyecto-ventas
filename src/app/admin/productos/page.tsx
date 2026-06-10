"use client";

import { useEffect, useState } from 'react';
import { useStore, Product } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Settings, Plus, Edit2, Trash2, X, Check, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import ExcelImporter from '@/components/ExcelImporter';
import { generateUUID } from '@/lib/uuid';
import clsx from 'clsx';

export default function AdminProductosPage() {
  const { currentUser, products, addProduct, updateProduct, deleteProduct, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelImporterOpen, setIsExcelImporterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Campos del formulario
  const [formData, setFormData] = useState<Partial<Product>>({
    nombre: '',
    proveedor: '',
    codigo: '',
    numero: 3,
    precio: 0,
    precio_costo: 0,
    precio_liquidacion: 0
  });

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!mounted || !_hasHydrated || !currentUser || currentUser.rol !== 'admin') return null;

  const filteredProducts = products.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.nombre.toLowerCase().includes(s) || 
           p.proveedor.toLowerCase().includes(s) || 
           p.codigo.toLowerCase().includes(s);
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', proveedor: '', codigo: '', numero: 3, precio: 0, precio_costo: 0, precio_liquidacion: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      nombre: p.nombre,
      proveedor: p.proveedor,
      codigo: p.codigo,
      numero: p.numero,
      precio: p.precio,
      precio_costo: p.precio_costo || 0,
      precio_liquidacion: p.precio_liquidacion
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateProduct(editingId, { ...formData } as Product);
    } else {
      addProduct({
        id: generateUUID(),
        ...formData,
        fecha: new Date().toISOString()
      } as Product);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto base? Se afectarán todas sus variaciones.')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-8 h-8 text-pink-500" />
            Catálogo de Productos
          </h1>
          <p className="text-zinc-500 mt-1">Administra las familias base de productos y sus reglas de variantes.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsExcelImporterOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-5 h-5" /> Importar Excel
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar por producto, proveedor o código..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
          />
        </div>
        <div className="text-sm text-zinc-500">
          Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Proveedor</th>
                <th className="p-4 font-medium text-center">Prefijo (Cod)</th>
                <th className="p-4 font-medium text-center">Letra + Nº</th>
                <th className="p-4 font-medium text-right">Costo Neto</th>
                <th className="p-4 font-medium text-right">Venta (Normal)</th>
                <th className="p-4 font-medium text-right">Venta (Liq)</th>
                <th className="p-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {paginatedProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">{p.nombre}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{p.proveedor}</td>
                  <td className="p-4 text-center">
                    <span className="font-mono bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-2 py-1 rounded font-bold">
                      {p.codigo}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-zinc-500">{p.numero}</td>
                  <td className="p-4 text-right text-zinc-600 dark:text-zinc-400 font-medium">S/{p.precio_costo?.toFixed(2) || '0.00'}</td>
                  <td className="p-4 text-right text-emerald-600 dark:text-emerald-500 font-medium">S/{p.precio.toFixed(2)}</td>
                  <td className="p-4 text-right text-amber-600 dark:text-amber-500 font-medium">S/{p.precio_liquidacion.toFixed(2)}</td>
                  <td className="p-4 flex items-center justify-center gap-2">
                    <button onClick={() => openEditModal(p)} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No hay productos en el catálogo. Comienza añadiendo uno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500">
              Página <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span> de <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nombre del Producto Base</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" placeholder="Ej. Polera Algodón" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Proveedor</label>
                <input required type="text" value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" placeholder="Ej. ARBAS" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prefijo (Código)</label>
                  <input required type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value.toUpperCase()})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono uppercase" placeholder="Ej. PCD" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Longitud de Dígitos</label>
                  <input required type="number" min="1" value={formData.numero} onChange={e => setFormData({...formData, numero: parseInt(e.target.value) || 0})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono" placeholder="Ej. 3" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Costo (Soles)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio_costo || 0} onChange={e => setFormData({...formData, precio_costo: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">P. Normal (Soles)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value) || 0})} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 dark:text-amber-500 mb-1">P. Liq (Soles)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio_liquidacion} onChange={e => setFormData({...formData, precio_liquidacion: parseFloat(e.target.value) || 0})} className="w-full bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-pink-500/20">
                  <Check className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {isExcelImporterOpen && (
        <ExcelImporter onClose={() => setIsExcelImporterOpen(false)} />
      )}

    </div>
  );
}
