import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { User } from '../types';

interface LoginProps {
  users: User[];
  parkingName: string;
  logoUrl?: string;
  onLoginSuccess: (userId: string) => void;
}

export default function Login({ parkingName, logoUrl, onLoginSuccess }: LoginProps) {
  const [screen, setScreen] = useState<'login' | 'recovery'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const brand = parkingName || 'ParkGestor';

  const clearMessages = () => { setError(null); setSuccess(null); };
  const changeScreen = (next: 'login' | 'recovery') => { setScreen(next); clearMessages(); };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const user = await api.login(identifier, password);
      localStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess(user.id);
    } catch (err: any) {
      setError(err.message || 'Não foi possível entrar no sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(email, newPassword);
      setSuccess('Senha alterada. Agora entre com suas novas credenciais.');
      setTimeout(() => { setIdentifier(email); changeScreen('login'); }, 1200);
    } catch (err: any) {
      setError(err.message || 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 grid md:grid-cols-[1.05fr_.95fr]">
        <section className="relative overflow-hidden bg-indigo-700 px-8 py-10 sm:px-12 sm:py-14 text-white flex flex-col justify-between min-h-[350px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,.18),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(129,140,248,.42),transparent_42%)]" />
          <div className="relative flex items-center gap-3">
            {logoUrl ? <img src={logoUrl} alt={`Logo ${brand}`} className="h-14 max-w-[180px] rounded-xl bg-white object-contain p-1.5" /> : <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-2xl">{brand.slice(0, 1).toUpperCase()}</div>}
            <div><p className="text-lg font-black tracking-tight">{brand}</p><p className="text-xs text-indigo-100 font-medium">Gestão inteligente de estacionamento</p></div>
          </div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45 }} className="relative my-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider"><ShieldCheck className="w-4 h-4" /> ACESSO SEGURO</span>
            <h1 className="mt-5 text-3xl sm:text-4xl font-black leading-tight">Controle do seu estacionamento, em um só lugar.</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-100">Acesse o painel para registrar entradas, acompanhar o pátio e movimentar o caixa.</p>
          </motion.div>
          <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} {brand}</p>
        </section>
        <section className="px-7 py-9 sm:px-12 sm:py-14 flex items-center">
          <div className="w-full max-w-sm mx-auto">
            {screen === 'login' ? <LoginForm identifier={identifier} password={password} showPassword={showPassword} loading={loading} error={error} success={success} onIdentifier={(value) => { setIdentifier(value); clearMessages(); }} onPassword={(value) => { setPassword(value); clearMessages(); }} onTogglePassword={() => setShowPassword(!showPassword)} onForgot={() => changeScreen('recovery')} onSubmit={handleLogin} /> : <RecoveryForm email={email} newPassword={newPassword} confirmPassword={confirmPassword} loading={loading} error={error} success={success} onEmail={(value) => { setEmail(value); clearMessages(); }} onNewPassword={(value) => { setNewPassword(value); clearMessages(); }} onConfirmPassword={(value) => { setConfirmPassword(value); clearMessages(); }} onBack={() => changeScreen('login')} onSubmit={handleRecovery} />}
          </div>
        </section>
      </div>
    </div>
  );
}

function LoginForm({ identifier, password, showPassword, loading, error, success, onIdentifier, onPassword, onTogglePassword, onForgot, onSubmit }: any) {
  return <><h2 className="text-2xl font-black tracking-tight">Acesso do colaborador</h2><p className="mt-1 text-sm text-slate-500">Informe seu nome de usuário ou e-mail e a sua senha.</p><form onSubmit={onSubmit} className="mt-8 space-y-4"><Field label="Nome de usuário ou e-mail" icon={<UserRound className="w-4 h-4" />} value={identifier} onChange={onIdentifier} placeholder="Seu nome de usuário ou e-mail" autoComplete="username" /><label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Senha</span><span className="relative block"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => onPassword(event.target.value)} placeholder="Sua senha" autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required /><button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></span></label><button type="button" onClick={onForgot} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Esqueci minha senha</button><Message error={error} success={success} /><button disabled={loading} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">{loading ? 'Entrando...' : <>Entrar no sistema <ArrowRight className="w-4 h-4" /></>}</button></form></>;
}

function RecoveryForm({ email, newPassword, confirmPassword, loading, error, success, onEmail, onNewPassword, onConfirmPassword, onBack, onSubmit }: any) {
  return <><button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800"><ArrowLeft className="w-4 h-4" /> Voltar ao acesso</button><h2 className="mt-5 text-2xl font-black tracking-tight">Redefinir senha</h2><p className="mt-1 text-sm text-slate-500">Informe o e-mail cadastrado e escolha uma nova senha.</p><form onSubmit={onSubmit} className="mt-8 space-y-4"><Field label="E-mail cadastrado" icon={<Mail className="w-4 h-4" />} type="email" value={email} onChange={onEmail} placeholder="nome@empresa.com" autoComplete="email" /><Field label="Nova senha" icon={<LockKeyhole className="w-4 h-4" />} type="password" value={newPassword} onChange={onNewPassword} placeholder="Mínimo de 6 caracteres" autoComplete="new-password" /><Field label="Confirmar nova senha" icon={<LockKeyhole className="w-4 h-4" />} type="password" value={confirmPassword} onChange={onConfirmPassword} placeholder="Repita a nova senha" autoComplete="new-password" /><Message error={error} success={success} /><button disabled={loading} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Alterando senha...' : 'Alterar senha'}</button></form></>;
}

function Field({ label, icon, type = 'text', value, onChange, placeholder, autoComplete }: any) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required /></span></label>;
}

function Message({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>;
  if (success) return <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</p>;
  return null;
}
