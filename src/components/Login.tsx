import React, { useState } from 'react';
import { 
  Shield, Key, Mail, Eye, EyeOff, CheckCircle, 
  ArrowRight, Sparkles, UserCheck, AlertTriangle
} from 'lucide-react';
import { User } from '../types';
import { motion } from 'motion/react';

interface LoginProps {
  users: User[];
  onLoginSuccess: (userId: string) => void;
}

export default function Login({ users, onLoginSuccess }: LoginProps) {
  const [selectedEmail, setSelectedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(true);

  // Auto-fill form based on user profile click
  const handleQuickSelect = (user: User) => {
    setSelectedEmail(user.email);
    setPassword('123456'); // Default simulated password for convenience
    setError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedEmail) {
      setError('Por favor, selecione ou insira um e-mail de login.');
      return;
    }

    if (!password) {
      setError('Por favor, insira sua senha de acesso.');
      return;
    }

    if (password !== '123456') {
      setError('Senha incorreta! Use a senha padrão "123456" para simulação.');
      return;
    }

    if (!lgpdAccepted) {
      setError('Você deve concordar com as diretrizes de privacidade da LGPD para continuar.');
      return;
    }

    setLoading(true);
    
    // Simulate slight backend latency for high-fidelity feeling
    setTimeout(() => {
      // Find the user by email
      const matchedUser = users.find(u => u.email.toLowerCase() === selectedEmail.toLowerCase());
      if (matchedUser) {
        // Record login timestamp
        matchedUser.lastLoginAt = new Date().toISOString();
        localStorage.setItem('isLoggedIn', 'true');
        onLoginSuccess(matchedUser.id);
      } else {
        setError('E-mail não cadastrado na base de colaboradores.');
        setLoading(false);
      }
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0c0f17] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Left side: Premium branding & LGPD Statement */}
      <div className="md:w-1/2 bg-indigo-600 dark:bg-indigo-950 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Background ambient light effects */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-[radial-gradient(circle_at_20%_30%,rgba(197,176,142,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-[#C5B08E] backdrop-blur-md shadow-lg border border-white/10 shrink-0">
            <svg viewBox="0 0 100 100" className="w-7 h-7 text-[#C5B08E]" fill="none" stroke="currentColor" strokeWidth="3">
              {/* Circular border */}
              <circle cx="50" cy="50" r="44" strokeWidth="3" fill="none" />
              {/* Pillars */}
              <line x1="33" y1="52" x2="33" y2="73" strokeWidth="4" strokeLinecap="round" />
              <line x1="67" y1="52" x2="67" y2="73" strokeWidth="4" strokeLinecap="round" />
              {/* Inner arch */}
              <path d="M 39 73 A 11 11 0 0 1 61 73" strokeWidth="3" strokeLinecap="round" />
              {/* Lintel/horizontal beam */}
              <line x1="26" y1="52" x2="74" y2="52" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="29" y1="47" x2="71" y2="47" strokeWidth="2.5" strokeLinecap="round" />
              {/* Top dome/arch cap */}
              <path d="M 33 47 C 33 28, 67 28, 67 47" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 40 40 C 40 33, 60 33, 60 40" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-base font-extrabold tracking-widest text-white block font-display">VM PARK</span>
            <span className="text-[10px] font-bold text-indigo-200 tracking-wider uppercase">Estacionamento & Valet</span>
          </div>
        </div>

        {/* Main Title Description */}
        <div className="relative z-10 my-12 md:my-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold text-indigo-200 tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">SISTEMA INTEGRADO</span>
            <h1 className="text-3xl lg:text-4xl font-black mt-4 leading-tight tracking-tight text-white font-sans">
              Segurança, controle de pátio e conformidade em um só lugar.
            </h1>
            <p className="text-indigo-100 text-sm mt-4 leading-relaxed max-w-md font-medium">
              Gerencie rotatividades de veículos, cobrança, fluxo de caixa e mensalidades sob as diretrizes da LGPD (Lei Geral de Proteção de Dados).
            </p>
          </motion.div>

          {/* Key LGPD Highlights on side banner */}
          <div className="grid grid-cols-1 gap-3 mt-8 bg-black/15 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <h4 className="text-xs font-extrabold tracking-wider uppercase text-indigo-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              CONFORMIDADE LGPD ATIVA
            </h4>
            <ul className="space-y-2 text-xs text-indigo-100">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Minimização de Dados:</strong> Captura estrita da placa para fins contratuais e de cobrança.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Segurança:</strong> Logs de auditoria fiscal e rastreabilidade total de cada operador.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span><strong>Direito de Esquecimento:</strong> Ferramentas integradas para mascarar e expurgar dados sensíveis.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Version Footer */}
        <div className="relative z-10 text-xs text-indigo-300 font-semibold flex items-center justify-between border-t border-white/10 pt-4">
          <span>© 2026 VM Park Inc.</span>
          <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[10px]">Versão v4.2.1 Stable</span>
        </div>
      </div>

      {/* Right side: Interactive Login form */}
      <div className="md:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-[#0c0f17]">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Acesso Colaborador</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Entre com as credenciais ou escolha um perfil simulado abaixo para testes rápidos.
            </p>
          </div>

          {/* Quick-select simulated profiles */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Perfis de Simulação Rápida
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {users.map(u => {
                const isSelected = selectedEmail.toLowerCase() === u.email.toLowerCase();
                let roleColor = 'border-slate-200 hover:border-slate-300 dark:border-slate-800';
                let iconBg = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                
                if (u.role === 'admin') {
                  roleColor = isSelected ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300';
                  iconBg = isSelected ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-500';
                } else if (u.role === 'manager') {
                  roleColor = isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300';
                  iconBg = isSelected ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-500';
                } else {
                  roleColor = isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300';
                  iconBg = isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500';
                }

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${roleColor} bg-slate-50/50 dark:bg-slate-900/40`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} mb-2 transition-colors`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold block truncate w-full text-slate-800 dark:text-slate-200">{u.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5">{u.role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <span className="relative px-3 text-xs font-bold text-slate-400 bg-white dark:bg-[#0c0f17] uppercase tracking-widest">OU INSERIR DADOS</span>
          </div>

          {/* Email / Password Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">E-mail do Colaborador</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={selectedEmail}
                  onChange={(e) => {
                    setSelectedEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="nome@vmpark.com.br"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Dica: 123456</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="******"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* LGPD Consent Checkbox */}
            <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="lgpdAccepted"
                checked={lgpdAccepted}
                onChange={(e) => setLgpdAccepted(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-0 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 w-4 h-4 mt-0.5 cursor-pointer"
              />
              <label htmlFor="lgpdAccepted" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer leading-relaxed">
                Estou ciente e concordo com o processamento de dados operacionais e logs de auditoria de caixa nos termos da <strong>LGPD</strong>.
              </label>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs flex items-center gap-2 uppercase font-bold tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-200" />
                  <span>AUTENTICANDO NO SISTEMA...</span>
                </>
              ) : (
                <>
                  <span>Fazer Login no Caixa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
