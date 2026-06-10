"use client";

import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, TrendingUp, DollarSign, Package, PieChart as PieChartIcon, Activity, Lightbulb, History, Users, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { getMonthStats, getTopProducts, calculateForecast, getHistoricalTable, getYearOverYear, getAsesorasBreakdown, getInsights } from '@/lib/analytics';
import clsx from 'clsx';

const COLORS = ['#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { currentUser, sales, products, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Estado para la exportación de Excel
  const [exportMonth, setExportMonth] = useState('all');
  const [exportYear, setExportYear] = useState('all');
  const [exportAsesora, setExportAsesora] = useState('all');

  // Estado para Gráfico y Top Productos
  const currentMonthStr = new Date().getMonth().toString();
  const currentYearStr = new Date().getFullYear().toString();
  const [topProdMonth, setTopProdMonth] = useState(currentMonthStr);
  const [topProdYear, setTopProdYear] = useState(currentYearStr);
  const [topProdLimit, setTopProdLimit] = useState(10);
  const [chartYear, setChartYear] = useState(currentYearStr);

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

  const stats = useMemo(() => {
    if (!mounted || !_hasHydrated) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const pastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const pastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentStats = getMonthStats(sales, currentMonth, currentYear);
    const pastStats = getMonthStats(sales, pastMonth, pastYear);

    const forecast = calculateForecast(currentStats, currentMonth);

    // Gráfico de línea: Ventas mensuales históricas (Últimos 6 meses)
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      let y = currentYear;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      const mStats = getMonthStats(sales, m, y);
      trendData.push({
        name: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][m],
        ingresos: mStats.ingresos,
        neta: mStats.gananciaNeta
      });
    }

    const topProds = getTopProducts(sales, products, 5);
    const insights = getInsights(sales);
    const historicalTable = getHistoricalTable(sales, showAllHistory ? 48 : 12);
    const yoyData = getYearOverYear(sales, currentYear - 1, currentYear);
    const breakdown = getAsesorasBreakdown(sales, currentMonth, currentYear);

    return {
      currentStats,
      pastStats,
      forecast,
      trendData,
      topProds,
      insights,
      historicalTable,
      yoyData,
      breakdown
    };

  }, [sales, products, mounted, showAllHistory]);

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const asesorasUnicas = Array.from(new Set(sales.map(s => s.asesora_nombre)));
  const availableYears = Array.from(new Set(sales.map(s => new Date(s.fecha_venta).getFullYear()))).sort((a, b) => b - a);
  if (!availableYears.includes(new Date().getFullYear())) availableYears.unshift(new Date().getFullYear());

  const filteredTopProds = useMemo(() => {
    let s = sales;
    if (topProdMonth !== 'all') s = s.filter(x => new Date(x.fecha_venta).getMonth() === parseInt(topProdMonth));
    if (topProdYear !== 'all') s = s.filter(x => new Date(x.fecha_venta).getFullYear() === parseInt(topProdYear));
    return getTopProducts(s, products, topProdLimit);
  }, [sales, products, topProdMonth, topProdYear, topProdLimit]);

  const chartData = useMemo(() => {
    const data = [];
    for (let m = 0; m < 12; m++) {
      const monthSales = sales.filter(s => new Date(s.fecha_venta).getMonth() === m && new Date(s.fecha_venta).getFullYear() === parseInt(chartYear));
      const row: any = { name: monthNames[m] };
      asesorasUnicas.forEach(a => {
        row[a] = monthSales.filter(s => s.asesora_nombre === a).reduce((sum, s) => sum + s.total, 0);
      });
      data.push(row);
    }
    return data;
  }, [sales, chartYear, asesorasUnicas]);

  const handleExportExcel = () => {
    let dataToExport = [...sales];

    // Filtrar por asesora
    if (exportAsesora !== 'all') {
      dataToExport = dataToExport.filter(s => s.asesora_nombre === exportAsesora);
    }

    // Filtrar por mes
    if (exportMonth !== 'all') {
      const targetMonth = parseInt(exportMonth, 10);
      dataToExport = dataToExport.filter(s => new Date(s.fecha_venta).getMonth() === targetMonth);
    }

    // Filtrar por año
    if (exportYear !== 'all') {
      const targetYear = parseInt(exportYear, 10);
      dataToExport = dataToExport.filter(s => new Date(s.fecha_venta).getFullYear() === targetYear);
    }

    // Ordenar por fecha cronológica descendente
    dataToExport.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime());

    // Formatear columnas
    const excelData = dataToExport.map(s => ({
      'Fecha': new Date(s.fecha_venta).toLocaleString(),
      'Asesora': s.asesora_nombre,
      'Cliente': s.celular_cliente,
      'Cantidad de Prendas': s.detalles.reduce((acc, d) => acc + (d.cantidad || 1), 0),
      'Total Cobrado (S/)': s.total
    }));

    if (excelData.length === 0) {
      alert('No hay datos para exportar con esos filtros.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");

    // Ancho de columnas aproximado
    ws['!cols'] = [
      { wch: 20 }, // Fecha
      { wch: 20 }, // Asesora
      { wch: 30 }, // Cliente
      { wch: 20 }, // Prendas
      { wch: 20 }  // Total
    ];

    const fileName = `Reporte_Ventas_${exportAsesora === 'all' ? 'Todas' : exportAsesora}_${exportMonth === 'all' ? 'Anual' : monthNames[parseInt(exportMonth, 10)]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (!mounted || !currentUser || currentUser.rol !== 'admin' || !stats) return null;

  const getPercentage = (current: number, past: number) => {
    if (past === 0) return current > 0 ? 100 : 0;
    return ((current - past) / past) * 100;
  };

  const cIngresos = getPercentage(stats.currentStats.ingresos, stats.pastStats.ingresos);
  const cNeta = getPercentage(stats.currentStats.gananciaNeta, stats.pastStats.gananciaNeta);

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-pink-500" />
            Panel Analítico Avanzado
          </h1>
          <p className="text-zinc-500 mt-1">Inteligencia de negocios y comparaciones interanuales en tiempo real.</p>
        </div>
      </div>

      {/* Insights Inteligentes */}
      {stats.insights.length > 0 && (
        <div className="bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-pink-700 dark:text-pink-400 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> Análisis del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.insights.map((insight, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Ingresos Brutos (Mes)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx("text-sm font-bold", cIngresos >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {cIngresos >= 0 ? '+' : ''}{cIngresos.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-400">vs mes ant.</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">S/{stats.currentStats.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Ganancia Neta (Mes)</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx("text-sm font-bold", cNeta >= 0 ? "text-emerald-500" : "text-red-500")}>
                  {cNeta >= 0 ? '+' : ''}{cNeta.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-400">vs mes ant.</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">S/{stats.currentStats.gananciaNeta.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Prendas Vendidas (Mes)</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.currentStats.prendasVendidas}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-amber-100">Pronóstico Cierre de Mes</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-200">Basado en IA estacional</span>
              </div>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">~S/{stats.forecast.estimatedTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico YOY */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            Comparativa Interanual (Ingresos)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.yoyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`S/${Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                />
                <Legend />
                <Bar name="Año Pasado" dataKey="year1" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar name="Año Actual" dataKey="year2" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pastel Asesoras */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Ventas por Asesora (Mes Actual)
          </h3>
          <div className="flex-1 min-h-[300px]">
            {stats.breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`S/${Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">Sin datos de asesoras este mes.</div>
            )}
          </div>
        </div>

        {/* Top Productos Más Vendidos */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Top Productos Vendidos
            </h3>
            <div className="flex flex-wrap gap-2">
              <select value={topProdMonth} onChange={e => setTopProdMonth(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">Todos los Meses</option>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={topProdYear} onChange={e => setTopProdYear(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">Todos los Años</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={topProdLimit} onChange={e => setTopProdLimit(Number(e.target.value))} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-amber-500">
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </select>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {filteredTopProds.length > 0 ? (
              <div className="space-y-3">
                {filteredTopProds.map((p, idx) => (
                  <div key={p.productoId} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-400">#{idx + 1}</span>
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{p.nombre}</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full text-xs">
                      {p.cantidadVendida} prendas
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">Sin ventas en este periodo.</div>
            )}
          </div>
        </div>

      </div>

      {/* Gráfico Analítico de Ventas Históricas por Asesora */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Ventas Históricas por Asesora
          </h3>
          <select value={chartYear} onChange={e => setChartYear(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold">
            {availableYears.map(y => <option key={y} value={y}>Año {y}</option>)}
          </select>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} tickFormatter={(v) => `S/${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any, name: any) => [`S/${Number(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, String(name)]}
              />
              <Legend />
              {asesorasUnicas.map((a, idx) => (
                <Line
                  key={a}
                  type="monotone"
                  dataKey={a}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla Histórica */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-blue-500" />
            Reporte de Cierres Históricos
          </h3>
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
          >
            {showAllHistory ? 'Ver Últimos 12 Meses' : 'Cargar Toda la Historia'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Período</th>
                <th className="p-4 font-medium text-right">Ingresos Totales</th>
                <th className="p-4 font-medium text-right">Ganancia Neta</th>
                <th className="p-4 font-medium text-right">Crecimiento (MoM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {stats.historicalTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                    {row.monthName} {row.year}
                  </td>
                  <td className="p-4 text-right font-mono font-medium">
                    S/{row.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-500">
                    S/{row.gananciaNeta.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td className="p-4 text-right font-bold">
                    {row.crecimiento > 0 ? (
                      <span className="text-emerald-500">+{row.crecimiento.toFixed(1)}%</span>
                    ) : row.crecimiento < 0 ? (
                      <span className="text-red-500">{row.crecimiento.toFixed(1)}%</span>
                    ) : (
                      <span className="text-zinc-400">0%</span>
                    )}
                  </td>
                </tr>
              ))}
              {stats.historicalTable.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">Sin datos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exportar a Excel */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-emerald-500" />
            Exportar Reportes a Excel
          </h3>
          <p className="text-sm text-zinc-500 mb-4 max-w-md">Descarga un archivo .xlsx con el registro detallado de las ventas. Selecciona los filtros que necesites.</p>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Filtrar por Mes</label>
              <select value={exportMonth} onChange={e => setExportMonth(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm w-40">
                <option value="all">Todo el Historial</option>
                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Filtrar por Año</label>
              <select value={exportYear} onChange={e => setExportYear(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm w-32">
                <option value="all">Todos</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Filtrar por Asesora</label>
              <select value={exportAsesora} onChange={e => setExportAsesora(e.target.value)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm w-48">
                <option value="all">Todas las Asesoras</option>
                {asesorasUnicas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Descargar .xlsx
        </button>
      </div>

    </div>
  );
}
