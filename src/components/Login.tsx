import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface LoginProps {
  parkingName: string;
  logoUrl?: string;
  onLoginSuccess: () => void | Promise<void>;
}

export default function Login({ parkingName, logoUrl, onLoginSuccess }: LoginProps) {
  const [screen, setScreen] = useState<'login' | 'recovery'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brand = parkingName || 'ParkGestor';

  const clearError = () => setError(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    setLoading(true);
    try {
      await api.login(identifier, password);
      await onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Não foi possível entrar no sistema.');
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider"><ShieldCheck className="w-4 h-4" /> ACESSO PROTEGIDO</span>
            <h1 className="mt-5 text-3xl sm:text-4xl font-black leading-tight">Controle do seu estacionamento, em um só lugar.</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-indigo-100">Acesse o painel para registrar entradas, acompanhar o pátio e movimentar o caixa.</p>
          </motion.div>
          <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} {brand}</p>
        </section>
        <section className="px-7 py-9 sm:px-12 sm:py-14 flex items-center">
          <div className="w-full max-w-sm mx-auto">
            {screen === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-black tracking-tight">Acesso do colaborador</h2>
                <p className="text-sm text-slate-500">Informe seu nome de usuário ou e-mail e a sua senha.</p>
                <Field label="Nome de usuário ou e-mail" icon={<UserRound className="w-4 h-4" />} value={identifier} onChange={(value) => { setIdentifier(value); clearError(); }} placeholder="Seu nome de usuário ou e-mail" autoComplete="username" />
                <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Senha</span><span className="relative block"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); clearError(); }} placeholder="Sua senha" autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></span></label>
                <button type="button" onClick={() => setScreen('recovery')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Esqueci minha senha</button>
                <Message error={error} />
                <button disabled={loading} type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">{loading ? 'Entrando...' : <>Entrar no sistema <ArrowRight className="w-4 h-4" /></>}</button>
              </form>
            ) : (
              <RecoveryInfo onBack={() => setScreen('login')} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function RecoveryInfo({ onBack }: { onBack: () => void }) {
  return <><button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800"><ArrowLeft className="w-4 h-4" /> Voltar ao acesso</button><h2 className="mt-5 text-2xl font-black tracking-tight">Recuperar acesso</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Para proteger a sua conta, a senha não pode ser redefinida somente com o e-mail. Solicite ao administrador do estacionamento uma nova senha pelo cadastro de usuários.</p><div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">O administrador pode alterar a senha pelo menu Configuração &gt; Usuários.</div></>;
}

function Field({ label, icon, type = 'text', value, onChange, placeholder, autoComplete }: any) {
  return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" required /></span></label>;
}

function Message({ error }: { error: string | null }) {
  return error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div> : null;
}
