import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-black">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-4 bg-pink-100 dark:bg-pink-900/30 rounded-full shadow-inner">
            <ShoppingBag className="w-16 h-16 text-pink-600 dark:text-pink-400" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Bienvenido a Ventas
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Sistema de gestión de ventas y control de inventario en tiempo real para tu negocio.
        </p>
        
        <div className="pt-6">
          <Link 
            href="/ventas/nuevo" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-500/20 w-full sm:w-auto"
          >
            Registrar Nueva Venta
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
