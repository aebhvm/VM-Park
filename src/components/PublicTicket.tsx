import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { formatBRL } from '../lib/masks';

type PublicTicketData = Awaited<ReturnType<typeof api.getPublicTicket>>;

function formatElapsed(totalMinutes: number): string {
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${remainder} min`;
  return `${hours}h ${String(remainder).padStart(2, '0')}min`;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export default function PublicTicket() {
  const token = useMemo(() => window.location.pathname.split('/').filter(Boolean).at(-1) || '', []);
  const [data, setData] = useState<PublicTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicket = useCallback(async () => {
    if (!token) {
      setError('Comprovante não encontrado.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.getPublicTicket(token);
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível consultar este comprovante.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTicket();
    const interval = window.setInterval(() => void loadTicket(), 30_000);
    return () => window.clearInterval(interval);
  }, [loadTicket]);

  const ticket = data?.ticket;
  const isActive = ticket?.status === 'active';
  const isCompleted = ticket?.status === 'completed';

  return (
    <main className="min-h-screen bg-app-bg px-4 py-8 text-app-text">
      <div className="mx-auto w-full max-w-sm">
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-card shadow-xl">
          <div className="bg-indigo-500 px-5 py-6 text-center text-white">
            {data?.parkingLot.logoUrl ? (
              <img src={data.parkingLot.logoUrl} alt="Logo do estacionamento" className="mx-auto mb-3 h-12 w-12 rounded-xl bg-white object-contain p-1" />
            ) : (
              <ShieldCheck className="mx-auto mb-2 h-9 w-9 text-gold-300" />
            )}
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Comprovante digital</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight">{data?.parkingLot.name || 'ParkGestor'}</h1>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-app-muted">
              <LoaderCircle className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-xs font-bold uppercase tracking-wider">Consultando ticket...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
              <h2 className="font-bold text-app-text">Não foi possível abrir o comprovante</h2>
              <p className="mt-2 text-sm text-app-muted">{error}</p>
              <button onClick={() => { setLoading(true); void loadTicket(); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold uppercase text-white">
                <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
              </button>
            </div>
          ) : ticket ? (
            <div className="space-y-5 px-5 py-6">
              <div className="flex items-center justify-between border-b border-dashed border-app-border pb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Ticket</p>
                  <p className="mt-1 font-mono text-lg font-bold text-app-text">{ticket.ticketNumber}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isActive ? 'bg-emerald-500/10 text-emerald-600' : isCompleted ? 'bg-indigo-500/10 text-indigo-600' : 'bg-app-border text-app-muted'}`}>
                  {isActive ? 'Em aberto' : isCompleted ? 'Finalizado' : 'Cancelado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-[10px] font-bold uppercase text-app-muted">Placa</p>
                  <p className="mt-1 text-base font-extrabold tracking-wider text-app-text">{ticket.displayPlate}</p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-[10px] font-bold uppercase text-app-muted">Modalidade</p>
                  <p className="mt-1 text-base font-extrabold uppercase text-app-text">{ticket.entryType}</p>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-center">
                <Clock3 className="mx-auto h-6 w-6 text-indigo-500" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-app-muted">Tempo estacionado</p>
                <p className="mt-1 text-3xl font-extrabold text-app-text">{formatElapsed(ticket.elapsedMinutes)}</p>
                <p className="mt-1 text-[11px] text-app-muted">{ticket.elapsedMinutes} minutos corridos</p>
              </div>

              <div className="rounded-xl border border-app-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold uppercase text-app-muted">{isActive ? 'Valor no momento' : 'Valor registrado'}</span>
                  <strong className="text-2xl font-extrabold text-emerald-600">{formatBRL(ticket.amount)}</strong>
                </div>
                {isActive && ticket.pricingPlanName && (
                  <p className="mt-2 text-[11px] text-app-muted">Tarifa: {ticket.pricingPlanName}</p>
                )}
                {ticket.entryType === 'mensalista' && <p className="mt-2 text-[11px] text-emerald-600">Permanência coberta pelo plano mensalista.</p>}
                {ticket.entryType === 'cortesia' && <p className="mt-2 text-[11px] text-emerald-600">Permanência registrada como cortesia.</p>}
              </div>

              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-4"><dt className="text-app-muted">Entrada</dt><dd className="font-semibold text-app-text">{formatDate(ticket.entryAt)}</dd></div>
                {ticket.exitAt && <div className="flex justify-between gap-4"><dt className="text-app-muted">Saída</dt><dd className="font-semibold text-app-text">{formatDate(ticket.exitAt)}</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-app-muted">Atualizado</dt><dd className="font-semibold text-app-text">{formatDate(ticket.updatedAt)}</dd></div>
              </dl>

              {isActive && <p className="text-center text-[10px] text-app-muted">A consulta é atualizada automaticamente a cada 30 segundos.</p>}
            </div>
          ) : null}
        </section>
        <p className="mt-4 text-center text-[10px] text-app-subtle">Consulta pública protegida pelo token exclusivo deste ticket.</p>
      </div>
    </main>
  );
}
