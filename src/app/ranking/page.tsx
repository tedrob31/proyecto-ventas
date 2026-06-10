"use client";

import { useEffect, useState } from 'react';
import { useStore, Goal, GoalTier } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, ArrowUp, ArrowDown, Minus, Target, Star, CheckCircle2, Save } from 'lucide-react';
import { getMonthStats } from '@/lib/analytics';
import clsx from 'clsx';

interface RankingRow {
  nombre: string;
  prendasActual: number;
  ingresosActual: number;
  ordenesActual: number;
  prendasPasado: number;
  ingresosPasado: number;
  ordenesPasado: number;
  crecimientoPrendas: number;
}

export default function RankingPage() {
  const { currentUser, sales, settings, goals, rankingHistorial, saveRankingSnapshot, _hasHydrated } = useStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeOffset, setActiveOffset] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (_hasHydrated && !currentUser) router.push('/login');
  }, [currentUser, router, _hasHydrated]);

  if (!mounted || !_hasHydrated || !currentUser) return null;

  const showMontos = currentUser.rol === 'admin' || settings.asesorasCanSeeRankingMonto;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Generamos opciones para los últimos 6 meses (0 = actual, 1-5 = pasados)
  const availableMonths = Array.from({ length: 6 }).map((_, i) => {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    return { offset: i, month: m, year: y, name: `${monthNames[m]} ${y}` };
  });

  const selectedPeriod = availableMonths.find(m => m.offset === activeOffset)!;
  const isCurrentMonth = activeOffset === 0;

  // Calculamos el mes anterior al seleccionado para la comparación VS Mes Pasado
  let prevMonth = selectedPeriod.month - 1;
  let prevYear = selectedPeriod.year;
  if (prevMonth < 0) { prevMonth += 12; prevYear -= 1; }

  const asesoras = Array.from(new Set(sales.map(s => s.asesora_nombre)));

  let rankingData: RankingRow[] = [];

  // Ahora siempre calculamos en vivo desde 'sales' para que si editan ventas pasadas, el ranking se actualice.
  rankingData = asesoras.map(nombre => {
    const ventasAsesora = sales.filter(s => s.asesora_nombre === nombre);
    const statsActual = getMonthStats(ventasAsesora, selectedPeriod.month, selectedPeriod.year);
    const statsPasado = getMonthStats(ventasAsesora, prevMonth, prevYear);

    let crecimiento = 0;
    if (statsPasado.prendasVendidas > 0) {
      crecimiento = ((statsActual.prendasVendidas - statsPasado.prendasVendidas) / statsPasado.prendasVendidas) * 100;
    } else if (statsActual.prendasVendidas > 0) {
      crecimiento = 100;
    }

    return {
      nombre,
      prendasActual: statsActual.prendasVendidas,
      ingresosActual: statsActual.ingresos,
      ordenesActual: statsActual.ordenes,
      prendasPasado: statsPasado.prendasVendidas,
      ingresosPasado: statsPasado.ingresos,
      ordenesPasado: statsPasado.ordenes,
      crecimientoPrendas: crecimiento
    };
  }).sort((a, b) => b.prendasActual - a.prendasActual);

  const renderMedal = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-md" />;
    if (index === 1) return <Medal className="w-8 h-8 text-zinc-400 drop-shadow-md" />;
    if (index === 2) return <Medal className="w-8 h-8 text-amber-700 drop-shadow-md" />;
    return <span className="font-mono text-zinc-400 font-bold w-8 text-center text-xl">{index + 1}</span>;
  };

  const activeGoals = goals.filter(g => g.is_active && g.mes === selectedPeriod.month && g.anio === selectedPeriod.year);

  const getGoalProgress = (row: RankingRow, goal: Goal) => {
    let currentVal = 0;
    if (goal.metric === 'ordenes') currentVal = row.ordenesActual;
    if (goal.metric === 'prendas') currentVal = row.prendasActual;
    if (goal.metric === 'monto') currentVal = row.ingresosActual;

    let target = goal.target;
    let tiers: GoalTier[] = [];
    let currentTierName = null;
    let nextTier = null;

    if (goal.has_tiers && goal.tiers && goal.tiers.length > 0) {
      // Ordenamos para asegurar que estén ascendentes
      tiers = [...goal.tiers].sort((a, b) => a.target - b.target);
      target = tiers[tiers.length - 1].target; // El 100% de la barra es el último escalón

      // Encontrar en qué escalón estamos
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (currentVal >= tiers[i].target) {
          currentTierName = tiers[i].name;
          nextTier = tiers[i + 1] || null;
          break;
        }
      }
      if (!currentTierName) {
        nextTier = tiers[0];
      }
    }

    const percentage = Math.min(100, Math.max(0, (currentVal / target) * 100));
    const isCompleted = percentage >= 100;

    return { currentVal, percentage, isCompleted, target, tiers, currentTierName, nextTier };
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-8 max-w-6xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            Ranking
          </h1>
          <p className="text-zinc-500 mt-1">Tabla de posiciones y progreso de bonos por niveles.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {availableMonths.map((m) => (
          <button
            key={m.offset}
            onClick={() => setActiveOffset(m.offset)}
            className={clsx(
              "px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0",
              activeOffset === m.offset ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            {m.offset === 0 ? `Mes Actual (${m.name})` : m.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {rankingData.map((row, idx) => (
          <div key={row.nombre} className={clsx("bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm p-6 transition-all duration-300", row.nombre === currentUser.nombre ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700")}>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex justify-center items-center h-16 w-16 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  {renderMedal(idx)}
                </div>
                <div>
                  <h2 className="font-bold text-2xl flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    {row.nombre}
                    {row.nombre === currentUser.nombre && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Tú</span>}
                  </h2>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm text-zinc-500">
                    <span><strong className="text-zinc-900 dark:text-zinc-100">{row.prendasActual}</strong> Prendas</span>
                    {showMontos && <span><strong className="text-emerald-600 dark:text-emerald-500 font-mono">S/ {row.ingresosActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>}

                    <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-500">
                      <strong>{row.ordenesActual}</strong> Ventas registradas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {activeGoals.length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/80">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Progreso de Metas
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeGoals.map(goal => {
                    const { currentVal, percentage, isCompleted, target, tiers, currentTierName, nextTier } = getGoalProgress(row, goal);
                    const hideMoney = goal.metric === 'monto' && !showMontos;

                    return (
                      <div key={goal.id} className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-5 border border-zinc-200/60 dark:border-zinc-800">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                              {isCompleted && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                              {goal.name}
                            </span>
                            {goal.has_tiers && (
                              <p className="text-xs text-zinc-500 mt-1 font-medium">
                                {currentTierName ? (
                                  <span className="text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Nivel: {currentTierName}
                                  </span>
                                ) : (
                                  <span>Sin nivel alcanzado aún.</span>
                                )}
                                {nextTier && <span className="ml-2 text-zinc-400">Próximo: {nextTier.name} ({hideMoney ? '***' : nextTier.target})</span>}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-mono font-bold text-zinc-500">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>

                        <div className="relative h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mb-3">
                          <div
                            className={clsx("h-full rounded-full transition-all duration-1000 ease-out", isCompleted ? "bg-gradient-to-r from-amber-400 to-amber-600" : "bg-gradient-to-r from-pink-500 to-rose-500")}
                            style={{ width: `${percentage}%` }}
                          />

                          {/* Renderizar Checkpoints para los escalones */}
                          {goal.has_tiers && tiers.map((t, i) => {
                            const p = (t.target / target) * 100;
                            const achieved = currentVal >= t.target;
                            return (
                              <div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                                style={{ left: `${p}%` }}
                              >
                                <div className={clsx("w-3 h-3 rounded-full border-2", achieved ? "bg-amber-400 border-white dark:border-zinc-900" : "bg-zinc-300 dark:bg-zinc-700 border-white dark:border-zinc-900")} />
                                <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] py-1 px-2 rounded-lg font-bold shadow-md z-10">
                                  {t.name}: {hideMoney ? '***' : goal.metric === 'monto' ? `S/${t.target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : t.target}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-xs text-zinc-500 flex justify-between font-mono">
                          <span>
                            {hideMoney ? '***' : goal.metric === 'monto' ? `S/${currentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : currentVal}
                          </span>
                          <span>
                            Meta Final: {hideMoney ? '***' : goal.metric === 'monto' ? `S/${target.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : target}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ))}

        {rankingData.length === 0 && (
          <div className="bg-white dark:bg-zinc-900 p-12 text-center border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500">
            No hay datos suficientes para generar un ranking en este período.
          </div>
        )}
      </div>

    </div>
  );
}
