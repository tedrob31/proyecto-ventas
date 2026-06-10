"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Store, UserCircle, ShieldCheck, LogOut, LayoutDashboard, Target, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { currentUser, setCurrentUser, fetchProducts, fetchSales, fetchUsers, fetchGoals, fetchRankingHistory } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Sincronizar usuarios siempre para el login
    fetchUsers();

    if (currentUser) {
      fetchProducts();
      fetchSales();
      fetchGoals();
      fetchRankingHistory();
    }
  }, [currentUser, fetchProducts, fetchSales, fetchUsers, fetchGoals, fetchRankingHistory]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <nav className="bg-zinc-900 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-pink-500" />
            <Link href="/" className="font-bold text-xl tracking-tight text-white hover:text-pink-400 transition-colors">
              Ventas
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {currentUser && (
              <>
                <Link href="/ventas/nuevo" className="text-sm font-medium hover:text-pink-400 transition-colors">
                  Nueva Venta
                </Link>
                <Link href="/ventas/historial" className="text-sm font-medium hover:text-pink-400 transition-colors">
                  Historial
                </Link>
                <Link href="/ranking" className="text-sm font-medium hover:text-amber-400 transition-colors">
                  Ranking 🏆
                </Link>
                {currentUser.rol === 'admin' && (
                  <>
                    <Link href="/dashboard" className="text-sm font-medium hover:text-pink-400 transition-colors flex items-center gap-1">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/admin/productos" className="text-sm font-medium hover:text-pink-400 transition-colors flex items-center gap-1">
                      <Settings className="w-4 h-4" /> Productos
                    </Link>
                    <Link href="/admin/metas" className="text-sm font-medium hover:text-pink-400 transition-colors flex items-center gap-1">
                      <Target className="w-4 h-4" /> Metas
                    </Link>
                    <Link href="/admin/usuarios" className="text-sm font-medium hover:text-pink-400 transition-colors flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Usuarios
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                  <UserCircle className="w-5 h-5 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-200">
                    {currentUser.nombre} <span className="text-xs text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded ml-1">{currentUser.rol}</span>
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-zinc-400 hover:text-white transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            {!currentUser && (
              <Link href="/login" className="text-sm font-medium hover:text-pink-400 transition-colors">
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
