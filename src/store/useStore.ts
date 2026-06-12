import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';

// --- Tipos de Datos ---
export type Role = 'admin' | 'asesora';
export type SaleStatus = 'completado' | 'anulado';

export interface User {
  id: string;
  nombre: string;
  pin: string;
  rol: Role;
  celular: string;
  estado: string;
  meta_id?: string;
  fecha_creacion: string;
}

export interface Product {
  id: string;
  proveedor: string;
  codigo: string; // Prefijo de letras (ej: PCD)
  numero: number; // Cantidad de números del sufijo (ej: 3 para "100")
  nombre: string;
  precio: number;
  precio_costo: number; // NUEVO: Costo del producto
  precio_liquidacion: number;
  fecha: string;
}

export interface SaleDetail {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_aplicado: number;
  costo_aplicado: number; // NUEVO: Costo congelado al momento de la venta
  subtotal: number;
}

export interface Sale {
  id: string;
  fecha_venta: string;
  asesora_nombre: string;
  celular_cliente: string;
  informacion_adicional?: string;
  embalaje: number;
  delivery: number;
  envio: number;
  descuento: number;
  total: number;
  estado: SaleStatus;
  detalles: SaleDetail[];
}

export interface LoginLog {
  id: string;
  userId: string;
  nombre: string;
  ip: string;
  timestamp: string;
  status: 'success' | 'blocked';
}

export interface SystemSettings {
  allowedIps: string[];
  asesorasCanSeeGlobalStats: boolean;
  asesorasCanSeeRankingMonto: boolean; 
}

export type GoalMetric = 'ordenes' | 'prendas' | 'monto';

export interface GoalTier {
  name: string;
  target: number;
}

export interface Goal {
  id: string;
  name: string;
  metric: GoalMetric;
  target: number;
  mes: number;
  anio: number;
  is_active: boolean;
  has_tiers: boolean;
  tiers: GoalTier[];
}

export interface RankingHistory {
  id: string;
  mes: number;
  anio: number;
  asesora_nombre: string;
  prendas: number;
  ingresos: number;
  ordenes: number;
  crecimiento_prendas: number;
  fecha_guardado: string;
}

// --- Estado Inicial (Local Temporal) ---
const mockUsers: User[] = [];

const mockGoals: Goal[] = [];

// Dejamos las ventas vacías por ahora hasta migrar su tabla
const mockSales: Sale[] = [];

interface StoreState {
  users: User[];
  products: Product[];
  sales: Sale[];
  loginLogs: LoginLog[];
  settings: SystemSettings;
  goals: Goal[];
  rankingHistorial: RankingHistory[];
  currentUser: User | null;
  _hasHydrated: boolean;
  
  setCurrentUser: (user: User | null) => void;
  setHasHydrated: (state: boolean) => void;
  
