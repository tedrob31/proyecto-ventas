"use client";

import SalesForm from '@/components/SalesForm';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function NuevaVentaPage() {
  const { currentUser, sales, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated) {
      if (!currentUser) {
        router.push('/login');
      }
    }
  }, [currentUser, router, _hasHydrated]);

  if (!mounted || !_hasHydrated || !currentUser) return null;

  // Filtrar las últimas 10 ventas de la asesora logueada por orden de ingreso al sistema
  const misUltimasVentas = [...sales]
    .filter(s => s.asesora_nombre === currentUser.nombre)
    .reverse()
    .slice(0, 10);

  return (
    <main className="flex-1 p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Lado Izquierdo: Formulario de Registro Rápido */}
        <div className="w-full lg:w-[60%]">
          <SalesForm />
        </div>

        {/* Lado Derecho: Últimos Registros */}
        <div className="w-full lg:w-[40%] flex flex-col h-[calc(100vh-120px)]">
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold">Mis últimos registros</h2>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 scrollbar-thin">
            {misUltimasVentas.map(venta => (
              <div key={venta.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm hover:border-pink-500/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-xs text-zinc-500">
                    {new Date(venta.fecha_venta).toLocaleString()}
                  </div>
                  <div className="font-bold text-pink-600 dark:text-pink-400">
                    S/{venta.total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
                <div className="text-sm font-medium mb-1">Cliente: {venta.celular_cliente}</div>
                <div className="text-xs text-zinc-500">
                  {venta.detalles.reduce((acc, d) => acc + (d.cantidad || 1), 0)} prendas vendidas.
                </div>
              </div>
            ))}

            {misUltimasVentas.length === 0 && (
              <div className="text-center p-8 bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-500">
                Aún no has registrado ventas. 
                <br/>¡Tus próximas ventas aparecerán aquí!
              </div>
            )}
          </div>
        </div>

      </div>

    </main>
  );
}
