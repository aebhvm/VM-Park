import React, { useState } from 'react';
import { 
  Users, Search, PlusCircle, CreditCard, ShieldAlert, CheckCircle, 
  X, AlertTriangle, Edit3, CheckCircle2, UserPlus, Info, RefreshCw 
} from 'lucide-react';
import { api } from '../lib/api';
import { Subscriber, SubscriberPlan } from '../types';
import {
  formatCpfCnpj,
  formatPhone,
  formatPlate,
  formatPlateList,
  getDocumentLabel,
  isValidPlate,
  normalizeDocument,
  normalizePhone,
  normalizePlate,
  normalizeSearchText
} from '../lib/masks';
import { motion, AnimatePresence } from 'motion/react';

interface SubscribersProps {
  subscribers: Subscriber[];
  subscriberPlans: SubscriberPlan[];
  onRefresh: () => void;
  cashStatus: any;
  currentUser: any;
}

export default function Subscribers({
  subscribers,
  subscriberPlans,
  onRefresh,
  cashStatus,
  currentUser
}: SubscribersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [payModalSub, setPayModalSub] = useState<Subscriber | null>(null);
  const [editModalSub, setEditModalSub] = useState<Subscriber | null>(null);

  // Creation form state
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [plates, setPlates] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDocument, setEditDocument] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPlanId, setEditPlanId] = useState('');
  const [editPlates, setEditPlates] = useState('');
  const [editDueDay, setEditDueDay] = useState('10');
  const [editStatus, setEditStatus] = useState<'active' | 'pending' | 'expired' | 'suspended'>('active');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Payment form state
  const [payMethod, setPayMethod] = useState<'dinheiro' | 'pix' | 'debito' | 'credito'>('pix');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const filteredSubscribers = subscribers.filter(s => {
    const normalizedQuery = normalizeSearchText(searchQuery);
    const matchesQuery = normalizeSearchText(s.name).includes(normalizedQuery) ||
                         normalizeSearchText(s.phone).includes(normalizedQuery) ||
                         (s.document && normalizeSearchText(s.document).includes(normalizedQuery)) ||
                         s.plates.some(p => normalizeSearchText(p).includes(normalizedQuery));

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesQuery && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">Ativo</span>;
      case 'pending':
        return <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">Pendente</span>;
      case 'expired':
        return <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 uppercase">Vencido</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-app-bg text-app-muted border border-app-border uppercase">Suspenso</span>;
    }
  };

  const handleOpenCreateModal = () => {
    if (subscriberPlans.length > 0) {
      setPlanId(subscriberPlans[0].id);
    }
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !planId || !plates) {
      setCreateError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const normalizedPhone = normalizePhone(phone);
    const normalizedDocument = normalizeDocument(document);
    const platesArray = plates.split(',').map(normalizePlate).filter(Boolean);
    if (normalizedPhone.length !== 10 && normalizedPhone.length !== 11) {
      setCreateError('Informe um telefone com DDD válido.');
      return;
    }
    if (normalizedDocument && normalizedDocument.length !== 11 && normalizedDocument.length !== 14) {
      setCreateError('Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.');
      return;
    }
    if (platesArray.some(plateValue => !isValidPlate(plateValue))) {
      setCreateError('Informe placas válidas nos formatos ABC-1234 ou ABC1D23.');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);
    try {
      await api.createSubscriber({
        name,
        document: normalizedDocument,
        phone: normalizedPhone,
        email,
        planId,
        plates: platesArray,
        dueDay: parseInt(dueDay),
        notes
      });
      setCreateModalOpen(false);
      // Reset
      setName('');
      setDocument('');
      setPhone('');
      setEmail('');
      setPlates('');
      setDueDay('10');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao cadastrar mensalista.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEditModal = (sub: Subscriber) => {
    setEditModalSub(sub);
    setEditName(sub.name);
    setEditDocument(formatCpfCnpj(sub.document || ''));
    setEditPhone(formatPhone(sub.phone));
    setEditEmail(sub.email || '');
    setEditPlanId(sub.planId);
    setEditPlates(formatPlateList(sub.plates.join(', ')));
    setEditDueDay(sub.dueDay.toString());
    setEditStatus(sub.status);
    setEditNotes(sub.notes || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalSub) return;

    const normalizedPhone = normalizePhone(editPhone);
    const normalizedDocument = normalizeDocument(editDocument);
    const platesArray = editPlates.split(',').map(normalizePlate).filter(Boolean);
    if (normalizedPhone.length !== 10 && normalizedPhone.length !== 11) {
      setEditError('Informe um telefone com DDD válido.');
      return;
    }
    if (normalizedDocument && normalizedDocument.length !== 11 && normalizedDocument.length !== 14) {
      setEditError('Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.');
      return;
    }
    if (platesArray.some(plateValue => !isValidPlate(plateValue))) {
      setEditError('Informe placas válidas nos formatos ABC-1234 ou ABC1D23.');
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await api.updateSubscriber(editModalSub.id, {
        name: editName,
        document: normalizedDocument,
        phone: normalizedPhone,
        email: editEmail,
        planId: editPlanId,
        plates: platesArray,
        dueDay: parseInt(editDueDay),
        status: editStatus,
        notes: editNotes
      });
      setEditModalSub(null);
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'Erro ao atualizar dados.');
    } finally {
      setEditLoading(false);
    }
  };

  const handlePaySubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalSub) return;
    
    setPayLoading(true);
    setPayError(null);
    try {
      await api.paySubscription(payModalSub.id, payMethod);
      setPayModalSub(null);
      onRefresh();
    } catch (err: any) {
      setPayError(err.message || 'Erro ao registrar pagamento.');
    } finally {
      setPayLoading(false);
    }
  };
  return (
    <div className="space-y-6 pb-24 md:pb-6 text-sm animate-in fade-in duration-100 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-app-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Controle de Clientes Mensalistas</h2>
          <p className="text-xs text-app-muted mt-1">Gerencie planos de assinatura, placas autorizadas, vencimentos e histórico de recebimentos.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition active:scale-95 cursor-pointer shrink-0 shadow-md shadow-indigo-600/10"
        >
          <span>Cadastrar Mensalista</span>
        </button>
      </div>

      {/* Caixa Warning */}
      {!cashStatus && (
        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] flex gap-2.5 uppercase">
          <Info className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <h5 className="font-bold text-amber-700 dark:text-amber-300">AVISO: RECEBIMENTOS BLOQUEADOS</h5>
            <p className="mt-0.5 text-app-muted leading-normal normal-case font-sans">
              Você pode cadastrar e atualizar mensalistas livremente, mas para registrar pagamentos de mensalidade e renovar planos de acesso, você deve possuir uma sessão de <span className="font-bold font-mono uppercase text-amber-600 dark:text-amber-450 text-[9px]">caixa aberta</span> em seu operador de turno.
            </p>
          </div>
        </div>
      )}

      {/* Searching & Filter Option */}
      <div className="bg-app-card p-3 rounded border border-app-border flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-app-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="PESQUISAR POR NOME, PLACA, TELEFONE OU DOCUMENTO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-bg border border-app-border pl-8 pr-3 py-1.5 text-app-text placeholder-app-muted/30 rounded text-[10px] uppercase font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-app-bg text-app-text border border-app-border rounded text-[10px] px-2.5 py-1.5 focus:outline-none font-bold uppercase cursor-pointer"
        >
          <option value="all">TODOS STATUS</option>
          <option value="active">PLANO ATIVO / OK</option>
          <option value="pending">PENDENTE DE PAGAMENTO</option>
          <option value="expired">CONVÊNIO VENCIDO</option>
          <option value="suspended">CONVÊNIO SUSPENSO</option>
        </select>
      </div>

      {/* Grid List of subscribers */}
      {filteredSubscribers.length === 0 ? (
        <div className="bg-app-card rounded border border-app-border py-12 px-4 text-center">
          <Users className="w-10 h-10 text-app-muted mx-auto mb-2" />
          <h4 className="font-bold text-app-text text-[10px] uppercase tracking-wider">NENHUM MENSALISTA LOCALIZADO</h4>
          <p className="text-[9px] text-app-muted max-w-sm mx-auto mt-0.5 uppercase">
            Nenhum registro coincide com a chave de busca ou status especificado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {filteredSubscribers.map((s, index) => {
              const currentPlan = subscriberPlans.find(p => p.id === s.planId);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1, delay: Math.min(index * 0.03, 0.2) }}
                  className="bg-app-card rounded border border-app-border p-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2 border-b border-app-border pb-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-app-text text-[11px] truncate uppercase" title={s.name}>
                          {s.name}
                        </h4>
                        <span className="text-[9px] text-app-muted font-mono block">
                          {s.document ? `${getDocumentLabel(s.document)}: ${formatCpfCnpj(s.document)}` : 'DOCUMENTO: NÃO INFORMADO'}
                        </span>
                        <span className="text-[9px] text-app-muted font-mono block">TEL: {formatPhone(s.phone)}</span>
                      </div>
                      <span className="shrink-0">
                        {s.status === 'active' && <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">ATIVO</span>}
                        {s.status === 'pending' && <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">PENDENTE</span>}
                        {s.status === 'expired' && <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20 uppercase">VENCIDO</span>}
                        {s.status === 'suspended' && <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-slate-500/10 text-app-muted border border-slate-500/20 uppercase">SUSPENSO</span>}
                      </span>
                    </div>

                    <div className="py-1.5 space-y-1 text-[9px] uppercase">
                      <p className="flex justify-between text-app-muted">
                        <span>PLANO CONTRATADO:</span> 
                        <strong className="text-app-text">{currentPlan?.name?.toUpperCase() || 'MENSAL PADRÃO'}</strong>
                      </p>
                      <p className="flex justify-between text-app-muted">
                        <span>FATOR COBRANÇA:</span> 
                        <strong className="text-emerald-600 dark:text-emerald-400">{formatBRL(s.amount)}</strong>
                      </p>
                      <p className="flex justify-between text-app-muted">
                        <span>DIA RECORRÊNCIA:</span> 
                        <strong className="text-app-text">TODO DIA {s.dueDay}</strong>
                      </p>
                      <p className="flex justify-between text-app-muted">
                        <span>RENOVAÇÃO EM:</span> 
                        <strong className="text-app-text font-mono">{new Date(s.expiresAt).toLocaleDateString('pt-BR')}</strong>
                      </p>
                      <div className="pt-2">
                        <span className="text-[8px] text-app-muted uppercase tracking-widest block font-bold mb-1">PLACAS AUTORIZADAS</span>
                        <div className="flex flex-wrap gap-1">
                          {s.plates.map(plate => (
                            <span key={plate} className="px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-mono font-bold rounded text-[9px] uppercase">
                              {formatPlate(plate)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-3 border-t border-app-border mt-2">
                    <button
                      onClick={() => handleOpenEditModal(s)}
                      className="flex items-center justify-center gap-1 py-1 px-2 border border-app-border bg-app-bg hover:bg-app-border text-app-muted rounded text-[9px] font-bold uppercase transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDITAR</span>
                    </button>
                    <button
                      onClick={() => setPayModalSub(s)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-app-bg hover:bg-app-border border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold uppercase transition cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>BAIXA PAGAMENTO</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* MODAL 1: REGISTER NEW SUBSCRIBER */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-app-card rounded border border-app-border max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 font-mono text-[10px] my-8">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-app-border bg-app-bg/50">
              <span className="font-bold text-app-text uppercase">NOVO CADASTRO DE MENSALISTA</span>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 md:p-5 space-y-3 bg-app-bg">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">NOME COMPLETO *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EX: JULIO CESAR DE OLIVEIRA"
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">CPF OU CNPJ (OPCIONAL)</label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(formatCpfCnpj(e.target.value))}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    inputMode="numeric"
                    maxLength={18}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-app-muted/30"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">TELEFONE DE CONTATO *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(85) 99876-5432"
                    inputMode="tel"
                    maxLength={15}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-app-muted/30"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">ENDEREÇO DE E-MAIL</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="JULIO@GMAIL.COM"
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-app-muted/30 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">PLANO DE ACESSO *</label>
                  <select
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                    required
                  >
                    {subscriberPlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()} ({formatBRL(p.amount)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">DIA VENCIMENTO (1 A 28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-center"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">PLACAS AUTORIZADAS * (SEPARADAS POR VÍRGULA)</label>
                  <input
                    type="text"
                    value={plates}
                    onChange={(e) => setPlates(formatPlateList(e.target.value))}
                    placeholder="EX: ABC-1234, XYZ9W87"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono uppercase placeholder-app-muted/30"
                    required
                  />
                  <span className="text-[8px] text-app-muted block uppercase">Insira uma ou mais placas que ativam os portões automaticamente.</span>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">OBSERVAÇÕES ADICIONAIS</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="EX: COBRANÇA DIRETA, ACESSO PERMITIDO APENAS EM DIAS ÚTEIS..."
                    rows={2}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                  />
                </div>
              </div>

              {createError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded text-[9px] uppercase">
                  {createError}
                </div>
              )}

              <div className="pt-3 border-t border-app-border flex gap-2 justify-end bg-app-card -mx-4 -mb-4 p-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  {createLoading ? 'SALVANDO...' : 'CONFIRMAR CADASTRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SUBSCRIBER DETAILS */}
      {editModalSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-app-card rounded border border-app-border max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 font-mono text-[10px] my-8">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-app-border bg-app-bg/50">
              <span className="font-bold text-app-text uppercase">EDITAR CADASTRO DE MENSALISTA</span>
              <button 
                onClick={() => setEditModalSub(null)}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 md:p-5 space-y-3 bg-app-bg">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">NOME COMPLETO *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">CPF OU CNPJ</label>
                  <input
                    type="text"
                    value={editDocument}
                    onChange={(e) => setEditDocument(formatCpfCnpj(e.target.value))}
                    inputMode="numeric"
                    maxLength={18}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">TELEFONE DE CONTATO *</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                    inputMode="tel"
                    maxLength={15}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">ENDEREÇO DE E-MAIL</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">PLANO DE ACESSO *</label>
                  <select
                    value={editPlanId}
                    onChange={(e) => setEditPlanId(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                    required
                  >
                    {subscriberPlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name.toUpperCase()} ({formatBRL(p.amount)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">DIA VENCIMENTO (1 A 28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={editDueDay}
                    onChange={(e) => setEditDueDay(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-center"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">ALTERAR STATUS CADASTRAL</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                  >
                    <option value="active" className="text-emerald-500 font-bold">ATIVO / REGULAR</option>
                    <option value="pending" className="text-amber-500 font-bold">PENDENTE DE PAGAMENTO</option>
                    <option value="expired" className="text-rose-500 font-bold">EXPIRADO / VENCIDO</option>
                    <option value="suspended" className="text-app-muted font-bold">CONVÊNIO SUSPENSO</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">PLACAS AUTORIZADAS * (SEPARADAS POR VÍRGULA)</label>
                  <input
                    type="text"
                    value={editPlates}
                    onChange={(e) => setEditPlates(formatPlateList(e.target.value))}
                    placeholder="EX: ABC-1234, XYZ9W87"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">OBSERVAÇÕES ADICIONAIS</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded text-[9px] uppercase">
                  {editError}
                </div>
              )}

              <div className="pt-3 border-t border-app-border flex gap-2 justify-end bg-app-card -mx-4 -mb-4 p-3">
                <button
                  type="button"
                  onClick={() => setEditModalSub(null)}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-3 py-1.5 bg-app-border hover:bg-app-border-sub text-app-text border border-app-border rounded text-[9px] font-bold uppercase transition cursor-pointer"
                >
                  {editLoading ? 'SALVANDO...' : 'GRAVAR ALTERAÇÕES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PAY MONTHLY BILL & RENEW PLAN */}
      {payModalSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-app-card rounded border border-app-border max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 font-mono text-[10px]">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-app-border bg-app-bg/50">
              <span className="font-bold text-app-text uppercase">RECEBIMENTO DE CONVÊNIO</span>
              <button 
                onClick={() => {
                  setPayModalSub(null);
                  setPayError(null);
                }}
                className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySubscriptionSubmit} className="p-4 space-y-3 bg-app-bg">
              <div className="bg-app-card border border-app-border rounded p-3 text-[9px] space-y-1.5 uppercase">
                <p className="flex justify-between"><span>Mensalista:</span> <strong className="text-app-text">{payModalSub.name.toUpperCase()}</strong></p>
                <p className="flex justify-between"><span>Plano Associado:</span> <strong className="text-app-text">
                  {subscriberPlans.find(p=>p.id===payModalSub.planId)?.name?.toUpperCase() || 'MENSAL'}
                </strong></p>
                <p className="flex justify-between"><span>Vencimento Anterior:</span> <span className="font-mono text-app-muted">{new Date(payModalSub.expiresAt).toLocaleDateString('pt-BR')}</span></p>
                <div className="flex justify-between border-t border-app-border pt-2 text-[10px] font-bold uppercase text-app-text">
                  <span>VALOR DE COBRANÇA:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatBRL(payModalSub.amount)}</span>
                </div>
              </div>

              {/* Check active cash session before proceeding (RN-05) */}
              {!cashStatus ? (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded text-[9px] flex items-center gap-2 uppercase">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Você deve estar com o caixa aberto para registrar este pagamento de mensalidade.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">MÉTODO DE RECEBIMENTO</label>
                    <select
                      value={payMethod}
                      onChange={(e: any) => setPayMethod(e.target.value)}
                      className="w-full bg-app-card border border-app-border rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase text-app-text cursor-pointer"
                    >
                      <option value="dinheiro">DINHEIRO FÍSICO</option>
                      <option value="pix">PIX INSTANTÂNEO</option>
                      <option value="debito">CARTÃO DE DÉBITO</option>
                      <option value="credito">CARTÃO DE CRÉDITO</option>
                    </select>
                  </div>
                  
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[9px] flex items-start gap-1.5 leading-relaxed uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Ao autorizar, o saldo do caixa operacional será incrementado e o plano do cliente renovado por +30 dias automaticamente.</span>
                  </div>
                </>
              )}

              {payError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-450 rounded text-[9px] uppercase font-bold">
                  {payError}
                </div>
              )}

              <div className="pt-3 border-t border-app-border flex gap-2 justify-end bg-app-card -mx-4 -mb-4 p-3">
                <button
                  type="button"
                  onClick={() => setPayModalSub(null)}
                  className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={payLoading || !cashStatus}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded uppercase text-[9px] flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
                >
                  {payLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>HOMOLOGAR PAGAMENTO</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
