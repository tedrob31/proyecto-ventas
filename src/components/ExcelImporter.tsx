"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { generateUUID } from '@/lib/uuid';
import { Product, useStore } from '@/store/useStore';
import { Upload, X, ArrowRight, Save, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface ExcelImporterProps {
  onClose: () => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'success';
type DuplicateStrategy = 'overwrite' | 'skip';

export default function ExcelImporter({ onClose }: ExcelImporterProps) {
  const { products, addProduct, updateProduct } = useStore();
  const [step, setStep] = useState<Step>('upload');
  
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  
  // Mapeo automático inteligente inicial
  const [mapping, setMapping] = useState<Record<string, string>>({
    proveedor: 'PROVEEDOR',
    codigo: 'CODIGO',
    numero: 'NUMERO',
    nombre: 'NOMBRE_PRODUCTO',
    precio: 'PRECIO',
    precio_costo: 'PRECIO_COMPRA',
    precio_liquidacion: 'PRECIO_LIQUIDACION'
  });

  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [stats, setStats] = useState({ new: 0, updated: 0, skipped: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = [
    { id: 'proveedor', label: 'Proveedor' },
    { id: 'codigo', label: 'Código' },
    { id: 'numero', label: 'Número' },
    { id: 'nombre', label: 'Nombre del Producto' },
    { id: 'precio', label: 'Precio Normal' },
    { id: 'precio_costo', label: 'Precio Costo (Compra)' },
    { id: 'precio_liquidacion', label: 'Precio Liquidación' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      
      if (data.length > 0) {
        const headers = Object.keys(data[0] as object);
        setRawHeaders(headers);
        setRawData(data);
        
        // Auto-match if possible
        const newMapping = { ...mapping };
        headers.forEach(h => {
          const upper = h.toUpperCase().trim();
          if (upper === 'PROVEEDOR') newMapping.proveedor = h;
          if (upper === 'CODIGO') newMapping.codigo = h;
          if (upper === 'NUMERO') newMapping.numero = h;
          if (upper === 'NOMBRE_PRODUCTO' || upper === 'NOMBRE') newMapping.nombre = h;
          if (upper === 'PRECIO') newMapping.precio = h;
          if (upper === 'PRECIO_COMPRA' || upper === 'PRECIO_COSTO') newMapping.precio_costo = h;
          if (upper === 'PRECIO_LIQUIDACION') newMapping.precio_liquidacion = h;
        });
        setMapping(newMapping);
        setStep('mapping');
      } else {
        alert("El archivo Excel está vacío.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (fieldId: string, header: string) => {
    setMapping(prev => ({ ...prev, [fieldId]: header }));
  };

  const generatePreview = () => {
    // Verificar que los campos clave estén mapeados
    if (!mapping.codigo || !mapping.numero || !mapping.nombre || !mapping.precio) {
      alert("Debes mapear como mínimo el Código, Número, Nombre y Precio normal.");
      return;
    }

    let news = 0;
    let updates = 0;
    let skips = 0;

    const parsed = rawData.map(row => {
      // Normalizar valores
      const proveedor = (row[mapping.proveedor] || '').toString().trim().toUpperCase();
      const codigo = (row[mapping.codigo] || '').toString().trim().toUpperCase();
      const numero = parseInt(row[mapping.numero]) || 0;
      const nombre = (row[mapping.nombre] || '').toString().trim();
      const precio = parseFloat(row[mapping.precio]) || 0;
      const precio_costo = parseFloat(row[mapping.precio_costo]) || 0;
      const precio_liquidacion = parseFloat(row[mapping.precio_liquidacion]) || 0;

      // Buscar duplicado
      const existingProduct = products.find(p => p.codigo === codigo && p.numero === numero);
      
      let status: 'new' | 'update' | 'skip' = 'new';
      
      if (existingProduct) {
        if (strategy === 'overwrite') {
          status = 'update';
          updates++;
        } else {
          status = 'skip';
          skips++;
        }
      } else {
        news++;
      }

      return {
        id: existingProduct ? existingProduct.id : generateUUID(),
        proveedor,
        codigo,
        numero,
        nombre,
        precio,
        precio_costo,
        precio_liquidacion,
        fecha: existingProduct ? existingProduct.fecha : new Date().toISOString(),
        _status: status
      };
    });

    setStats({ new: news, updated: updates, skipped: skips, total: parsed.length });
    setPreviewRows(parsed);
    setStep('preview');
  };

  const executeImport = () => {
    previewRows.forEach(row => {
      const { _status, ...productData } = row;
      if (_status === 'new') {
        addProduct(productData as Product);
      } else if (_status === 'update') {
        updateProduct(productData.id, productData as Product);
      }
    });
    setStep('success');
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            Importador Masivo de Excel
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-in fade-in zoom-in-95">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Sube tu archivo .xlsx</h3>
                <p className="text-zinc-500 max-w-md mx-auto">
                  Arrastra tu archivo aquí o haz clic para buscarlo. Asegúrate de que la primera fila contenga los nombres de las columnas.
                </p>
              </div>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                Buscar Archivo
              </button>
            </div>
          )}

          {step === 'mapping' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
              <div>
                <h3 className="text-lg font-bold mb-1">Mapeo de Columnas</h3>
                <p className="text-sm text-zinc-500">He detectado estas columnas en tu Excel. Confirma a qué campo de nuestro sistema corresponde cada una.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map(field => (
                  <div key={field.id} className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                      {field.label}
                    </label>
                    <select 
                      value={mapping[field.id] || ''}
                      onChange={(e) => handleMappingChange(field.id, e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Ignorar este campo --</option>
                      {rawHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl">
                <h4 className="font-bold text-amber-800 dark:text-amber-500 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Configuración de Duplicados
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-600 mb-3">Si subes un producto que ya existe (mismo Código y Número), ¿qué hacemos?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="radio" name="strategy" checked={strategy === 'skip'} onChange={() => setStrategy('skip')} className="text-emerald-600 focus:ring-emerald-500" />
                    Ignorar (Dejar el producto existente intacto)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="radio" name="strategy" checked={strategy === 'overwrite'} onChange={() => setStrategy('overwrite')} className="text-emerald-600 focus:ring-emerald-500" />
                    Sobreescribir (Actualizar precios y datos con el Excel)
                  </label>
                </div>
              </div>

            </div>
          )}

          {step === 'preview' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Resumen de Importación</h3>
                  <p className="text-sm text-zinc-500">Revisa lo que va a suceder antes de guardar.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                    <div className="text-xl font-bold">{stats.new}</div>
                    <div className="text-xs font-medium">Nuevos</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                    <div className="text-xl font-bold">{stats.updated}</div>
                    <div className="text-xs font-medium">A Actualizar</div>
                  </div>
                  <div className="text-center px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl">
                    <div className="text-xl font-bold">{stats.skipped}</div>
                    <div className="text-xs font-medium">Omitidos</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 sticky top-0">
                    <tr>
                      <th className="p-3 font-medium">Estado</th>
                      <th className="p-3 font-medium">Código</th>
                      <th className="p-3 font-medium">Nombre</th>
                      <th className="p-3 font-medium">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewRows.slice(0, 50).map((row, i) => (
                      <tr key={i} className={clsx(row._status === 'skip' && 'opacity-50 grayscale')}>
                        <td className="p-3">
                          {row._status === 'new' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">NUEVO</span>}
                          {row._status === 'update' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">ACTUALIZAR</span>}
                          {row._status === 'skip' && <span className="bg-zinc-200 text-zinc-600 px-2 py-1 rounded text-xs font-bold">OMITIDO</span>}
                        </td>
                        <td className="p-3 font-mono">{row.codigo}-{row.numero}</td>
                        <td className="p-3">{row.nombre}</td>
                        <td className="p-3">S/{row.precio.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewRows.length > 50 && (
                  <div className="p-4 text-center text-zinc-500 text-xs bg-zinc-50 dark:bg-zinc-950">
                    Mostrando los primeros 50 registros de {previewRows.length} totales.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold">¡Importación Exitosa!</h3>
              <p className="text-zinc-500">Se han procesado {stats.total} registros correctamente en la base de datos local.</p>
              <button onClick={onClose} className="mt-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                Volver a Productos
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step !== 'upload' && step !== 'success' && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex justify-end gap-3 shrink-0">
            <button onClick={() => {
              if (step === 'preview') setStep('mapping');
              else if (step === 'mapping') setStep('upload');
            }} className="px-6 py-2.5 text-zinc-600 font-medium hover:bg-zinc-200/50 rounded-xl transition-colors">
              Atrás
            </button>
            
            {step === 'mapping' && (
              <button onClick={generatePreview} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 'preview' && (
              <button onClick={executeImport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20">
                <Save className="w-4 h-4" /> Importar Ahora
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
