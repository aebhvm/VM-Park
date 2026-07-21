import React, { useState } from 'react';
import { 
  Settings, Users, ClipboardList, Coins, AlertCircle, CheckCircle2, 
  Trash2, ShieldAlert, Plus, Calendar, FileText, Info, RefreshCw, X, Pencil
} from 'lucide-react';
import { api } from '../lib/api';
import {
  formatCpfCnpj,
  formatCurrencyInput,
  formatCurrencyValue,
  formatPhone,
  formatPlate,
  isValidPlate,
  normalizeDocument,
  normalizePhone,
  normalizePlate,
  parseCurrency
} from '../lib/masks';
import { User, Expense, AuditLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminConfigProps {
  parkingConfig: any;
  pricingPlans?: any[];
  subscriberPlans?: any[];
  users: User[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  onRefresh: () => void;
  currentUser: User;
  cashStatus: any;
}

export default function AdminConfig({
  parkingConfig,
  pricingPlans = [],
  subscriberPlans = [],
  users,
  expenses,
  auditLogs,
  onRefresh,
  currentUser,
  cashStatus
}: AdminConfigProps) {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'tariffs' | 'lgpd' | 'expenses' | 'audits' | 'users'>('config');

  // --- SUBTAB 1: Configuration state ---
  const [lotName, setLotName] = useState(parkingConfig?.name || '');
  const [lotDoc, setLotDoc] = useState(formatCpfCnpj(parkingConfig?.document || ''));
  const [lotPhone, setLotPhone] = useState(formatPhone(parkingConfig?.phone || ''));
  const [lotAddress, setLotAddress] = useState(parkingConfig?.address || '');
  const [lotLogoUrl, setLotLogoUrl] = useState(parkingConfig?.logoUrl || '');
  const [lotSpaces, setLotSpaces] = useState(parkingConfig?.totalSpaces?.toString() || '90');
  const [lotTolerance, setLotTolerance] = useState(parkingConfig?.toleranceMinutes?.toString() || '15');
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // --- SUBTAB NEW: Tariffs & Plan states ---
  const [carHourly, setCarHourly] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-car')?.hourlyRate ?? 8));
  const [carTolerance, setCarTolerance] = useState(() => pricingPlans?.find(p => p.id === 'plan-car')?.toleranceMinutes?.toString() || '15');
  const [carDailyMax, setCarDailyMax] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-car')?.dailyMax ?? 45));

  const [motoHourly, setMotoHourly] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-moto')?.hourlyRate ?? 4));
  const [motoTolerance, setMotoTolerance] = useState(() => pricingPlans?.find(p => p.id === 'plan-moto')?.toleranceMinutes?.toString() || '15');
  const [motoDailyMax, setMotoDailyMax] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-moto')?.dailyMax ?? 25));

  const [truckHourly, setTruckHourly] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-truck')?.hourlyRate ?? 12));
  const [truckTolerance, setTruckTolerance] = useState(() => pricingPlans?.find(p => p.id === 'plan-truck')?.toleranceMinutes?.toString() || '15');
  const [truckDailyMax, setTruckDailyMax] = useState(() => formatCurrencyValue(pricingPlans?.find(p => p.id === 'plan-truck')?.dailyMax ?? 60));

  const [subCarAmount, setSubCarAmount] = useState(() => formatCurrencyValue(subscriberPlans?.find(p => p.id === 'sub-plan-car')?.amount ?? 180));
  const [subCarLimit, setSubCarLimit] = useState(() => subscriberPlans?.find(p => p.id === 'sub-plan-car')?.simultaneousLimit?.toString() || '1');

  const [subMotoAmount, setSubMotoAmount] = useState(() => formatCurrencyValue(subscriberPlans?.find(p => p.id === 'sub-plan-moto')?.amount ?? 90));
  const [subMotoLimit, setSubMotoLimit] = useState(() => subscriberPlans?.find(p => p.id === 'sub-plan-moto')?.simultaneousLimit?.toString() || '1');

  const [tariffsLoading, setTariffsLoading] = useState(false);
  const [tariffsSuccess, setTariffsSuccess] = useState(false);
  const [tariffsError, setTariffsError] = useState<string | null>(null);

  // --- SUBTAB LGPD: LGPD states ---
  const [lgpdTerm, setLgpdTerm] = useState(parkingConfig?.lgpdTerm || 'Os dados de placa e veículo são coletados estritamente para controle operacional e faturamento de permanência, sob amparo legal de execução de contrato e legítimo interesse (Art. 7º, V e IX da Lei 13.709/18). Os registros históricos são retidos temporariamente e anonimizados após o prazo regulatório de faturamento.');
  const [lgpdDpoName, setLgpdDpoName] = useState(parkingConfig?.lgpdDpoName || 'Renata Souza (Gerente)');
  const [lgpdDpoEmail, setLgpdDpoEmail] = useState(parkingConfig?.lgpdDpoEmail || 'dpo@parkgestor.com.br');
  const [lgpdDpoPhone, setLgpdDpoPhone] = useState(formatPhone(parkingConfig?.lgpdDpoPhone || '(85) 3224-8899'));
  const [lgpdMaskPlatesOld, setLgpdMaskPlatesOld] = useState(parkingConfig?.lgpdMaskPlatesOld !== false);
  const [lgpdMaskDays, setLgpdMaskDays] = useState(parkingConfig?.lgpdMaskDays?.toString() || '30');
  const [lgpdConsentRequired, setLgpdConsentRequired] = useState(parkingConfig?.lgpdConsentRequired !== false);

  const [lgpdLoading, setLgpdLoading] = useState(false);
  const [lgpdSuccess, setLgpdSuccess] = useState(false);
  const [lgpdError, setLgpdError] = useState<string | null>(null);

  const [erasurePlate, setErasurePlate] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureResult, setErasureResult] = useState<string | null>(null);
  const [erasureError, setErasureError] = useState<string | null>(null);

  // --- SUBTAB 2: Expenses state ---
  const [expenseCategory, setExpenseCategory] = useState('Limpeza');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSupplier, setExpenseSupplier] = useState('');
  const [payFromCash, setPayFromCash] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [expenseSuccess, setExpenseSuccess] = useState(false);

  // --- SUBTAB 4: Users management ---
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'operator'>('operator');
  const [newUserActive, setNewUserActive] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigError(null);
    setConfigSuccess(false);
    try {
      await api.updateConfig({
        ...parkingConfig,
        name: lotName,
        document: normalizeDocument(lotDoc),
        phone: normalizePhone(lotPhone),
        address: lotAddress,
        logoUrl: lotLogoUrl.trim(),
        totalSpaces: parseInt(lotSpaces),
        toleranceMinutes: parseInt(lotTolerance)
      });
      setConfigSuccess(true);
      onRefresh();
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err: any) {
      setConfigError(err.message || 'Erro ao salvar configurações.');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTariffsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTariffsLoading(true);
    setTariffsError(null);
    setTariffsSuccess(false);
    try {
      await Promise.all([
        api.updatePricingPlan({
          id: 'plan-car',
          hourlyRate: parseCurrency(carHourly),
          toleranceMinutes: parseInt(carTolerance, 10),
          dailyMax: parseCurrency(carDailyMax)
        }),
        api.updatePricingPlan({
          id: 'plan-moto',
          hourlyRate: parseCurrency(motoHourly),
          toleranceMinutes: parseInt(motoTolerance, 10),
          dailyMax: parseCurrency(motoDailyMax)
        }),
        api.updatePricingPlan({
          id: 'plan-truck',
          hourlyRate: parseCurrency(truckHourly),
          toleranceMinutes: parseInt(truckTolerance, 10),
          dailyMax: parseCurrency(truckDailyMax)
        }),
        api.updateSubscriberPlan({
          id: 'sub-plan-car',
          amount: parseCurrency(subCarAmount),
          simultaneousLimit: parseInt(subCarLimit, 10)
        }),
        api.updateSubscriberPlan({
          id: 'sub-plan-moto',
          amount: parseCurrency(subMotoAmount),
          simultaneousLimit: parseInt(subMotoLimit, 10)
        })
      ]);
      setTariffsSuccess(true);
      onRefresh();
      setTimeout(() => setTariffsSuccess(false), 3000);
    } catch (err: any) {
      setTariffsError(err.message || 'Erro ao salvar tarifas e planos.');
    } finally {
      setTariffsLoading(false);
    }
  };

  const handleLgpdConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLgpdLoading(true);
    setLgpdError(null);
    setLgpdSuccess(false);
    try {
      await api.updateConfig({
        ...parkingConfig,
        lgpdTerm,
        lgpdDpoName,
        lgpdDpoEmail,
        lgpdDpoPhone: normalizePhone(lgpdDpoPhone),
        lgpdMaskPlatesOld,
        lgpdMaskDays: parseInt(lgpdMaskDays, 10),
        lgpdConsentRequired
      });
      setLgpdSuccess(true);
      onRefresh();
      setTimeout(() => setLgpdSuccess(false), 3000);
    } catch (err: any) {
      setLgpdError(err.message || 'Erro ao salvar parâmetros de privacidade.');
    } finally {
      setLgpdLoading(false);
    }
  };

  const handleErasureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPlate(erasurePlate)) {
      setErasureError('Informe uma placa válida no formato ABC-1234 ou ABC1D23.');
      return;
    }
    setErasureLoading(true);
    setErasureError(null);
    setErasureResult(null);
    try {
      const normalizedPlate = normalizePlate(erasurePlate);
      const res = await api.anonymizePlate(normalizedPlate);
      if (res.count === 0) {
        setErasureError(`Nenhum registro histórico finalizado foi encontrado para a placa "${formatPlate(normalizedPlate)}". Verifique se o veículo possui permanência em aberto ou se digitou corretamente.`);
      } else {
        setErasureResult(res.message);
        setErasurePlate('');
        onRefresh();
      }
    } catch (err: any) {
      setErasureError(err.message || 'Erro ao expurgar dados.');
    } finally {
      setErasureLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount || parseCurrency(expenseAmount) <= 0) {
      setExpenseError('Descreva o motivo e insira um valor válido para a despesa.');
      return;
    }

    setExpenseLoading(true);
    setExpenseError(null);
    setExpenseSuccess(false);
    try {
      await api.createExpense({
        category: expenseCategory,
        description: expenseDesc,
        amount: parseCurrency(expenseAmount),
        expenseDate,
        supplier: expenseSupplier || undefined,
        payFromCash
      });
      setExpenseSuccess(true);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseSupplier('');
      setPayFromCash(false);
      onRefresh();
      setTimeout(() => setExpenseSuccess(false), 3000);
    } catch (err: any) {
      setExpenseError(err.message || 'Erro ao registrar despesa.');
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || (!editingUser && !newUserPassword)) {
      setUserError('Preencha o nome, e-mail e senha do colaborador.');
      return;
    }
    if (newUserPassword && newUserPassword.length < 6) {
      setUserError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setUserLoading(true);
    setUserError(null);
    try {
      const userData = {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        active: newUserActive
      };
      if (editingUser) {
        await api.updateUser(editingUser.id, userData);
      } else {
        await api.createUser(userData);
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('operator');
      setNewUserActive(true);
      onRefresh();
    } catch (err: any) {
      setUserError(err.message || `Erro ao ${editingUser ? 'editar' : 'criar'} usuário.`);
    } finally {
      setUserLoading(false);
    }
  };

  const openUserModal = (user?: User) => {
    setEditingUser(user || null);
    setNewUserName(user?.name || '');
    setNewUserEmail(user?.email || '');
    setNewUserPassword('');
    setNewUserRole(user?.role || 'operator');
    setNewUserActive(user?.active ?? true);
    setUserError(null);
    setUserModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) return;
    setUserLoading(true);
    setUserError(null);
    try {
      await api.deleteUser(user.id);
      onRefresh();
    } catch (err: any) {
      setUserError(err.message || 'Erro ao excluir usuário.');
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6 text-sm animate-in fade-in duration-100 transition-all">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-app-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-app-text theme-font-title">Administração & Controle Interno</h2>
          <p className="text-xs text-app-muted mt-1">Configure parâmetros operacionais, lance despesas e audite o log de alterações.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="p-1.5 bg-app-card border border-app-border hover:bg-app-border-sub rounded text-app-muted transition cursor-pointer"
          title="Sincronizar dados"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-550" />
        </button>
      </div>

      {/* Admin Tab Switching Navigation */}
      <div className="flex border-b border-app-border text-[10px] font-bold text-app-muted overflow-x-auto gap-1">
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'config' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('config')}
        >
          Dados Estacionamento
        </button>
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'tariffs' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('tariffs')}
        >
          Tarifas e Planos
        </button>
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'lgpd' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('lgpd')}
        >
          Privacidade LGPD
        </button>
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'expenses' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('expenses')}
        >
          Saídas & Despesas
        </button>
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'audits' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('audits')}
        >
          Auditoria de Ações
        </button>
        <button
          className={`py-2 px-3 border-b-2 transition uppercase whitespace-nowrap ${activeSubTab === 'users' ? 'border-indigo-500 text-indigo-500 font-bold bg-indigo-500/5' : 'border-transparent hover:text-app-text bg-transparent'}`}
          onClick={() => setActiveSubTab('users')}
        >
          Colaboradores
        </button>
      </div>

      {/* Tab Contents */}
      <div className="mt-3">
        {/* SUBTAB 1: LOT CONFIG */}
        {activeSubTab === 'config' && (
          <div className="max-w-2xl theme-card p-4">
            <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Configurações Cadastrais</h3>
            <p className="text-[10px] text-app-muted mb-4">Dados impressos nos comprovantes físicos e chaves fiscais.</p>

            <form onSubmit={handleConfigSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-app-bg p-3 rounded border border-app-border">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">NOME FANTASIA / RAZÃO SOCIAL *</label>
                  <input
                    type="text"
                    value={lotName}
                    onChange={(e) => setLotName(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">CNPJ OU CPF DO ESTABELECIMENTO *</label>
                  <input
                    type="text"
                    value={lotDoc}
                    onChange={(e) => setLotDoc(formatCpfCnpj(e.target.value))}
                    inputMode="numeric"
                    maxLength={18}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">TELEFONE GERAL CONTATO *</label>
                  <input
                    type="tel"
                    value={lotPhone}
                    onChange={(e) => setLotPhone(formatPhone(e.target.value))}
                    inputMode="tel"
                    maxLength={15}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">ENDEREÇO LOGRADOURO COMPLETO</label>
                  <input
                    type="text"
                    value={lotAddress}
                    onChange={(e) => setLotAddress(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase font-mono"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">LOGO DA EMPRESA (URL DA IMAGEM)</label>
                  <input
                    type="url"
                    value={lotLogoUrl}
                    onChange={(e) => setLotLogoUrl(e.target.value)}
                    placeholder="https://suaempresa.com/logo.png"
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-app-subtle">Cole o endereço público da imagem para exibi-la na tela de acesso. Deixe em branco para usar a marca padrão.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">QUANTIDADE TOTAL DE VAGAS</label>
                  <input
                    type="number"
                    value={lotSpaces}
                    onChange={(e) => setLotSpaces(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-center font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">TOLERÂNCIA DE SAÍDA / ENTRADA (MINUTOS)</label>
                  <input
                    type="number"
                    value={lotTolerance}
                    onChange={(e) => setLotTolerance(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 text-center font-mono"
                    required
                  />
                </div>
              </div>

              {currentUser.role !== 'admin' && (
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Acesso Restrito: Apenas Administradores podem salvar configurações fiscais.</span>
                </div>
              )}

              {configError && (
                <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase font-bold text-[9px]">{configError}</div>
              )}

              {configSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-2 uppercase font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Configurações atualizadas e auditadas!</span>
                </div>
              )}

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={configLoading || currentUser.role !== 'admin'}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase transition disabled:opacity-40 cursor-pointer"
                >
                  {configLoading ? 'ATUALIZANDO...' : 'SALVAR ALTERAÇÕES'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBTAB 2: TARIFFS & PLAN CONFIG */}
        {activeSubTab === 'tariffs' && (
          <div className="max-w-4xl theme-card p-4">
            <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Tabelas de Preços e Planos</h3>
            <p className="text-[10px] text-app-muted mb-4">Gerencie as tarifas horárias dos clientes avulsos e os valores dos planos de mensalistas.</p>

            <form onSubmit={handleTariffsSubmit} className="space-y-4">
              
              {/* Rotativos Block */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest border-b border-app-border pb-1.5 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Tarifas Rotativas (Avulsos)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* CARROS */}
                  <div className="bg-app-bg p-3 rounded border border-app-border space-y-2.5">
                    <span className="text-[10px] font-extrabold text-app-text block uppercase border-b border-app-border pb-1">Carros / SUVs</span>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">VALOR DA HORA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carHourly}
                        onChange={(e) => setCarHourly(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">TOLERÂNCIA (MINUTOS)</label>
                      <input
                        type="number"
                        value={carTolerance}
                        onChange={(e) => setCarTolerance(e.target.value)}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">LIMITE DIÁRIA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={carDailyMax}
                        onChange={(e) => setCarDailyMax(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* MOTOS */}
                  <div className="bg-app-bg p-3 rounded border border-app-border space-y-2.5">
                    <span className="text-[10px] font-extrabold text-app-text block uppercase border-b border-app-border pb-1">Motocicletas</span>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">VALOR DA HORA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={motoHourly}
                        onChange={(e) => setMotoHourly(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">TOLERÂNCIA (MINUTOS)</label>
                      <input
                        type="number"
                        value={motoTolerance}
                        onChange={(e) => setMotoTolerance(e.target.value)}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">LIMITE DIÁRIA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={motoDailyMax}
                        onChange={(e) => setMotoDailyMax(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                  </div>

                  {/* CAMINHÕES */}
                  <div className="bg-app-bg p-3 rounded border border-app-border space-y-2.5">
                    <span className="text-[10px] font-extrabold text-app-text block uppercase border-b border-app-border pb-1">Caminhões / Vans</span>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">VALOR DA HORA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={truckHourly}
                        onChange={(e) => setTruckHourly(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">TOLERÂNCIA (MINUTOS)</label>
                      <input
                        type="number"
                        value={truckTolerance}
                        onChange={(e) => setTruckTolerance(e.target.value)}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">LIMITE DIÁRIA (R$)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={truckDailyMax}
                        onChange={(e) => setTruckDailyMax(formatCurrencyInput(e.target.value))}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                        required
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Mensalistas Block */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest border-b border-app-border pb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Planos de Mensalistas (Assinaturas)</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* PLAN CAR */}
                  <div className="bg-app-bg p-3 rounded border border-app-border flex gap-3 items-center justify-between">
                    <div>
                      <strong className="text-app-text text-[10px] uppercase block">Mensal Carro 24h</strong>
                      <span className="text-[8px] text-app-muted uppercase">Cobrança Mensal Recorrente</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="space-y-1 w-24">
                        <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">VALOR MENSAL</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={subCarAmount}
                          onChange={(e) => setSubCarAmount(formatCurrencyInput(e.target.value))}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                          required
                        />
                      </div>
                      <div className="space-y-1 w-20">
                        <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">LIMITE VEÍCULOS</label>
                        <input
                          type="number"
                          value={subCarLimit}
                          onChange={(e) => setSubCarLimit(e.target.value)}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* PLAN MOTO */}
                  <div className="bg-app-bg p-3 rounded border border-app-border flex gap-3 items-center justify-between">
                    <div>
                      <strong className="text-app-text text-[10px] uppercase block">Mensal Moto 24h</strong>
                      <span className="text-[8px] text-app-muted uppercase">Cobrança Mensal Recorrente</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="space-y-1 w-24">
                        <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">VALOR MENSAL</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={subMotoAmount}
                          onChange={(e) => setSubMotoAmount(formatCurrencyInput(e.target.value))}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                          required
                        />
                      </div>
                      <div className="space-y-1 w-20">
                        <label className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">LIMITE VEÍCULOS</label>
                        <input
                          type="number"
                          value={subMotoLimit}
                          onChange={(e) => setSubMotoLimit(e.target.value)}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono text-center"
                          required
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {currentUser.role !== 'admin' && currentUser.role !== 'manager' && (
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] flex items-center gap-2 uppercase">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Acesso Restrito: Apenas Gestores ou Administradores podem atualizar tabelas de preços.</span>
                </div>
              )}

              {tariffsError && (
                <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase font-bold text-[9px]">{tariffsError}</div>
              )}

              {tariffsSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-2 uppercase font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tarifas e Planos atualizados com sucesso e logs de auditoria gerados!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={tariffsLoading || (currentUser.role !== 'admin' && currentUser.role !== 'manager')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase transition disabled:opacity-40 cursor-pointer"
                >
                  {tariffsLoading ? 'ATUALIZANDO...' : 'SALVAR TARIFAS & PLANOS'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SUBTAB 3: LGPD & PRIVACY CONFIG */}
        {activeSubTab === 'lgpd' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* LGPD Settings Form */}
            <div className="theme-card p-4 lg:col-span-2 space-y-3">
              <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Políticas de Privacidade (LGPD)</h3>
              <p className="text-[10px] text-app-muted mb-4">Gerencie as diretrizes de conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/18).</p>

              <form onSubmit={handleLgpdConfigSubmit} className="space-y-3">
                <div className="bg-app-bg p-3 rounded border border-app-border space-y-3.5 text-[10px]">
                  
                  {/* Toggle 1: Consent Required */}
                  <div className="flex items-center justify-between border-b border-app-border/40 pb-2.5">
                    <div>
                      <strong className="text-app-text block uppercase font-bold text-[9px]">Exigir Consentimento dos Colaboradores</strong>
                      <span className="text-[8px] text-app-muted uppercase">Exibe termo de aceite obrigatório na tela de login</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={lgpdConsentRequired}
                        onChange={(e) => setLgpdConsentRequired(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-app-card border peer border-app-border rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-indigo-500 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-500/20 peer-checked:border-indigo-500"></div>
                    </label>
                  </div>

                  {/* Toggle 2: Auto Mask */}
                  <div className="flex items-center justify-between border-b border-app-border/40 pb-2.5">
                    <div>
                      <strong className="text-app-text block uppercase font-bold text-[9px]">Mascarar Histórico Automaticamente</strong>
                      <span className="text-[8px] text-app-muted uppercase">Ofusca placas de permanências finalizadas antigas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        value={lgpdMaskDays}
                        onChange={(e) => setLgpdMaskDays(e.target.value)}
                        className="w-12 bg-app-card border border-app-border text-app-text rounded px-1.5 py-0.5 text-center font-mono text-[9px]"
                        min="1"
                      />
                      <span className="text-[8px] text-app-muted uppercase font-bold">Dias</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={lgpdMaskPlatesOld}
                          onChange={(e) => setLgpdMaskPlatesOld(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-app-card border peer border-app-border rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-indigo-500 after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-500/20 peer-checked:border-indigo-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Textarea: Privacy Term */}
                  <div className="space-y-1">
                    <label className="text-[8px] font-extrabold text-app-muted uppercase block tracking-wider">TERMO DE PRIVACIDADE E TRATAMENTO (IMPRESSÃO / TELA)</label>
                    <textarea
                      rows={3}
                      value={lgpdTerm}
                      onChange={(e) => setLgpdTerm(e.target.value)}
                      className="w-full bg-app-card border border-app-border text-app-text rounded p-2 text-[9px] focus:outline-none focus:border-indigo-500 uppercase font-mono resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* DPO Information */}
                  <div className="space-y-2.5 pt-1.5">
                    <span className="text-[9px] font-extrabold text-app-text block uppercase tracking-wider">Encarregado de Proteção de Dados (DPO)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-app-muted uppercase block">NOME DO DPO</label>
                        <input
                          type="text"
                          value={lgpdDpoName}
                          onChange={(e) => setLgpdDpoName(e.target.value)}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 uppercase font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-app-muted uppercase block">E-MAIL DO DPO</label>
                        <input
                          type="email"
                          value={lgpdDpoEmail}
                          onChange={(e) => setLgpdDpoEmail(e.target.value)}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 lowercase font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-app-muted uppercase block">TELEFONE DO DPO</label>
                        <input
                          type="tel"
                          value={lgpdDpoPhone}
                          onChange={(e) => setLgpdDpoPhone(formatPhone(e.target.value))}
                          inputMode="tel"
                          maxLength={15}
                          className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {currentUser.role !== 'admin' && currentUser.role !== 'manager' && (
                  <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] flex items-center gap-2 uppercase">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Acesso Restrito: Apenas Gestores podem alterar diretrizes de privacidade.</span>
                  </div>
                )}

                {lgpdError && (
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase font-bold text-[9px]">{lgpdError}</div>
                )}

                {lgpdSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-2 uppercase font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Diretrizes e Termos LGPD gravados com sucesso!</span>
                  </div>
                )}

                <div className="pt-1.5 flex justify-end">
                  <button
                    type="submit"
                    disabled={lgpdLoading || (currentUser.role !== 'admin' && currentUser.role !== 'manager')}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase transition disabled:opacity-40 cursor-pointer"
                  >
                    {lgpdLoading ? 'GRAVANDO...' : 'SALVAR DIRETRIZES'}
                  </button>
                </div>
              </form>
            </div>

            {/* Erasure / Right to be forgotten (Direito ao Esquecimento) tool */}
            <div className="theme-card p-4 lg:col-span-1 h-fit space-y-3 border-l-2 border-rose-500/40">
              <h3 className="font-bold text-rose-500 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 animate-pulse" />
                <span>Direito ao Esquecimento</span>
              </h3>
              <p className="text-[10px] text-app-muted mb-4">Expurgar e anonimizar imediatamente todos os registros históricos finalizados de uma placa sob demanda do titular.</p>

              <form onSubmit={handleErasureSubmit} className="space-y-3">
                <div className="bg-app-bg p-3 rounded border border-app-border space-y-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-app-muted uppercase block">PLACA DO VEÍCULO DO TITULAR</label>
                    <input
                      type="text"
                      placeholder="EX: ABC-1234 OU ABC1D23"
                      value={erasurePlate}
                      onChange={(e) => setErasurePlate(formatPlate(e.target.value))}
                      maxLength={8}
                      autoCapitalize="characters"
                      spellCheck={false}
                      className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 text-center font-mono text-sm font-bold uppercase placeholder-app-muted/30"
                      required
                    />
                  </div>
                </div>

                {erasureError && (
                  <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase font-semibold text-[9px] leading-relaxed">{erasureError}</div>
                )}

                {erasureResult && (
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded space-y-1 text-[9px] uppercase font-bold leading-relaxed">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Expurgo Realizado!</span>
                    </div>
                    <p className="text-[8px] text-app-muted normal-case font-medium">{erasureResult}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={erasureLoading || (currentUser.role !== 'admin' && currentUser.role !== 'manager')}
                  className="w-full py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-500 hover:text-rose-400 border border-rose-500/30 hover:border-rose-500 rounded text-[10px] font-bold uppercase transition disabled:opacity-40 cursor-pointer"
                >
                  {erasureLoading ? 'ANONIMIZANDO...' : 'EXECUTAR ANONIMIZAÇÃO'}
                </button>
                
                <div className="p-2 bg-app-bg text-app-muted border border-app-border rounded text-[8px] leading-relaxed uppercase">
                  <strong>Atenção:</strong> Esta ação é irreversível e obedece ao Art. 16 da LGPD. Placas são mascaradas no histórico financeiro, impedindo rastreamento e identificação posterior.
                </div>
              </form>
            </div>

          </div>
        )}

        {/* SUBTAB 2: EXPENSES */}
        {activeSubTab === 'expenses' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Create expense card */}
            <div className="theme-card p-4 lg:col-span-1 h-fit">
              <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Registrar Despesa</h3>
              <p className="text-[10px] text-app-muted mb-4">Lançamentos de saídas operacionais, manutenção ou compras.</p>

              <form onSubmit={handleExpenseSubmit} className="space-y-3">
                <div className="bg-app-bg p-3 rounded border border-app-border space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">CATEGORIA DESPESA</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                    >
                      <option value="Limpeza">Insumos de Limpeza</option>
                      <option value="Energia">Energia Elétrica (Luz)</option>
                      <option value="Agua">Saneamento (Água)</option>
                      <option value="Funcionarios">Folha de Funcionários</option>
                      <option value="Manutencao">Manutenção Predial</option>
                      <option value="Seguranca">Segurança e alarmes</option>
                      <option value="Outros">Outras Despesas</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">DESCRIÇÃO MOTIVO *</label>
                    <input
                      type="text"
                      value={expenseDesc}
                      onChange={(e) => setExpenseDesc(e.target.value)}
                      placeholder="EX: COMPRA DE LÂMPADAS LED PARA SALÃO"
                      className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">VALOR SAÍDA (R$)*</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(formatCurrencyInput(e.target.value))}
                        placeholder="R$ 0,00"
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono text-center font-bold"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">DATA REGISTRO *</label>
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500 text-center font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">FORNECEDOR / CREDOR</label>
                    <input
                      type="text"
                      value={expenseSupplier}
                      onChange={(e) => setExpenseSupplier(e.target.value)}
                      placeholder="EX: LEROY MERLIN"
                      className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="payFromCash"
                      checked={payFromCash}
                      onChange={(e) => setPayFromCash(e.target.checked)}
                      className="rounded text-indigo-500 focus:ring-0 bg-app-card border-app-border w-3.5 h-3.5 mt-0.5"
                    />
                    <label htmlFor="payFromCash" className="text-[9px] text-app-muted font-bold uppercase cursor-pointer select-none leading-tight">
                      DEDUZIR DIRETAMENTE DO CAIXA FÍSICO DO OPERADOR
                    </label>
                  </div>
                </div>

                {payFromCash && (
                  <div className="p-2 bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/25 rounded text-[9px] uppercase leading-relaxed font-sans">
                    <strong>ATENÇÃO:</strong> Esta despesa reduzirá em tempo real o saldo de sangrias esperado para fechamento do turno atual.
                  </div>
                )}

                {expenseError && (
                  <div className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase text-[9px]">{expenseError}</div>
                )}

                {expenseSuccess && (
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1.5 uppercase font-bold text-[9px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Despesa homologada!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={expenseLoading}
                  className="w-full py-2 bg-app-card hover:bg-app-border-sub text-app-text border border-app-border hover:border-indigo-500 rounded text-[10px] font-bold uppercase transition cursor-pointer"
                >
                  {expenseLoading ? 'GRAVANDO...' : 'LANÇAR NO SISTEMA'}
                </button>
              </form>
            </div>

            {/* Expenses List */}
            <div className="theme-card p-4 lg:col-span-2">
              <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Livro Caixa de Saídas</h3>
              <p className="text-[10px] text-app-muted mb-4">Acompanhamento e classificação dos fluxos de saída.</p>

              <div className="overflow-x-auto border border-app-border rounded">
                <table className="w-full text-left text-[9px] border-collapse uppercase">
                  <thead>
                    <tr className="bg-app-bg border-b border-app-border text-app-muted">
                      <th className="p-2.5 font-bold tracking-wider">DATA</th>
                      <th className="p-2.5 font-bold tracking-wider">CATEGORIA</th>
                      <th className="p-2.5 font-bold tracking-wider">DESCRIÇÃO</th>
                      <th className="p-2.5 font-bold tracking-wider">OPERADOR</th>
                      <th className="p-2.5 font-bold tracking-wider text-right">VALOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border">
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-app-bg/40 text-app-text">
                        <td className="p-2.5 font-mono whitespace-nowrap text-app-subtle">
                          {new Date(e.expenseDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-app-bg text-app-muted border border-app-border font-bold uppercase text-[8px] tracking-wider">
                            {e.category}
                          </span>
                        </td>
                        <td className="p-2.5 max-w-[200px] truncate" title={e.description}>
                          <strong className="text-app-text">{e.description}</strong>
                          {e.supplier && <span className="block text-[8px] text-app-subtle">CRED: {e.supplier}</span>}
                        </td>
                        <td className="p-2.5 text-app-muted truncate max-w-[90px]" title={e.createdByName}>
                          {e.createdByName.split(' ')[0]}
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-500 font-mono">
                          -{formatBRL(e.amount)}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-app-subtle font-bold">NENHUM FLUXO DE DESPESA REGISTRADO NO MÊS.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: AUDITS */}
        {activeSubTab === 'audits' && (
          <div className="theme-card p-4">
            <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider mb-1">Rastreabilidade de Auditoria</h3>
            <p className="text-[10px] text-app-muted mb-4">Log transparente de exclusões, sangrias, cancelamentos e estornos.</p>

            <div className="overflow-x-auto border border-app-border rounded">
              <table className="w-full text-left text-[9px] border-collapse uppercase">
                <thead>
                  <tr className="bg-app-bg border-b border-app-border text-app-muted">
                    <th className="p-2.5 font-bold tracking-wider">HORÁRIO</th>
                    <th className="p-2.5 font-bold tracking-wider">COLABORADOR</th>
                    <th className="p-2.5 font-bold tracking-wider">AÇÃO REALIZADA</th>
                    <th className="p-2.5 font-bold tracking-wider">MÓDULO ENTIDADE</th>
                    <th className="p-2.5 font-bold tracking-wider">JUSTIFICATIVA REGISTRADA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-app-bg/40 text-app-text">
                      <td className="p-2.5 text-app-subtle whitespace-nowrap font-mono">
                        {new Date(log.createdAt).toLocaleDateString('pt-BR')} {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <strong className="text-app-text block">{log.userName}</strong>
                        <span className="text-[8px] text-app-subtle font-mono">ID: {log.userId.substring(0, 8)}</span>
                      </td>
                      <td className="p-2.5 text-app-text font-semibold font-mono">
                        {log.action}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-app-bg text-app-muted border border-app-border text-[8px] font-bold">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="p-2.5 text-app-muted italic font-sans max-w-[200px] truncate" title={log.reason || ''}>
                        {log.reason || <span className="text-app-subtle font-mono">-</span>}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-app-subtle font-bold">NENHUM REGISTRO DE AUDITORIA DISPONÍVEL.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: USERS MANAGEMENT */}
        {activeSubTab === 'users' && (
          <div className="theme-card p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-app-text text-[11px] uppercase tracking-wider">Controle de Usuários</h3>
                <p className="text-[10px] text-app-muted mt-0.5">Definição de perfis de acesso, permissões e login.</p>
              </div>
              <button
                onClick={() => openUserModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase transition shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Usuário</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-app-border rounded">
              <table className="w-full text-left text-[9px] border-collapse uppercase">
                <thead>
                  <tr className="bg-app-bg border-b border-app-border text-app-muted">
                    <th className="p-2.5 font-bold">NOME COLABORADOR</th>
                    <th className="p-2.5 font-bold">ENDEREÇO E-MAIL</th>
                    <th className="p-2.5 font-bold">PERFIL / NIVEL</th>
                    <th className="p-2.5 font-bold">STATUS</th>
                    <th className="p-2.5 font-bold">DATA ADMISSÃO</th>
                    <th className="p-2.5 font-bold text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-app-bg/40 text-app-text">
                      <td className="p-2.5 font-bold text-app-text">{u.name}</td>
                      <td className="p-2.5 text-app-muted font-mono lowercase">{u.email}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase ${
                          u.role === 'admin' 
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20' 
                            : u.role === 'manager' 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 font-bold uppercase text-[8px] ${u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-app-muted'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-550 dark:bg-emerald-500 animate-pulse' : 'bg-app-muted'}`}></span>
                          {u.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                      <td className="p-2.5 text-app-subtle font-mono">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => openUserModal(u)} title={`Editar ${u.name}`} className="p-1.5 rounded border border-app-border text-app-muted hover:text-indigo-500 hover:border-indigo-500 transition cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteUser(u)} disabled={userLoading} title={`Excluir ${u.name}`} className="p-1.5 rounded border border-app-border text-app-muted hover:text-rose-500 hover:border-rose-500 transition cursor-pointer disabled:opacity-40">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* USER FORM MODAL */}
            {userModalOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
                <div className="bg-app-card rounded border border-app-border max-w-sm w-full shadow-2xl overflow-hidden text-[10px]">
                  <div className="flex justify-between items-center px-4 py-2.5 border-b border-app-border bg-app-bg/50">
                    <span className="font-bold text-app-text uppercase">{editingUser ? 'EDITAR COLABORADOR' : 'ADICIONAR NOVO COLABORADOR'}</span>
                    <button 
                      onClick={() => {
                        setUserModalOpen(false);
                        setEditingUser(null);
                        setUserError(null);
                      }}
                      className="p-1 hover:bg-app-border rounded text-app-muted transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUserSubmit} className="p-4 space-y-3 bg-app-bg">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">NOME COMPLETO *</label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="EX: AMANDA SOUZA SILVA"
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 uppercase placeholder-app-muted/30"
                        required
                      />
                    </div>

                    {editingUser && (
                      <label className="flex items-center gap-2 text-[9px] font-bold text-app-muted uppercase cursor-pointer">
                        <input type="checkbox" checked={newUserActive} onChange={(e) => setNewUserActive(e.target.checked)} disabled={editingUser.id === currentUser.id} className="w-3.5 h-3.5 rounded border-app-border" />
                        Usuário ativo
                      </label>
                    )}
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">E-MAIL DE LOGIN *</label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="AMANDA@PARKGESTOR.COM"
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-app-muted/30 lowercase"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">
                        {editingUser ? 'NOVA SENHA (OPCIONAL)' : 'SENHA DE ACESSO *'}
                      </label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder={editingUser ? 'DEIXE EM BRANCO PARA MANTER A SENHA' : 'MÍNIMO DE 6 CARACTERES'}
                        minLength={newUserPassword ? 6 : undefined}
                        required={!editingUser}
                        autoComplete="new-password"
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 placeholder-app-muted/30"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-app-muted uppercase tracking-widest block">PERFIL PERMISSÃO ACESSO</label>
                      <select
                        value={newUserRole}
                        onChange={(e: any) => setNewUserRole(e.target.value)}
                        className="w-full bg-app-card border border-app-border text-app-text rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                      >
                        <option value="operator">Operador de Caixa (Restrito)</option>
                        <option value="manager">Gestor / Supervisor (Intermediário)</option>
                        <option value="admin">Administrador Geral (Total)</option>
                      </select>
                    </div>

                    {userError && (
                      <div className="p-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded uppercase font-bold text-[9px]">{userError}</div>
                    )}

                    <div className="pt-3 border-t border-app-border flex gap-2 justify-end bg-app-card -mx-4 -mb-4 p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUserModalOpen(false);
                          setEditingUser(null);
                        }}
                        className="px-3 py-1.5 text-[9px] font-bold uppercase text-app-muted hover:text-app-text cursor-pointer"
                      >
                        CANCELAR
                      </button>
                      <button
                        type="submit"
                        disabled={userLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase transition cursor-pointer"
                      >
                        {userLoading ? 'SALVANDO...' : editingUser ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
