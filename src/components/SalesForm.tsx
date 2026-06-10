"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { parseOrderText } from '@/lib/orderParser';
import { generateUUID } from '@/lib/uuid';
import { ShoppingBag, Calculator, Package, Truck, Ticket, Calendar } from 'lucide-react';

export default function SalesForm() {
  const { products, addSale, currentUser } = useStore();
  
  const [clientData, setClientData] = useState('');
  const [orderText, setOrderText] = useState('');
  
  const [isToday, setIsToday] = useState(true);
  
  // Fecha persitente solo para la sesión actual (sin localStorage compartido)
  const [fechaVenta, setFechaVenta] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0,16);
    return localISOTime;
  });

  const handleDateChange = (val: string) => {
    setFechaVenta(val);
  };
  
  const handleToggleToday = (val: boolean) => {
    setIsToday(val);
  };
  
  const [embalaje, setEmbalaje] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [envio, setEnvio] = useState(0);
  const [descuento, setDescuento] = useState(0);

  // Cálculos internos
  const parsedItems = useMemo(() => parseOrderText(orderText, products), [orderText, products]);
  const subtotalProductos = parsedItems.reduce((acc, item) => acc + item.subtotal, 0);
  
  const total = subtotalProductos + embalaje + delivery + envio - descuento;

  const handleSave = () => {
    if (!clientData.trim() || parsedItems.length === 0 || !currentUser) {
      alert('Por favor ingresa los datos del cliente y al menos un producto válido.');
      return;
    }

    const finalDate = isToday ? new Date().toISOString() : new Date(fechaVenta).toISOString();

    addSale({
      id: generateUUID(),
      fecha_venta: finalDate,
      asesora_nombre: currentUser.nombre,
      celular_cliente: clientData,
      embalaje,
      delivery,
      envio,
      descuento,
      total,
      estado: 'completado',
      detalles: parsedItems.map(item => ({
        id: generateUUID(),
        producto_id: item.matchedProduct?.id || 'unknown',
        cantidad: item.quantity,
        precio_aplicado: item.priceApplied,
        costo_aplicado: item.costoAplicado,
        subtotal: item.subtotal
      }))
    });

    // Resetear form
    setClientData('');
    setOrderText('');
    setEmbalaje(0);
    setDelivery(0);
    setEnvio(0);
    setDescuento(0);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-left-4 duration-500">
      
      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <ShoppingBag className="w-6 h-6 text-pink-500" />
            Registro de Venta
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Completa los datos rápidamente para registrar la orden.</p>
        </div>

        <div className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Datos del Cliente / Celular
            </label>
            <input 
              type="text" 
              value={clientData}
              onChange={(e) => setClientData(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all outline-none"
              placeholder="Ej. 987654321 o texto de datos..."
            />
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <Calendar className="w-4 h-4 text-pink-500" /> Fecha de Registro
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isToday} onChange={e => handleToggleToday(e.target.checked)} />
                <div className="w-11 h-6 bg-zinc-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-pink-600"></div>
                <span className="ml-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Hoy (Auto)</span>
              </label>
            </div>
            
            {!isToday && (
              <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                <input 
                  type="datetime-local" 
                  value={fechaVenta}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none font-mono shadow-sm"
                />
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">¡Atención! Estás registrando una venta con fecha manual. La fecha se quedará fija hasta que vuelvas a activar el modo "Hoy".</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <Package className="w-4 h-4 text-emerald-500" /> Embalaje
              </label>
              <input type="number" min="0" step="0.5" value={embalaje} onChange={e => setEmbalaje(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-mono" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <Truck className="w-4 h-4 text-blue-500" /> Delivery
              </label>
              <input type="number" min="0" step="0.5" value={delivery} onChange={e => setDelivery(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-mono" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <Truck className="w-4 h-4 text-purple-500" /> Envío
              </label>
              <input type="number" min="0" step="0.5" value={envio} onChange={e => setEnvio(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none font-mono" />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <Ticket className="w-4 h-4 text-pink-500" /> Descuento
              </label>
              <input type="number" min="0" step="0.5" value={descuento} onChange={e => setDescuento(parseFloat(e.target.value) || 0)} className="w-full bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900 rounded-lg px-3 py-2 outline-none font-mono text-pink-700 dark:text-pink-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Lista de Productos
            </label>
            <textarea 
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              className="w-full h-32 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none resize-none font-mono leading-relaxed"
              placeholder="Pega aquí los códigos..."
            />
          </div>

        </div>

      </div>

      <div className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex-1 w-full grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Subtotal Productos:</span>
              <span className="font-mono font-medium">S/{subtotalProductos.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Cargos Adicionales:</span>
              <span className="font-mono font-medium">S/{(embalaje + delivery + envio).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-pink-600 dark:text-pink-400 font-medium">
              <span>Descuentos:</span>
              <span className="font-mono">-S/{descuento.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-emerald-600 dark:text-emerald-400 border-t border-zinc-200 dark:border-zinc-800 pt-2 col-span-2">
              <span>Total a Cobrar:</span>
              <span className="font-mono">S/{total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={parsedItems.length === 0 || !clientData}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-300 disabled:text-zinc-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/20 disabled:shadow-none"
          >
            <Calculator className="w-5 h-5" />
            Registrar Orden
          </button>

        </div>
      </div>

    </div>
  );
}