  // --- Operaciones Supabase (Usuarios) ---
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // --- Operaciones Supabase (Productos) ---
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (id: string, product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // --- Operaciones de Supabase (Ventas) ---
  fetchSales: () => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  updateSale: (id: string, sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  deleteMultipleSales: (ids: string[]) => Promise<void>;

  addLoginLog: (log: LoginLog) => Promise<void>;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  
  // --- Operaciones Supabase (Metas) ---
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // --- Operaciones Supabase (Ranking Histórico) ---
  fetchRankingHistory: () => Promise<void>;
  saveRankingSnapshot: (snapshotData: Omit<RankingHistory, 'id' | 'fecha_guardado'>[]) => Promise<void>;

  // --- Operaciones Supabase (Logs) ---
  fetchLoginLogs: () => Promise<void>;
  clearLoginLogs: () => Promise<void>;

  resetCanvas: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      products: [],
      sales: mockSales,
      loginLogs: [],
      settings: { allowedIps: [], asesorasCanSeeGlobalStats: false, asesorasCanSeeRankingMonto: true },
      goals: mockGoals,
      rankingHistorial: [],
      currentUser: null, // Sin loguear por defecto
      _hasHydrated: false,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // --- SUPABASE USUARIOS ---
      fetchUsers: async () => {
        // En Supabase la fecha es created_at, la renombramos a fecha_creacion
        const { data, error } = await supabase.from('usuarios').select('id, nombre, pin, rol, celular, estado, meta_id, fecha_creacion:created_at');
        if (data && !error) set({ users: data as User[] });
      },
      
      addUser: async (user) => {
        const { error } = await supabase.from('usuarios').insert([{
          id: user.id,
          nombre: user.nombre,
          pin: user.pin,
          rol: user.rol,
          celular: user.celular,
          estado: user.estado,
          meta_id: user.meta_id || null
        }]);
        if (!error) set((state) => ({ users: [...state.users, user] }));
      },
      
      deleteUser: async (id) => {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (!error) set((state) => ({ users: state.users.filter(u => u.id !== id) }));
      },

      updateUser: async (id, user) => {
        const { error } = await supabase.from('usuarios').update({
          nombre: user.nombre,
          pin: user.pin,
          rol: user.rol,
          celular: user.celular,
          estado: user.estado,
          meta_id: user.meta_id || null
        }).eq('id', id);
        if (!error) {
          set((state) => ({
            users: state.users.map(u => u.id === id ? { ...u, ...user } : u)
          }));
        } else {
          console.error("Error updating user:", error);
        }
      },
      
      // --- SUPABASE PRODUCTOS ---
      fetchProducts: async () => {
        const { data, error } = await supabase.from('productos').select('*');
        if (data && !error) set({ products: data as Product[] });
      },
      
      addProduct: async (product) => {
        const { error } = await supabase.from('productos').insert([product]);
        if (!error) {
          set((state) => ({ products: [...state.products, product] }));
        } else {
          console.error("Error adding product", error);
        }
      },
      
      updateProduct: async (id, product) => {
        const { error } = await supabase.from('productos').update(product).eq('id', id);
        if (!error) {
          set((state) => ({
            products: state.products.map(p => p.id === id ? { ...p, ...product } : p)
          }));
        } else {
          console.error("Error updating product", error);
        }
      },
      
      deleteProduct: async (id) => {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (!error) {
          set((state) => ({ products: state.products.filter(p => p.id !== id) }));
        } else {
          console.error("Error deleting product", error);
        }
      },
      
      // --- SUPABASE VENTAS ---
      fetchSales: async () => {
        // Obtenemos ventas con sus detalles usando el Foreign Key relation
        const { data, error } = await supabase.from('ventas').select(`*, detalles:venta_detalles(*)`);
        if (data && !error) {
          set({ sales: data as Sale[] });
        }
      },

      addSale: async (sale) => {
        // 1. Insertar Cabecera de Venta
        const { error: saleError } = await supabase.from('ventas').insert([{
          id: sale.id,
          fecha_venta: sale.fecha_venta,
          asesora_nombre: sale.asesora_nombre,
          celular_cliente: sale.celular_cliente,
          embalaje: sale.embalaje,
          delivery: sale.delivery,
          envio: sale.envio,
          descuento: sale.descuento,
          total: sale.total,
          estado: sale.estado
        }]);

        if (!saleError) {
          // 2. Insertar Detalles de Venta
          const detalles = sale.detalles.map(d => ({
            id: d.id,
            venta_id: sale.id,
            producto_id: d.producto_id,
            cantidad: d.cantidad,
            precio_aplicado: d.precio_aplicado,
            costo_aplicado: d.costo_aplicado,
            subtotal: d.subtotal
          }));
          await supabase.from('venta_detalles').insert(detalles);

          // 3. Actualizar Caché de Reportes Mensuales (Rollup)
          const date = new Date(sale.fecha_venta);
          const month = date.getMonth();
          const year = date.getFullYear();
          const profit = sale.total - sale.detalles.reduce((acc, d) => acc + (d.costo_aplicado * d.cantidad), 0);
          const qty = sale.detalles.reduce((acc, d) => acc + d.cantidad, 0);

          const { data: reportes } = await supabase.from('reportes_mensuales').select('*').eq('anio', year).eq('mes', month);
          
          if (reportes && reportes.length > 0) {
            await supabase.from('reportes_mensuales').update({
              ingresos: reportes[0].ingresos + sale.total,
              ganancia_neta: reportes[0].ganancia_neta + profit,
              prendas_vendidas: reportes[0].prendas_vendidas + qty,
              ordenes: reportes[0].ordenes + 1
            }).eq('id', reportes[0].id);
          } else {
            await supabase.from('reportes_mensuales').insert([{
              anio: year,
              mes: month,
              ingresos: sale.total,
              ganancia_neta: profit,
              prendas_vendidas: qty,
              ordenes: 1
            }]);
          }

          // 4. Actualizar Estado Local para UI inmediata
          set((state) => ({ sales: [...state.sales, sale] }));
        } else {
          console.error("Error adding sale", saleError);
        }
      },

      deleteSale: async (id) => {
        const sale = get().sales.find(s => s.id === id);
        if (!sale) return;

        // Primero borramos los detalles por FK, aunque si tienes ON DELETE CASCADE no haría falta, pero para asegurar:
        await supabase.from('venta_detalles').delete().eq('venta_id', id);
        const { error } = await supabase.from('ventas').delete().eq('id', id);
        
        if (!error) {
          // Reversar Reportes Mensuales
          const date = new Date(sale.fecha_venta);
          const month = date.getMonth();
          const year = date.getFullYear();
          const profit = sale.total - (sale.detalles || []).reduce((acc, d) => acc + ((d.costo_aplicado || 0) * (d.cantidad || 0)), 0);
          const qty = (sale.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);

          const { data: reportes } = await supabase.from('reportes_mensuales').select('*').eq('anio', year).eq('mes', month);
          if (reportes && reportes.length > 0) {
            await supabase.from('reportes_mensuales').update({
              ingresos: reportes[0].ingresos - sale.total,
              ganancia_neta: reportes[0].ganancia_neta - profit,
              prendas_vendidas: reportes[0].prendas_vendidas - qty,
              ordenes: reportes[0].ordenes - 1
            }).eq('id', reportes[0].id);
          }

          set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
        }
      },

      deleteMultipleSales: async (ids) => {
        const salesToDelete = get().sales.filter(s => ids.includes(s.id));
        if (salesToDelete.length === 0) return;

        // Eliminar en BD
        await supabase.from('venta_detalles').delete().in('venta_id', ids);
        const { error } = await supabase.from('ventas').delete().in('id', ids);

        if (!error) {
          // Reversar reportes mensuales agrupados por mes/año para eficiencia
          const changesByMonth: Record<string, { year: number, month: number, ingresos: number, profit: number, qty: number, count: number }> = {};
          
          salesToDelete.forEach(sale => {
            const date = new Date(sale.fecha_venta);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const profit = sale.total - (sale.detalles || []).reduce((acc, d) => acc + ((d.costo_aplicado || 0) * (d.cantidad || 0)), 0);
            const qty = (sale.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);
            
            if (!changesByMonth[key]) {
              changesByMonth[key] = { year: date.getFullYear(), month: date.getMonth(), ingresos: 0, profit: 0, qty: 0, count: 0 };
            }
            changesByMonth[key].ingresos += sale.total;
            changesByMonth[key].profit += profit;
            changesByMonth[key].qty += qty;
            changesByMonth[key].count += 1;
          });

          for (const key of Object.keys(changesByMonth)) {
            const changes = changesByMonth[key];
            const { data: reportes } = await supabase.from('reportes_mensuales')
              .select('*').eq('anio', changes.year).eq('mes', changes.month);
              
            if (reportes && reportes.length > 0) {
              await supabase.from('reportes_mensuales').update({
                ingresos: reportes[0].ingresos - changes.ingresos,
                ganancia_neta: reportes[0].ganancia_neta - changes.profit,
                prendas_vendidas: reportes[0].prendas_vendidas - changes.qty,
                ordenes: reportes[0].ordenes - changes.count
              }).eq('id', reportes[0].id);
            }
          }

          set((state) => ({ sales: state.sales.filter(s => !ids.includes(s.id)) }));
        }
      },

      updateSale: async (id, updatedSale) => {
        const oldSale = get().sales.find(s => s.id === id);
        if (!oldSale) return;

        // Reversar old reportes
        const oldDate = new Date(oldSale.fecha_venta);
        const oldMonth = oldDate.getMonth();
        const oldYear = oldDate.getFullYear();
        const oldProfit = oldSale.total - (oldSale.detalles || []).reduce((acc, d) => acc + ((d.costo_aplicado || 0) * (d.cantidad || 0)), 0);
        const oldQty = (oldSale.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);

        const { data: oldReportes } = await supabase.from('reportes_mensuales').select('*').eq('anio', oldYear).eq('mes', oldMonth);
        if (oldReportes && oldReportes.length > 0) {
          await supabase.from('reportes_mensuales').update({
            ingresos: oldReportes[0].ingresos - oldSale.total,
            ganancia_neta: oldReportes[0].ganancia_neta - oldProfit,
            prendas_vendidas: oldReportes[0].prendas_vendidas - oldQty,
            ordenes: oldReportes[0].ordenes - 1
          }).eq('id', oldReportes[0].id);
        }

        // Update venta cabecera
        const { error } = await supabase.from('ventas').update({
          fecha_venta: updatedSale.fecha_venta,
          asesora_nombre: updatedSale.asesora_nombre,
          celular_cliente: updatedSale.celular_cliente,
          embalaje: updatedSale.embalaje,
          delivery: updatedSale.delivery,
          envio: updatedSale.envio,
          descuento: updatedSale.descuento,
          total: updatedSale.total,
          estado: updatedSale.estado
        }).eq('id', id);

        if (!error) {
          // Delete old details and insert new ones
          await supabase.from('venta_detalles').delete().eq('venta_id', id);
          
          const detalles = updatedSale.detalles.map(d => ({
              id: generateUUID(),
              venta_id: id,
              producto_id: d.producto_id,
              cantidad: d.cantidad,
              precio_aplicado: d.precio_aplicado,
              costo_aplicado: d.costo_aplicado,
              subtotal: d.subtotal
          }));
          await supabase.from('venta_detalles').insert(detalles);

          // Apply new reportes
          const newDate = new Date(updatedSale.fecha_venta);
          const newMonth = newDate.getMonth();
          const newYear = newDate.getFullYear();
          const newProfit = updatedSale.total - updatedSale.detalles.reduce((acc, d) => acc + (d.costo_aplicado * d.cantidad), 0);
          const newQty = updatedSale.detalles.reduce((acc, d) => acc + d.cantidad, 0);

          const { data: newReportes } = await supabase.from('reportes_mensuales').select('*').eq('anio', newYear).eq('mes', newMonth);
          if (newReportes && newReportes.length > 0) {
            await supabase.from('reportes_mensuales').update({
              ingresos: newReportes[0].ingresos + updatedSale.total,
              ganancia_neta: newReportes[0].ganancia_neta + newProfit,
              prendas_vendidas: newReportes[0].prendas_vendidas + newQty,
              ordenes: newReportes[0].ordenes + 1
            }).eq('id', newReportes[0].id);
          } else {
            await supabase.from('reportes_mensuales').insert([{
              anio: newYear,
              mes: newMonth,
              ingresos: updatedSale.total,
              ganancia_neta: newProfit,
              prendas_vendidas: newQty,
              ordenes: 1
            }]);
          }

          set((state) => ({
              sales: state.sales.map(s => s.id === id ? updatedSale : s)
          }));
        } else {
          console.error("Error updating sale", error);
        }
      },
      
      addLoginLog: async (log) => {
        // Guardar estado local para vista rápida
        set((state) => ({
          loginLogs: [log, ...state.loginLogs].slice(0, 20)
        }));
        // Guardar en base de datos
        await supabase.from('login_logs').insert([{
          id: log.id,
          usuario_id: log.userId,
          nombre_usuario: log.nombre,
          // ip: log.ip, // Eliminado de Supabase
          // status: log.status, // Eliminado de Supabase
          fecha: log.timestamp
        }]);
      },

      fetchLoginLogs: async () => {
        const { data, error } = await supabase.from('login_logs').select('*').order('fecha', { ascending: false }).limit(20);
        if (data && !error) {
          const logs: LoginLog[] = data.map(d => ({
            id: d.id,
            userId: d.usuario_id || '',
            nombre: d.nombre_usuario,
            ip: 'Oculta', // Ya no existe en DB
            status: (d.status as 'success' | 'blocked') || 'success',
            timestamp: d.fecha
          }));
          set({ loginLogs: logs });
        }
      },

      clearLoginLogs: async () => {
        const { error } = await supabase.from('login_logs').delete().not('id', 'is', null);
        if (!error) {
          set({ loginLogs: [] });
        } else {
          console.error("Error clearing logs", error);
        }
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // --- SUPABASE METAS ---
      fetchGoals: async () => {
        const { data, error } = await supabase.from('metas').select('*, tiers:meta_tiers(*)');
        if (data && !error) set({ goals: data as Goal[] });
      },

      addGoal: async (goal) => {
        const { error: goalError } = await supabase.from('metas').insert([{
          id: goal.id,
          name: goal.name,
          metric: goal.metric,
          target: goal.target,
          mes: goal.mes,
          anio: goal.anio,
          is_active: goal.is_active,
          has_tiers: goal.has_tiers
        }]);

        if (!goalError && goal.has_tiers && goal.tiers.length > 0) {
           await supabase.from('meta_tiers').insert(
             goal.tiers.map(t => ({
               id: generateUUID(),
               meta_id: goal.id,
               name: t.name,
               target: t.target
             }))
           );
        }
        
        if (!goalError) {
          set((state) => ({ goals: [...state.goals, goal] }));
        } else {
          console.error("Error adding goal:", goalError);
        }
      },

      updateGoal: async (id, goal) => {
        const { error } = await supabase.from('metas').update({
          name: goal.name,
          metric: goal.metric,
          target: goal.target,
          mes: goal.mes,
          anio: goal.anio,
          is_active: goal.is_active,
          has_tiers: goal.has_tiers
        }).eq('id', id);

        if (!error) {
          if (goal.has_tiers) {
            await supabase.from('meta_tiers').delete().eq('meta_id', id);
            await supabase.from('meta_tiers').insert(
               goal.tiers.map(t => ({
                 id: generateUUID(),
                 meta_id: id,
                 name: t.name,
                 target: t.target
               }))
            );
          }
          set((state) => ({
             goals: state.goals.map(g => g.id === id ? { ...g, ...goal } : g)
          }));
        } else {
          console.error("Error updating goal:", error);
        }
      },

      deleteGoal: async (id) => {
        const { error } = await supabase.from('metas').delete().eq('id', id);
        if (!error) {
           set((state) => ({ goals: state.goals.filter(g => g.id !== id) }));
        } else {
           console.error("Error deleting goal:", error);
        }
      },

      // --- SUPABASE RANKING HISTORICO ---
      fetchRankingHistory: async () => {
        const { data, error } = await supabase.from('ranking_historial').select('*');
        if (data && !error) {
          set({ rankingHistorial: data as RankingHistory[] });
        }
      },

      saveRankingSnapshot: async (snapshotData) => {
        // Borramos primero el historial del mes para no duplicar si se presiona varias veces
        if (snapshotData.length > 0) {
          const mes = snapshotData[0].mes;
          const anio = snapshotData[0].anio;
          await supabase.from('ranking_historial').delete().eq('mes', mes).eq('anio', anio);
        }

        const toInsert = snapshotData.map(d => ({
          ...d,
          id: generateUUID(),
          fecha_guardado: new Date().toISOString()
        }));

        const { error } = await supabase.from('ranking_historial').insert(toInsert);
        if (!error) {
          get().fetchRankingHistory();
        } else {
          console.error("Error guardando snapshot del ranking:", error);
        }
      },

      resetCanvas: () => set({ users: [], products: [], sales: [], loginLogs: [], goals: [], currentUser: null })
    }),
    {
      name: 'registro-ventas-storage-v12', // key in local storage changed to bust cache
      partialize: (state) => ({ 
        currentUser: state.currentUser, 
        settings: state.settings 
        // Ya NO guardamos products, sales, users en persist local, solo en Supabase.
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      }
    }
  )
);
