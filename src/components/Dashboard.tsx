import React from 'react';
import { 
  Car, Coins, ArrowUpRight, ArrowDownLeft, Clock, 
  Percent, Users, ShieldAlert, CheckCircle, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { formatBRL } from '../lib/masks';

interface DashboardProps {
  stats: any;
  loading: boolean;
  onRefresh: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function Dashboard({ stats, loading, onRefresh, setCurrentTab }: DashboardProps) {
  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Carregando dados do painel...</p>
      </div>
    );
  }

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getOccupancyTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  // Safe calculated averages
  const totalExits = stats.todayExitsCount || 0;
  const ticketMedio = totalExits > 0 ? stats.todayRevenue / totalExits : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-6 text-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-app-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Painel Operacional</h2>
          <p className="text-xs text-app-muted mt-1">Fluxo de pátio e monitoramento transacional em tempo real.</p>
        </div>
        <button 
          id="refresh-dashboard"
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-app-card border border-app-border rounded-lg text-app-text hover:bg-app-border-sub transition-all cursor-pointer shadow-xs hover:border-indigo-500/30"
        >
          <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin-slow" />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Main KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI: Ocupacao */}
        <div 
          id="kpi-occupancy"
          onClick={() => setCurrentTab('vehicles')}
          className="theme-card p-3 flex flex-col justify-between hover:border-indigo-500 hover:shadow-md cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-app-subtle uppercase tracking-widest">Ocupação Atual</p>
              <h3 className="text-lg md:text-xl font-bold text-app-text mt-1">
                {stats.vehicleCount} <span className="text-[10px] font-normal text-app-muted">/ {stats.totalCapacity} VAGAS</span>
              </h3>
            </div>
            <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-500">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-[9px] text-app-muted mb-1">
              <span>Densidade Pátio</span>
              <span className={`font-bold ${getOccupancyTextColor(stats.occupancyPercentage)}`}>
                {stats.occupancyPercentage}%
              </span>
            </div>
            <div className="w-full bg-app-bg h-1.5 rounded overflow-hidden border border-app-border">
              <div 
                className={`h-full transition-all duration-500 ${getOccupancyColor(stats.occupancyPercentage)}`}
                style={{ width: `${Math.min(100, stats.occupancyPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI: Faturamento */}
        <div 
          id="kpi-revenue"
          onClick={() => setCurrentTab('cash')}
          className="theme-card p-3 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-app-subtle uppercase tracking-widest">Receita do Dia</p>
              <h3 className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBRL(stats.todayRevenue)}
              </h3>
            </div>
            <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-500">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold uppercase">
            <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500"></span>
            <span>Fluxo de hoje integrado</span>
          </div>
        </div>

        {/* KPI: Entradas/Saidas */}
        <div className="theme-card p-3 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-app-subtle uppercase tracking-widest">Fluxo do Dia</p>
              <div className="flex gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-app-text">{stats.todayEntriesCount}</p>
                    <p className="text-[8px] text-app-subtle font-mono">ENTRADAS</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownLeft className="w-4 h-4 text-app-muted" />
                  <div>
                    <p className="text-xs font-bold text-app-muted">{stats.todayExitsCount}</p>
                    <p className="text-[8px] text-app-subtle font-mono">SAÍDAS</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-1 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[9px] text-app-muted uppercase">
            T-Médio: <span className="font-bold text-app-text">45 MIN</span>
          </div>
        </div>

        {/* KPI: Caixa */}
        <div 
          onClick={() => setCurrentTab('subscribers')}
          className="theme-card p-3 flex flex-col justify-between hover:border-amber-500 hover:shadow-md cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-bold text-app-subtle uppercase tracking-widest">Mensalistas</p>
              <h3 className="text-lg md:text-xl font-bold text-app-text mt-1">
                {stats.activeMensalistasCount} <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-1 rounded ml-1">Ativos</span>
              </h3>
            </div>
            <div className="p-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[9px] uppercase">
            {stats.expiredMensalistasCount > 0 ? (
              <div className="flex items-center gap-1 text-rose-500 font-bold">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                <span>{stats.expiredMensalistasCount} VENCIDOS</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-500 font-bold">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span>REGULARES OK</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Occupancy Bars and Financial breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Occupancy Detail Box */}
        <div className="theme-card p-4 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-[10px] text-app-text uppercase tracking-wider mb-0.5">Distribuição de Vagas</h4>
            <p className="text-[9px] text-app-muted mb-3">Uso de pátio categorizado por tipologia.</p>
            
            <div className="space-y-2.5">
              {stats.occupancyByType?.map((item: any) => (
                <div key={item.typeId} className="space-y-0.5">
                  <div className="flex justify-between text-[10px] font-bold text-app-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500"></span>
                      {item.name.toUpperCase()}
                    </span>
                    <span>{item.occupied}/{item.total} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-app-bg h-1.5 rounded overflow-hidden border border-app-border">
                    <div 
                      className={`h-full rounded transition-all duration-500 ${getOccupancyColor(item.percentage)}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-app-border flex justify-between text-[9px] text-app-muted uppercase tracking-wider">
            <span>Caixas logados: <strong className="text-app-text">{stats.activeCaixasCount}</strong></span>
            <span>Ticket Médio: <strong className="text-app-text">{formatBRL(ticketMedio)}</strong></span>
          </div>
        </div>

        {/* Receita por Forma de Pagamento */}
        <div className="theme-card p-4 lg:col-span-2">
          <h4 className="font-bold text-[10px] text-app-text uppercase tracking-wider mb-0.5">Métodos de Recebimento (Hoje)</h4>
          <p className="text-[9px] text-app-muted mb-4">Divisão de receita operacional por modalidade de caixa.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-app-bg p-2 rounded border border-app-border text-center">
              <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider font-mono">Dinheiro</span>
              <p className="text-sm font-bold text-app-text mt-0.5">{formatBRL(stats.todayRevenuesByMethod?.dinheiro || 0)}</p>
            </div>
            <div className="bg-app-bg p-2 rounded border border-app-border text-center">
              <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider font-mono">Pix</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatBRL(stats.todayRevenuesByMethod?.pix || 0)}</p>
            </div>
            <div className="bg-app-bg p-2 rounded border border-app-border text-center">
              <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider font-mono">Cartão Débito</span>
              <p className="text-sm font-bold text-app-text mt-0.5">{formatBRL(stats.todayRevenuesByMethod?.debito || 0)}</p>
            </div>
            <div className="bg-app-bg p-2 rounded border border-app-border text-center">
              <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider font-mono">Cartão Crédito</span>
              <p className="text-sm font-bold text-app-text mt-0.5">{formatBRL(stats.todayRevenuesByMethod?.credito || 0)}</p>
            </div>
          </div>

          <div className="mt-4 p-2 rounded bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-app-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500 animate-pulse"></span>
            <span>Gateway de conciliação ativa operando em modo seguro</span>
          </div>
        </div>
      </div>

      {/* Recharts Revenue Progression Card */}
      <div className="theme-card p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h4 className="font-bold text-[10px] text-app-text uppercase tracking-wider">Evolução do Faturamento (Últimos 7 dias)</h4>
            <p className="text-[9px] text-app-muted">Fluxo semanal consolidado por modalidade.</p>
          </div>
          <div className="flex gap-4 text-[9px] font-bold uppercase text-app-subtle">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span>Rotativo</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span>Mensalidades</span>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.dailyRevenuesChart || []}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRotativo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMensalista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" opacity={0.3} />
              <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={9} tickLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={9} tickLine={false} />
              <Tooltip 
                formatter={(value: any) => [formatBRL(Number(value))]}
                contentStyle={{ 
                  backgroundColor: 'var(--color-bg-card)', 
                  borderColor: 'var(--color-border-main)', 
                  color: 'var(--color-text-main)', 
                  borderRadius: '6px', 
                  fontSize: '9px', 
                  fontFamily: 'inherit' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="estacionamento" 
                name="Rotativo" 
                stroke="#10b981" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorRotativo)" 
              />
              <Area 
                type="monotone" 
                dataKey="mensalistas" 
                name="Mensalistas" 
                stroke="#6366f1" 
                strokeWidth={1.5}
                fillOpacity={1} 
                fill="url(#colorMensalista)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
