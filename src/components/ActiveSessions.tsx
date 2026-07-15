import React, { useState, useEffect } from 'react';
import { 
  Search, Car, Clock, ShieldAlert, CheckCircle, ArrowRight, 
  X, Printer, QrCode, Trash2, Coins, Calendar, AlertTriangle, RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';
import { ParkingSession, VehicleType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveSessionsProps {
  sessions: ParkingSession[];
  vehicleTypes: VehicleType[];
  onRefresh: () => void;
  cashStatus: any;
  currentUser: any;
}

export default function ActiveSessions({
  sessions,
  vehicleTypes,
  onRefresh,
  cashStatus,
  currentUser
}: ActiveSessionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntry, setFilterEntry] = useState<string>('all');
  
  // Modal states
  const [ticketModalSession, setTicketModalSession] = useState<ParkingSession | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<ParkingSession | null>(null);
  const [cancelSession, setCancelSession] = useState<ParkingSession | null>(null);

  // Checkout modal form state
  const [calculationData, setCalculationData] = useState<any | null>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('dinheiro');
  const [discountVal, setDiscountVal] = useState<string>('0');
  const [customFinalVal, setCustomFinalVal] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccessTicket, setCheckoutSuccessTicket] = useState<any | null>(null);

  // Cancellation form state
  const [cancelJustification, setCancelJustification] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Timer to force component re-renders for live parking duration counters
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const activeParked = sessions.filter(s => s.status === 'active');

  // Filter and search active sessions
  const filteredSessions = activeParked.filter(s => {
    const displayPlate = s.displayPlate || '';
    const ticketNum = s.ticketNumber || '';
    const matchesQuery = displayPlate.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         ticketNum.toLowerCase().includes(searchQuery.toLowerCase());
                         
    const matchesType = filterType === 'all' || s.vehicleTypeId === filterType;
    
    let matchesEntry = true;
    if (filterEntry === 'mensalista') matchesEntry = s.entryType === 'mensalista';
    else if (filterEntry === 'avulso') matchesEntry = s.entryType === 'avulso';
    else if (filterEntry === 'convenio') matchesEntry = s.entryType === 'convenio';
    else if (filterEntry === 'cortesia') matchesEntry = s.entryType === 'cortesia';

    return matchesQuery && matchesType && matchesEntry;
  });

  // Calculate elapsed duration string
  const getElapsedString = (entryAtStr: string) => {
    const entry = new Date(entryAtStr);
    const diffMs = Date.now() - entry.getTime();
    if (diffMs <= 0) return 'Agora mesmo';
    
    const minutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Trigger cost calculation on selecting a session for checkout
  const handleSelectCheckout = async (session: ParkingSession) => {
    setCheckoutSession(session);
    setLoadingCalc(true);
    setCheckoutError(null);
    setDiscountVal('0');
    setCustomFinalVal('');
    setJustification('');
    setPaymentMethod('dinheiro');
    
    try {
      const data = await api.calculateCost(session.id);
      setCalculationData(data);
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao calcular permanência do veículo.');
    } finally {
      setLoadingCalc(false);
    }
  };

  // Perform actual checkout and exit log
  const handleProcessCheckout = async () => {
    if (!checkoutSession || !calculationData) return;
    
    // Validate justification if discount or price override is used
    const parsedDiscount = parseFloat(discountVal || '0');
    const overrideFinal = customFinalVal !== '' ? parseFloat(customFinalVal) : null;
    const isOverriding = parsedDiscount > 0 || overrideFinal !== null || checkoutSession.entryType === 'cortesia';
    
    if (isOverriding && !justification.trim()) {
      setCheckoutError('Justificativa obrigatória para descontos, isenções ou reajustes.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const data = await api.checkout({
        sessionId: checkoutSession.id,
        paymentMethod,
        discountAmount: parsedDiscount,
        customAmount: overrideFinal !== null ? overrideFinal : undefined,
        justification
      });

      setCheckoutSuccessTicket(data.session);
      onRefresh(); // Refresh list in parent
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao finalizar ticket.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle ticket cancellation
  const handleProcessCancel = async () => {
    if (!cancelSession) return;
    if (!cancelJustification.trim()) {
      setCancelError('Escreva uma justificativa explicativa para o cancelamento.');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);

    try {
      await api.cancelEntry(cancelSession.id, cancelJustification);
      setCancelSession(null);
      setCancelJustification('');
      onRefresh();
    } catch (err: any) {
      setCancelError(err.message || 'Erro ao cancelar ticket.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Formulate final prices shown inside checkout panel
  const getFinalCalculatedPrices = () => {
    if (!calculationData) return { calculated: 0, final: 0, discount: 0 };
    const original = calculationData.calculatedAmount;
    let disc = parseFloat(discountVal || '0');
    let fin = Math.max(0, original - disc);
    
    if (customFinalVal !== '') {
      fin = parseFloat(customFinalVal);
      disc = Math.max(0, original - fin);
    }
    return {
      calculated: original,
      final: parseFloat(fin.toFixed(2)),
      discount: parseFloat(disc.toFixed(2))
    };
  };

  const priceDetails = getFinalCalculatedPrices();

  return (
    <div className="space-y-6 pb-24 md:pb-6 text-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-app-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Veículos Presentes <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1.5 bg-indigo-500/10 px-2.5 py-0.5 rounded-full text-xs">PÁTIO: {activeParked.length}</span></h2>
          <p className="text-xs text-app-muted mt-1">Monitore e faça checkout rápido de veículos no pátio ativo do estacionamento.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-app-card border border-app-border rounded-lg text-app-text hover:bg-app-border-sub transition-all cursor-pointer shadow-xs hover:border-indigo-500/30"
        >
          <RefreshCw className="w-4 h-4 text-indigo-500" />
          <span>Sincronizar Lista</span>
        </button>
      </div>

      {/* Capacity tracker indicator header */}
      <div className="grid grid-cols-3 gap-3">
        {vehicleTypes.map(t => {
          const occupied = activeParked.filter(s => s.vehicleTypeId === t.id).length;
          const spacesLeft = Math.max(0, t.totalSpaces - occupied);
          return (
            <div key={t.id} className="theme-card p-2.5 text-center">
              <span className="text-[9px] font-bold text-app-subtle uppercase tracking-widest">{t.name}S</span>
              <p className="text-sm font-bold text-app-text mt-0.5">{occupied} / {t.totalSpaces}</p>
              <span className={`text-[8px] font-bold uppercase tracking-tight ${spacesLeft <= 2 ? 'text-rose-500' : 'text-app-muted'}`}>
                {spacesLeft} LIVRES
              </span>
            </div>
          );
        })}
      </div>

      {/* Searching, filtering options */}
      <div className="bg-app-card p-2.5 rounded border border-app-border flex flex-col md:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-app-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="PESQUISAR PLACA OU TICKET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-bg pl-8 pr-12 py-1.5 border border-app-border text-app-text focus:border-indigo-500 focus:outline-none rounded text-[10px] transition uppercase placeholder-app-muted/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text text-[9px] uppercase font-bold cursor-pointer"
            >
              LIMPAR
            </button>
          )}
        </div>

        {/* Filters Selects */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-app-bg border border-app-border text-app-text rounded text-[10px] px-2 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
          >
            <option value="all">TODAS CATEGORIAS</option>
            {vehicleTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
            ))}
          </select>
          
          <select
            value={filterEntry}
            onChange={(e) => setFilterEntry(e.target.value)}
            className="bg-app-bg border border-app-border text-app-text rounded text-[10px] px-2 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
          >
            <option value="all">TODOS TIPOS</option>
            <option value="avulso">ROTATIVO AVULSO</option>
            <option value="mensalista">MENSALISTA</option>
            <option value="convenio">CONVÊNIO</option>
            <option value="cortesia">CORTESIA</option>
          </select>
        </div>
      </div>

      {/* Grid of Active Parked Vehicles */}
      {filteredSessions.length === 0 ? (
        <div className="theme-card py-12 px-6 text-center">
          <Car className="w-10 h-10 text-app-muted mx-auto mb-2" />
          <h4 className="font-bold text-app-text text-xs uppercase tracking-wider">Nenhum veículo encontrado</h4>
          <p className="text-[10px] text-app-muted max-w-sm mx-auto mt-1 uppercase">
            {searchQuery || filterType !== 'all' || filterEntry !== 'all' 
              ? 'Tente ajustar os filtros ou termo de busca informado.' 
              : 'Pátio vazio. Registre uma nova entrada de veículo.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filteredSessions.map((s, index) => {
              const vType = vehicleTypes.find(t => t.id === s.vehicleTypeId);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.3) }}
                  className="theme-card p-3 flex flex-col justify-between relative hover:border-indigo-500 transition-colors duration-150"
                >
                  {/* Top: Plate and category badge */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-app-subtle tracking-wider font-mono">TICKET: {s.ticketNumber}</span>
                      <h4 className="text-base font-bold text-app-text mt-0.5 tracking-wider uppercase">
                        {s.displayPlate}
                      </h4>
                      {s.model && (
                        <p className="text-[9px] text-app-muted truncate mt-0.5 uppercase">
                          {s.model} {s.color && `(${s.color})`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-app-bg border border-app-border text-app-text uppercase">
                        {vType?.name || 'CARRO'}
                      </span>
                      {s.entryType === 'mensalista' ? (
                        <span className="px-1 py-0.5 text-[8px] font-bold uppercase rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 tracking-wider">MENSALISTA</span>
                      ) : s.entryType === 'cortesia' ? (
                        <span className="px-1 py-0.5 text-[8px] font-bold uppercase rounded bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 tracking-wider">CORTESIA</span>
                      ) : s.entryType === 'convenio' ? (
                        <span className="px-1 py-0.5 text-[8px] font-bold uppercase rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 tracking-wider">CONVÊNIO</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Middle: entry details, duration counter */}
                  <div className="my-2.5 py-2 border-t border-app-border grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-app-muted block font-bold uppercase">ENTRADA</span>
                      <p className="font-semibold text-app-text flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-app-muted" />
                        {new Date(s.entryAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-app-muted block font-bold uppercase">PERMANÊNCIA</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {getElapsedString(s.entryAt).toUpperCase()}
                      </p>
                    </div>
                    {s.vaga && (
                      <div className="col-span-2 pt-1 flex items-center gap-1.5">
                        <span className="text-[8px] text-app-muted font-bold uppercase">VAGA:</span>
                        <span className="px-1.5 py-0.5 rounded border border-app-border bg-app-bg font-bold text-app-text uppercase text-[9px] font-mono">
                          {s.vaga.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: quick actions */}
                  <div className="flex gap-1.5 pt-2 border-t border-app-border">
                    <button
                      onClick={() => setTicketModalSession(s)}
                      className="p-1.5 border border-app-border bg-app-bg hover:bg-app-border-sub rounded text-app-muted hover:text-app-text transition cursor-pointer"
                      title="Exibir Ticket"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    {currentUser.role !== 'operator' && (
                      <button
                        onClick={() => setCancelSession(s)}
                        className="p-1.5 border border-app-border bg-app-bg hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded transition cursor-pointer"
                        title="Cancelar Entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleSelectCheckout(s)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-[10px] font-bold uppercase rounded shadow-sm transition cursor-pointer"
                    >
                      <Coins className="w-3 h-3 text-white" />
                      <span>Registrar Saída</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL 1: TICKET / QR CODE GENERATOR */}
      {ticketModalSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded border border-app-border max-w-xs w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 font-mono text-[10px]">
            <div className="flex justify-between items-center px-3 py-2 border-b border-app-border bg-app-bg/50">
              <span className="font-bold text-app-muted uppercase">VISUALIZAÇÃO TICKET</span>
              <button 
                onClick={() => setTicketModalSession(null)}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-app-bg text-center space-y-3">
              <div className="border-b border-dashed border-app-border pb-2">
                <h4 className="font-bold text-xs text-app-text uppercase tracking-wider">PARKGESTOR OPERAÇÕES</h4>
                <p className="text-[8px] text-app-subtle mt-0.5">Nº: {ticketModalSession.ticketNumber}</p>
              </div>
              <div className="space-y-1 text-left text-app-muted">
                <p className="flex justify-between"><span>PLACA:</span> <strong className="text-app-text bg-app-border px-1 rounded font-bold">{ticketModalSession.displayPlate}</strong></p>
                <p className="flex justify-between"><span>MODALIDADE:</span> <strong className="uppercase text-indigo-500">{ticketModalSession.entryType}</strong></p>
                <p className="flex justify-between"><span>ENTRADA:</span> <strong className="text-app-text">{new Date(ticketModalSession.entryAt).toLocaleDateString('pt-BR')} {new Date(ticketModalSession.entryAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</strong></p>
                <p className="flex justify-between"><span>OPERADOR:</span> <strong className="text-app-text uppercase">{currentUser.name.split(' ')[0]}</strong></p>
                <p className="flex justify-between"><span>VAGA:</span> <strong className="text-app-text">{ticketModalSession.vaga ? ticketModalSession.vaga.toUpperCase() : 'LIVRE'}</strong></p>
              </div>

              {/* Simulated QR Code */}
              <div className="flex flex-col items-center justify-center py-2.5 gap-1 bg-app-card p-2 rounded border border-app-border">
                <div className="w-20 h-20 bg-app-bg rounded p-1 flex flex-wrap border border-app-border">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1/4 h-1/4 ${
                        (i % 2 === 1 && i % 3 === 0) || i === 0 || i === 3 || i === 12 || i === 15 
                          ? 'bg-indigo-500' 
                          : 'bg-transparent'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-[7px] text-app-subtle uppercase">TOKEN: {ticketModalSession.publicToken}</span>
              </div>
            </div>
            <div className="p-2.5 bg-app-card border-t border-app-border flex gap-2">
              <button
                onClick={() => window.print()}
                className="w-full py-1.5 bg-app-bg border border-app-border text-app-text hover:bg-app-border-sub font-bold rounded uppercase tracking-wider text-[9px] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT & PAYMENT REGISTRATION */}
      {checkoutSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-app-card rounded border border-app-border max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 my-8 text-[11px] text-app-text">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-app-border bg-app-bg/50">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-app-text uppercase tracking-wider">REGISTRAR PAGAMENTO E SAÍDA</span>
              </div>
              <button 
                onClick={() => {
                  setCheckoutSession(null);
                  setCheckoutSuccessTicket(null);
                }}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Check if we got a successful checkout receipt screen */}
            {checkoutSuccessTicket ? (
              <div className="p-4 text-center space-y-3 bg-app-bg">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-app-text uppercase tracking-wider text-xs">SAÍDA HOMOLOGADA!</h4>
                <p className="text-[9px] text-app-muted uppercase leading-relaxed max-w-xs mx-auto">
                  A permanência foi dada como encerrada, a vaga {checkoutSuccessTicket.vaga || 'livre'} foi desocupada e a receita de <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(checkoutSuccessTicket.finalAmount)}</strong> foi consolidada.
                </p>

                <div className="p-3 bg-app-card rounded border border-dashed border-app-border text-left space-y-1 text-[10px] font-mono">
                  <p className="flex justify-between"><span>TICKET:</span> <strong className="text-app-text">{checkoutSuccessTicket.ticketNumber}</strong></p>
                  <p className="flex justify-between"><span>PLACA:</span> <strong className="text-app-text bg-app-bg px-1 rounded">{checkoutSuccessTicket.displayPlate}</strong></p>
                  <p className="flex justify-between"><span>ENTRADA:</span> <span className="text-app-text">{new Date(checkoutSuccessTicket.entryAt).toLocaleTimeString('pt-BR')}</span></p>
                  <p className="flex justify-between"><span>SAÍDA:</span> <span className="text-app-text">{new Date(checkoutSuccessTicket.exitAt).toLocaleTimeString('pt-BR')}</span></p>
                  <p className="flex justify-between border-t border-dashed border-app-border pt-1.5 text-xs">
                    <span>VALOR RECEBIDO:</span> 
                    <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(checkoutSuccessTicket.finalAmount)}</strong>
                  </p>
                  <p className="flex justify-between"><span>MÉTODO:</span> <strong className="uppercase text-indigo-500">{checkoutSuccessTicket.paymentMethod}</strong></p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-1.5 bg-app-card border border-app-border hover:bg-app-border-sub rounded font-bold text-[9px] uppercase tracking-wider text-app-text flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-500" /> <span>Imprimir Recibo</span>
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutSession(null);
                      setCheckoutSuccessTicket(null);
                    }}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
                  >
                    CONCLUIR TRANSACÇÃO
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4 bg-app-bg">
                {/* Header info card */}
                <div className="bg-app-card p-3 rounded border border-app-border flex justify-between items-start">
                  <div>
                    <span className="text-[8px] text-app-muted font-bold uppercase tracking-wider font-mono">TICKET ID: {checkoutSession.ticketNumber}</span>
                    <h5 className="text-sm font-bold text-app-text tracking-wider mt-0.5">{checkoutSession.displayPlate}</h5>
                    {checkoutSession.model && <p className="text-[9px] text-app-muted uppercase mt-0.5">{checkoutSession.model}</p>}
                    <p className="text-[8px] text-app-subtle mt-1 uppercase font-mono font-bold">ENTRADA EM {new Date(checkoutSession.entryAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-app-bg border border-app-border text-indigo-500 uppercase">
                    {checkoutSession.entryType}
                  </span>
                </div>

                {/* Calculation breakdown loader or data */}
                {loadingCalc ? (
                  <div className="py-6 text-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mx-auto mb-1.5" />
                    <p className="text-[10px] text-app-muted uppercase">CALCULANDO VALORES DE PERMANÊNCIA...</p>
                  </div>
                ) : checkoutError ? (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                ) : calculationData ? (
                  <div className="space-y-3">
                    {/* Tarifa information & Duration details */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-app-card p-2 rounded border border-app-border">
                        <span className="text-app-muted block uppercase text-[8px] font-bold">TEMPO DECORRIDO</span>
                        <strong className="text-app-text text-xs mt-0.5 block">{getElapsedString(checkoutSession.entryAt).toUpperCase()}</strong>
                        <span className="text-[8px] text-app-muted block">({calculationData.elapsedMinutes} MINUTOS)</span>
                      </div>
                      <div className="bg-app-card p-2 rounded border border-app-border">
                        <span className="text-app-muted block uppercase text-[8px] font-bold">PLANO DE TARIFAS</span>
                        <strong className="text-app-text text-xs mt-0.5 block truncate max-w-[150px] mx-auto uppercase">
                          {calculationData.pricingPlan?.name}
                        </strong>
                        <span className="text-[8px] text-emerald-600 dark:text-emerald-400 block font-bold">{formatBRL(calculationData.pricingPlan?.hourlyRate)} / HORA</span>
                      </div>
                    </div>

                    {/* Cost summary list */}
                    <div className="border border-app-border rounded p-3 bg-app-card space-y-2">
                      <div className="flex justify-between text-app-muted">
                        <span>Valor Tarifário Base:</span>
                        <span className="font-bold text-app-text">{formatBRL(calculationData.calculatedAmount)}</span>
                      </div>
                      
                      {checkoutSession.entryType === 'mensalista' || checkoutSession.entryType === 'cortesia' ? (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                          <span>Isenção Acordo ({checkoutSession.entryType.toUpperCase()}):</span>
                          <span>- {formatBRL(calculationData.calculatedAmount)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-app-muted">
                            <span>Abatimento Manual (R$):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={discountVal}
                              onChange={(e) => {
                                  setDiscountVal(e.target.value);
                                  setCustomFinalVal('');
                              }}
                              className="w-16 bg-app-bg border border-app-border text-app-text rounded px-1.5 py-0.5 text-right font-bold text-[10px] focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                          
                          <div className="flex justify-between items-center text-app-muted">
                            <span>Sobrescrever Total Final (R$):</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={customFinalVal}
                              placeholder="EX: 5.00"
                              onChange={(e) => {
                                  setCustomFinalVal(e.target.value);
                                  setDiscountVal('0');
                              }}
                              className="w-16 bg-app-bg border border-app-border text-app-text rounded px-1.5 py-0.5 text-right font-bold text-[10px] focus:outline-none focus:border-indigo-500 placeholder-app-muted/30 font-mono"
                            />
                          </div>
                        </>
                      )}

                      <div className="flex justify-between border-t border-app-border pt-2 text-xs font-bold text-app-text">
                        <span>VALOR LÍQUIDO A COBRAR:</span>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-mono">{formatBRL(priceDetails.final)}</span>
                      </div>
                    </div>

                    {/* Justification if overriding/discount */}
                    {(priceDetails.discount > 0 || checkoutSession.entryType === 'cortesia') && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          <span>Justificativa de Ajuste (Obrigatória)</span>
                        </label>
                        <input
                          type="text"
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="EX: ACORDO DE ISENÇÃO DE GERÊNCIA / DESCONTO"
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                          required
                        />
                      </div>
                    )}

                    {/* Select Payment Method */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">FORMA DE PAGAMENTO</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                        {['dinheiro', 'pix', 'debito', 'credito'].map((method) => {
                          const active = paymentMethod === method;
                          return (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method as any)}
                              className={`py-1 rounded border text-[9px] font-bold uppercase tracking-tight transition cursor-pointer ${
                                active 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow' 
                                  : 'bg-app-card border-app-border text-app-muted hover:text-app-text'
                              }`}
                            >
                              {method}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Confirm actions */}
                <div className="pt-3 border-t border-app-border flex flex-col gap-1.5">
                  <button
                    onClick={handleProcessCheckout}
                    disabled={checkoutLoading || loadingCalc || !calculationData}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded text-[10px] font-bold uppercase transition disabled:opacity-50 cursor-pointer"
                  >
                    {checkoutLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>PROCESSANDO REGISTRO...</span>
                      </>
                    ) : (
                      <span>Liberar Veículo & Baixar Vaga</span>
                    )}
                  </button>
                  <button
                    onClick={() => setCheckoutSession(null)}
                    className="w-full py-1 text-[9px] font-bold uppercase text-app-muted hover:text-app-text text-center cursor-pointer"
                  >
                    VOLTAR PARA LISTAGEM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL TICKET */}
      {cancelSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded border border-app-border max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 text-[10px]">
            <div className="flex justify-between items-center px-3 py-2 border-b border-rose-500/20 bg-rose-950/10">
              <span className="font-bold text-rose-500 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                CANCELAR ENTRADA DE VEÍCULO
              </span>
              <button 
                onClick={() => {
                  setCancelSession(null);
                  setCancelError(null);
                }}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-3 bg-app-bg text-app-muted">
              <p className="leading-relaxed">
                VOCÊ ESTÁ PRESTES A CANCELAR A ENTRADA DO VEÍCULO PLACA <strong className="text-app-text font-bold">{cancelSession.displayPlate}</strong> (TICKET: {cancelSession.ticketNumber}). ESTA AÇÃO É IRREVERSÍVEL, LIBERARÁ A VAGA DO PÁTIO E DEIXARÁ REGISTRO DE AUDITORIA INTERNA.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-app-muted uppercase tracking-widest block">JUSTIFICATIVA DE EXCLUSÃO</label>
                <input
                  type="text"
                  value={cancelJustification}
                  onChange={(e) => setCancelJustification(e.target.value)}
                  placeholder="EX: PLACA DIGITADA INCORRETAMENTE PELO OPERADOR"
                  className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-rose-500 uppercase placeholder-app-muted/30"
                  required
                />
              </div>

              {cancelError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded">
                  {cancelError}
                </div>
              )}
            </div>

            <div className="p-3 bg-app-card border-t border-app-border flex gap-2 justify-end">
              <button
                onClick={() => setCancelSession(null)}
                className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
              >
                VOLTAR
              </button>
              <button
                onClick={handleProcessCancel}
                disabled={cancelLoading}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.95] text-white font-bold rounded uppercase text-[9px] flex items-center gap-1 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {cancelLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>CANCELANDO...</span>
                  </>
                ) : (
                  <span>EFETUAR EXCLUSÃO</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
