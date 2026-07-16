import React, { useState } from 'react';
import { 
  Coins, Clock, ArrowUpRight, ArrowDownLeft, ShieldAlert, CheckCircle2, 
  Plus, Minus, X, AlertTriangle, FileText, Check, Calendar, RefreshCw 
} from 'lucide-react';
import { api } from '../lib/api';
import { formatBRL, formatCurrencyInput, formatCurrencyValue, parseCurrency } from '../lib/masks';
import { CashSession, FinancialTransaction } from '../types';
import { motion } from 'motion/react';

interface CashRegisterProps {
  cashStatus: CashSession | null;
  cashSessions: CashSession[];
  transactions: FinancialTransaction[];
  onRefresh: () => void;
  currentUser: any;
}

export default function CashRegister({
  cashStatus,
  cashSessions,
  transactions,
  onRefresh,
  currentUser
}: CashRegisterProps) {
  // Opening form state
  const [openingBalance, setOpeningBalance] = useState(formatCurrencyValue(100));
  const [openLoading, setOpenLoading] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  // Quick transaction modal (sangria / suprimento)
  const [actionType, setActionType] = useState<'sangria' | 'suprimento' | null>(null);
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);

  // Closing box form state
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [informedClosingVal, setInformedClosingVal] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingLoading, setClosingLoading] = useState(false);
  const [closingError, setClosingError] = useState<string | null>(null);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenLoading(true);
    setOpenError(null);
    try {
      await api.openCash(parseCurrency(openingBalance));
      onRefresh();
    } catch (err: any) {
      setOpenError(err.message || 'Erro ao abrir caixa.');
    } finally {
      setOpenLoading(false);
    }
  };

  const handlePostTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnAmount || parseCurrency(txnAmount) <= 0) {
      setTxnError('Insira um valor maior que zero.');
      return;
    }
    if (!txnDesc.trim()) {
      setTxnError('Descreva o motivo desta operação.');
      return;
    }

    setTxnLoading(true);
    setTxnError(null);
    try {
      await api.addCashTransaction({
        type: actionType!,
        amount: parseCurrency(txnAmount),
        description: txnDesc
      });
      setActionType(null);
      setTxnAmount('');
      setTxnDesc('');
      onRefresh();
    } catch (err: any) {
      setTxnError(err.message || 'Erro ao processar movimentação.');
    } finally {
      setTxnLoading(false);
    }
  };

  const handleCloseCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (informedClosingVal === '') {
      setClosingError('Informe o valor total contado em dinheiro físico.');
      return;
    }

    const countedVal = parseCurrency(informedClosingVal);
    const expectedVal = cashStatus ? cashStatus.expectedClosingBalance : 0;
    const difference = countedVal - expectedVal;

    if (difference !== 0 && !closingNotes.trim()) {
      setClosingError('Justificativa obrigatória para fechamentos com diferença de saldo.');
      return;
    }

    setClosingLoading(true);
    setClosingError(null);
    try {
      await api.closeCash(countedVal, closingNotes);
      setClosingModalOpen(false);
      setInformedClosingVal('');
      setClosingNotes('');
      onRefresh();
    } catch (err: any) {
      setClosingError(err.message || 'Erro ao fechar caixa.');
    } finally {
      setClosingLoading(false);
    }
  };

  // Filter current session transactions if cash is open
  const currentSessionTransactions = cashStatus 
    ? transactions.filter(t => t.cashSessionId === cashStatus.id) 
    : [];

  const getTxnBadgeColor = (type: string) => {
    switch (type) {
      case 'recebimento_estacionamento':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'recebimento_mensalidade':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'suprimento':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'sangria':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'despesa':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-500/20';
      default:
        return 'bg-app-bg text-app-muted border-app-border';
    }
  };

  const getTxnTypeLabel = (type: string) => {
    switch (type) {
      case 'recebimento_estacionamento':
        return 'Ticket Avulso';
      case 'recebimento_mensalidade':
        return 'Mensalidade';
      case 'suprimento':
        return 'Suprimento (Troco)';
      case 'sangria':
        return 'Sangria';
      case 'despesa':
        return 'Despesa Caixa';
      default:
        return 'Outro';
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6 text-sm transition-all">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-app-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Fluxo de Caixa Operacional</h2>
          <p className="text-xs text-app-muted mt-1">Gerencie a abertura, suprimento, sangria e conferência do caixa físico.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-app-card border border-app-border rounded-lg text-app-text hover:bg-app-border-sub transition-all cursor-pointer shadow-xs hover:border-indigo-500/30"
        >
          <RefreshCw className="w-4 h-4 text-indigo-550" />
          <span>Sincronizar</span>
        </button>
      </div>

      {/* STATE A: NO ACTIVE CAIXA OPEN */}
      {!cashStatus ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Opening Box Card */}
          <div className="theme-card p-4 lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-app-bg border border-app-border rounded flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <Coins className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-xs text-app-text uppercase tracking-wider">CAIXA OPERACIONAL FECHADO</h3>
              <p className="text-[9px] text-app-muted mt-1 leading-relaxed uppercase">
                Antes de iniciar as saídas ou mensalidades, inicialize o caixa informando o saldo inicial de troca (fundo fixo).
              </p>
            </div>

            <form onSubmit={handleOpenCash} className="space-y-3 mt-4 border-t border-app-border pt-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">FUNDO DE TROCO INICIAL (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(formatCurrencyInput(e.target.value))}
                  className="w-full bg-app-bg text-center text-lg font-mono font-bold py-2 border border-app-border text-app-text focus:border-indigo-500 focus:outline-none rounded"
                  required
                />
              </div>

              {openError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-550 dark:text-rose-400 text-[9px] rounded flex items-center gap-1.5 uppercase">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{openError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={openLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded text-[10px] font-bold uppercase shadow transition disabled:opacity-50 cursor-pointer"
              >
                {openLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
                ) : (
                  <span>EFETUAR ABERTURA DE CAIXA</span>
                )}
              </button>
            </form>
          </div>

          {/* Past historical closings */}
          <div className="theme-card p-4 lg:col-span-2">
            <h4 className="font-bold text-xs text-app-text uppercase tracking-wider mb-0.5">HISTÓRICO RECENTE DE FECHAMENTOS</h4>
            <p className="text-[10px] text-app-muted mb-3">Registro auditável dos fechamentos anteriores das sessões.</p>

            <div className="overflow-x-auto border border-app-border rounded">
              <table className="w-full text-left text-[9px] border-collapse bg-app-bg">
                <thead>
                  <tr className="bg-app-card text-app-muted uppercase tracking-wider border-b border-app-border">
                    <th className="p-2.5 font-bold">OPERADOR / DATA</th>
                    <th className="p-2.5 font-bold">FUNDO INIC.</th>
                    <th className="p-2.5 font-bold">SALDO ESP.</th>
                    <th className="p-2.5 font-bold">CONFERIDO</th>
                    <th className="p-2.5 font-bold">DIFERENÇA</th>
                    <th className="p-2.5 font-bold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {cashSessions.filter(c => c.status === 'closed').slice(0, 5).map(c => (
                    <tr key={c.id} className="hover:bg-app-card/30 text-app-text">
                      <td className="p-2.5">
                        <strong className="text-app-text block uppercase max-w-[120px] truncate">{c.userName.split(' ')[0]}</strong>
                        <span className="text-[8px] text-app-subtle font-mono">{new Date(c.closedAt || c.openedAt).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="p-2.5 text-app-text font-mono">{formatBRL(c.openingBalance)}</td>
                      <td className="p-2.5 text-app-text font-mono">{formatBRL(c.expectedClosingBalance)}</td>
                      <td className="p-2.5 font-bold text-app-text font-mono">{formatBRL(c.informedClosingBalance || 0)}</td>
                      <td className="p-2.5">
                        {c.differenceAmount !== 0 ? (
                          <span className={`font-bold font-mono ${c.differenceAmount! < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {c.differenceAmount! > 0 ? '+' : ''}{formatBRL(c.differenceAmount || 0)}
                          </span>
                        ) : (
                          <span className="text-app-subtle">SEM DIF.</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        <span className="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-app-card text-app-muted border border-app-border text-[8px] font-bold">
                          <Check className="w-2.5 h-2.5 text-emerald-500" /> FECHADO
                        </span>
                      </td>
                    </tr>
                  ))}
                  {cashSessions.filter(c => c.status === 'closed').length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-app-subtle uppercase font-bold">Nenhum fechamento registrado no banco de dados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* STATE B: CURRENTLY ACTIVE CAIXA SESSION */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in fade-in duration-100">
          
          {/* Live Box Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="theme-card p-4 relative overflow-hidden">
              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              
              <div className="text-[9px] text-app-muted flex items-center gap-1.5 mb-1.5 uppercase font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-550" />
                <span>TURNO INICIADO: {new Date(cashStatus.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <h3 className="font-bold text-app-muted text-[10px] uppercase tracking-wide mt-2">Saldo Atual em Caixa (Físico)</h3>
              <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {formatBRL(cashStatus.expectedClosingBalance)}
              </h2>
              
              <div className="mt-3 pt-3 border-t border-app-border space-y-1.5 text-[9px] uppercase">
                <div className="flex justify-between text-app-subtle">
                  <span>Operador Ativo:</span>
                  <span className="font-bold text-app-text">{cashStatus.userName.toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-app-subtle">
                  <span>Troco de Abertura:</span>
                  <span className="font-bold text-app-text font-mono">{formatBRL(cashStatus.openingBalance)}</span>
                </div>
                <div className="flex justify-between text-app-subtle">
                  <span>Movi. Turno:</span>
                  <span className="font-bold text-app-text font-mono">
                    {currentSessionTransactions.filter(t=>t.type==='sangria').length} sangrias / {currentSessionTransactions.filter(t=>t.type==='suprimento').length} suprimentos
                  </span>
                </div>
              </div>

              {/* Sangria/Suprimento and Close Box Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-4">
                <button
                  onClick={() => setActionType('suprimento')}
                  className="flex items-center justify-center gap-1 py-1.5 bg-app-bg border border-app-border hover:bg-app-border-sub text-app-text rounded text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-indigo-500" />
                  <span>Suprimento</span>
                </button>
                <button
                  onClick={() => setActionType('sangria')}
                  className="flex items-center justify-center gap-1 py-1.5 bg-app-bg border border-app-border hover:bg-app-border-sub text-app-text rounded text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  <Minus className="w-3 h-3 text-amber-500" />
                  <span>Sangria</span>
                </button>
                
                <button
                  onClick={() => setClosingModalOpen(true)}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded text-[9px] font-bold uppercase shadow transition mt-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Concluir e Fechar Caixa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Session Transactions Table */}
          <div className="lg:col-span-2 theme-card p-4 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-app-text uppercase tracking-wider mb-0.5">MOVIMENTAÇÕES DESTE TURNO</h4>
              <p className="text-[10px] text-app-muted mb-3">Auditoria de receitas e retiradas operadas na sessão ativa.</p>
              
              <div className="overflow-x-auto border border-app-border rounded">
                <table className="w-full text-left text-[9px] border-collapse bg-app-bg">
                  <thead>
                    <tr className="bg-app-card text-app-muted uppercase tracking-wider border-b border-app-border">
                      <th className="p-2.5 font-bold">HORA</th>
                      <th className="p-2.5 font-bold">CATEGORIA</th>
                      <th className="p-2.5 font-bold">JUSTIFICATIVA / DETALHES</th>
                      <th className="p-2.5 font-bold">FORMA</th>
                      <th className="p-2.5 font-bold text-right">VALOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {currentSessionTransactions.map(t => (
                      <tr key={t.id} className="hover:bg-app-card/30 text-app-text">
                        <td className="p-2.5 text-app-subtle font-mono">
                          {new Date(t.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 border rounded text-[8px] font-bold uppercase tracking-wide ${getTxnBadgeColor(t.type)}`}>
                            {getTxnTypeLabel(t.type).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2.5 text-app-text font-medium truncate max-w-[160px] uppercase" title={t.description}>
                          {t.description}
                        </td>
                        <td className="p-2.5 text-app-subtle uppercase text-[9px] font-mono">{t.paymentMethod || 'N/A'}</td>
                        <td className={`p-2.5 text-right font-bold font-mono ${
                          ['sangria', 'despesa', 'estorno'].includes(t.type) ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {['sangria', 'despesa', 'estorno'].includes(t.type) ? '-' : ''}{formatBRL(t.amount)}
                        </td>
                      </tr>
                    ))}
                    {currentSessionTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-app-subtle uppercase font-bold">Nenhuma movimentação realizada na gaveta de caixa.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-app-border flex justify-between text-[8px] text-app-subtle uppercase font-bold">
              <span>RESPONSÁVEL: {cashStatus.userName.toUpperCase()}</span>
              <span>SESSÃO ID: {cashStatus.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SANGRIAS / SUPRIMENTOS FORM */}
      {actionType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded border border-app-border max-w-sm w-full shadow-2xl overflow-hidden text-[10px]">
            <div className={`flex justify-between items-center px-3 py-2 border-b ${
              actionType === 'sangria' ? 'bg-amber-950/10 border-amber-500/20 text-amber-550 dark:text-amber-400' : 'bg-blue-950/10 border-blue-500/20 text-blue-550 dark:text-blue-400'
            }`}>
              <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                {actionType === 'sangria' ? <ArrowDownLeft className="w-3.5 h-3.5 text-amber-500" /> : <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />}
                REGISTRAR {actionType.toUpperCase()}
              </span>
              <button 
                onClick={() => {
                  setActionType(null);
                  setTxnError(null);
                }}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostTxn} className="p-4 space-y-3 bg-app-bg">
              <div className="space-y-1">
                <label className="font-bold text-app-muted uppercase block tracking-widest text-[9px]">VALOR DA OPERAÇÃO (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(formatCurrencyInput(e.target.value))}
                  className="w-full bg-app-card border border-app-border text-app-text font-mono font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-app-muted uppercase block tracking-widest text-[9px]">DESCRIÇÃO / JUSTIFICATIVA</label>
                <input
                  type="text"
                  value={txnDesc}
                  onChange={(e) => setTxnDesc(e.target.value)}
                  className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                  placeholder={actionType === 'sangria' ? 'EX: RETIRADA PERIÓDICA EXCEDENTE' : 'EX: SUPORTE ADICIONAL PARA MOEDAS'}
                  required
                />
              </div>

              {txnError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-[9px] uppercase">
                  {txnError}
                </div>
              )}

              <div className="pt-3 border-t border-app-border flex justify-end gap-2 bg-app-card -mx-4 -mb-4 p-3">
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={txnLoading}
                  className={`px-3 py-1.5 text-white font-bold rounded uppercase text-[9px] transition cursor-pointer ${
                    actionType === 'sangria' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {txnLoading ? 'PROCESSANDO...' : `CONFIRMAR ${actionType.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLOSE CASH BOX */}
      {closingModalOpen && cashStatus && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-app-card rounded border border-app-border max-w-md w-full shadow-2xl overflow-hidden text-[10px]">
            <div className="flex justify-between items-center px-3 py-2 border-b border-app-border bg-app-bg/50">
              <span className="font-bold text-app-text uppercase">FECHAMENTO E CONFERÊNCIA DE GAVETA</span>
              <button 
                onClick={() => {
                  setClosingModalOpen(false);
                  setClosingError(null);
                }}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseCashSubmit} className="p-4 space-y-3 bg-app-bg">
              <p className="text-[9px] text-app-muted leading-relaxed uppercase">
                CONTE O DINHEIRO FÍSICO PRESENTE EM SUA GAVETA E INFORME O VALOR ABAIXO. O SISTEMA CALCULALÁ AS DIVERGÊNCIAS REGISTRADAS NO LOG DE AUDITORIA.
              </p>

              {/* Expected balance info card */}
              <div className="bg-app-card rounded border border-app-border p-3 space-y-1.5 uppercase text-[9px]">
                <div className="flex justify-between text-app-subtle">
                  <span>Troco Inicial (Abertura):</span>
                  <span className="font-bold text-app-text font-mono">{formatBRL(cashStatus.openingBalance)}</span>
                </div>
                <div className="flex justify-between text-app-subtle">
                  <span>Receitas Dinheiro (Estac + Mensal):</span>
                  <span className="font-bold text-app-text font-mono">
                    {formatBRL(currentSessionTransactions.filter(t=>t.paymentMethod==='dinheiro' && !['sangria','despesa'].includes(t.type)).reduce((sum,t)=>sum+t.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-app-subtle">
                  <span>Sangrias / Despesas Caixa:</span>
                  <span className="font-bold text-rose-500 font-mono">
                    -{formatBRL(currentSessionTransactions.filter(t=>['sangria','despesa'].includes(t.type)).reduce((sum,t)=>sum+t.amount, 0))}
                  </span>
                </div>
                <div className="flex justify-between border-t border-app-border pt-1.5 text-[10px] font-bold text-app-text uppercase">
                  <span>Saldo Esperado (Gaveta):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatBRL(cashStatus.expectedClosingBalance)}</span>
                </div>
              </div>

              {/* Counted Money Input */}
              <div className="space-y-1">
                <label className="font-bold text-app-muted uppercase block tracking-widest text-[9px]">VALOR FÍSICO CONTADO (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={informedClosingVal}
                  onChange={(e) => setInformedClosingVal(formatCurrencyInput(e.target.value))}
                  className="w-full bg-app-card border border-app-border text-app-text font-mono font-bold rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-center text-sm"
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              {/* Difference Preview calculation */}
              {informedClosingVal !== '' && (
                <div className={`p-2.5 rounded border text-[9px] flex items-center gap-2 uppercase ${
                  parseCurrency(informedClosingVal) - cashStatus.expectedClosingBalance === 0
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <div>
                    {parseCurrency(informedClosingVal) - cashStatus.expectedClosingBalance === 0 ? (
                      <span><strong>CONFERÊNCIA FECHADA!</strong> O VALOR INFORMADO BATE PERFEITAMENTE COM O SISTEMA.</span>
                    ) : (
                      <span>
                        <strong>DIVERGÊNCIA DETECTADA:</strong> HÁ UMA DIFERENÇA DE{' '}
                        <strong className="underline">
                          {formatBRL(parseCurrency(informedClosingVal) - cashStatus.expectedClosingBalance)}
                        </strong>. DESCREVA O MOTIVO NA CAIXA ABAIXO.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Justification input if there is a difference */}
              {informedClosingVal !== '' && parseCurrency(informedClosingVal) - cashStatus.expectedClosingBalance !== 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-app-muted uppercase block tracking-widest text-[9px]">JUSTIFICATIVA DA DIVERGÊNCIA</label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="EX: QUEBRA DE TROCO INVOLUNTÁRIA / DEVOLUÇÃO EQUIVOCADA..."
                    rows={2}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30 font-mono"
                    required
                  />
                </div>
              )}

              {closingError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded text-[9px] uppercase">
                  {closingError}
                </div>
              )}

              <div className="pt-3 border-t border-app-border flex gap-2 justify-end bg-app-card -mx-4 -mb-4 p-3">
                <button
                  type="button"
                  onClick={() => setClosingModalOpen(false)}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                >
                  RETORNAR
                </button>
                <button
                  type="submit"
                  disabled={closingLoading}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded uppercase text-[9px] shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {closingLoading ? 'SINCRO...' : 'EFETUAR FECHAMENTO HOMOLOGADO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
