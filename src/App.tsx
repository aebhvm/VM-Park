import React, { lazy, Suspense, useState, useEffect } from 'react';
import { api, getActiveUserId, setActiveUserId } from './lib/api';
import { User, VehicleType, ParkingSession, SubscriberPlan, Subscriber, CashSession, Expense, AuditLog } from './types';
import Navigation from './components/Navigation';
import { RefreshCw, AlertCircle } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const NewEntry = lazy(() => import('./components/NewEntry'));
const ActiveSessions = lazy(() => import('./components/ActiveSessions'));
const CashRegister = lazy(() => import('./components/CashRegister'));
const Subscribers = lazy(() => import('./components/Subscribers'));
const AdminConfig = lazy(() => import('./components/AdminConfig'));
const Login = lazy(() => import('./components/Login'));

function ScreenLoader() {
  return <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-app-muted">Carregando módulo...</div>;
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'obsidian' | 'cyber'>(() => {
    return (localStorage.getItem('parkgestor-theme') as 'light' | 'obsidian' | 'cyber') || 'light';
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('parkgestor-theme', theme);
  }, [theme]);
  
  // Simulation Context States
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Data States
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [cashStatus, setCashStatus] = useState<CashSession | null>(null);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Status States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from Express API endpoints
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get configuration and system users first
      const [configData, usersData] = await Promise.all([
        api.getConfig(),
        api.getUsers()
      ]);
      
      setConfig(configData);
      setUsers(usersData);

      // Initialize or resolve current simulated user
      const savedUserId = getActiveUserId();
      let activeUser = usersData.find(u => u.id === savedUserId);
      if (!activeUser) {
        activeUser = usersData[2] || usersData[0]; // Fallback to Operator Lucas Lima
        setActiveUserId(activeUser.id);
      }
      setCurrentUser(activeUser);

      // 2. Fetch user-dependent and transactional datasets
      const [statsData, sessionsData, currentCashData, cashSessionsData, subscribersData, expensesData, auditLogsData] = await Promise.all([
        api.getDashboardStats(),
        api.getSessions(),
        api.getCashStatus(),
        api.getCashSessions(),
        api.getSubscribers(),
        api.getExpenses(),
        api.getAuditLogs()
      ]);

      setStats(statsData);
      setSessions(sessionsData);
      setCashStatus(currentCashData);
      setCashSessions(cashSessionsData);
      setSubscribers(subscribersData);
      setExpenses(expensesData);
      setAuditLogs(auditLogsData);
    } catch (err: any) {
      console.error('Error loading ParkGestor data:', err);
      setError(err.message || 'Falha de comunicação com o servidor ParkGestor. Verifique se o backend está ativo.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // When switching simulated user profiles
  const handleUserChange = async (userId: string) => {
    setActiveUserId(userId);
    setLoading(true);
    try {
      const activeUser = users.find(u => u.id === userId);
      if (activeUser) {
        setCurrentUser(activeUser);
        // Ensure we load their active cash session context and refresh stats
        const [currentCash, cashSessionsData, statsData, sessionsData] = await Promise.all([
          api.getCashStatus(),
          api.getCashSessions(),
          api.getDashboardStats(),
          api.getSessions()
        ]);
        setCashStatus(currentCash);
        setCashSessions(cashSessionsData);
        setStats(statsData);
        setSessions(sessionsData);
        
        // If switching to an operator who has no access to Administration tab, revert tab to dashboard
        if (activeUser.role === 'operator' && currentTab === 'admin') {
          setCurrentTab('dashboard');
        }
      }
    } catch (err: any) {
      console.error('Error switching simulated user context:', err);
    } finally {
      setLoading(false);
    }
  };

  // Quick action refresh handler to pass to children components
  const refreshStatsAndSessions = async () => {
    try {
      const [statsData, sessionsData, currentCash, cashSessionsData, subscribersData, expensesData, auditLogsData] = await Promise.all([
        api.getDashboardStats(),
        api.getSessions(),
        api.getCashStatus(),
        api.getCashSessions(),
        api.getSubscribers(),
        api.getExpenses(),
        api.getAuditLogs()
      ]);
      setStats(statsData);
      setSessions(sessionsData);
      setCashStatus(currentCash);
      setCashSessions(cashSessionsData);
      setSubscribers(subscribersData);
      setExpenses(expensesData);
      setAuditLogs(auditLogsData);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  // Loading Screen Layout
  if (loading && !config) {
    return (
      <div id="loading-screen" className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-app-muted gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1E4E44] flex items-center justify-center text-[#C5B08E] shadow-xl border border-[#C5B08E]/20 relative">
          <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#C5B08E]" fill="none" stroke="currentColor" strokeWidth="4">
            <circle cx="50" cy="50" r="44" strokeWidth="4" fill="none" />
            <line x1="33" y1="52" x2="33" y2="73" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="67" y1="52" x2="67" y2="73" strokeWidth="5.5" strokeLinecap="round" />
            <path d="M 39 73 A 11 11 0 0 1 61 73" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="26" y1="52" x2="74" y2="52" strokeWidth="6" strokeLinecap="round" />
            <line x1="29" y1="47" x2="71" y2="47" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 33 47 C 33 28, 67 28, 67 47" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 40 40 C 40 33, 60 33, 60 40" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#C5B08E] rounded-full border-2 border-[#1E4E44] flex items-center justify-center">
            <RefreshCw className="w-2.5 h-2.5 text-[#1E4E44] animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-base font-extrabold tracking-widest text-slate-800 dark:text-slate-100 font-display">VM PARK <span className="text-xs text-[#C5B08E] font-bold bg-[#1E4E44]/10 px-2 py-0.5 rounded-full ml-1">v4.2.1</span></h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1.5 font-mono">CONECTANDO AO BANCO DE DADOS...</p>
        </div>
      </div>
    );
  }

  // If not logged in and users are loaded, render the Login screen!
  if (!isLoggedIn && users.length > 0) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        <Login 
          users={users} 
          onLoginSuccess={(userId) => {
            handleUserChange(userId);
            setIsLoggedIn(true);
          }} 
        />
      </Suspense>
    );
  }

  // Error/Failure Screen Layout
  if (error) {
    return (
      <div id="error-screen" className="flex flex-col items-center justify-center min-h-screen bg-app-bg text-app-muted p-6 text-center font-mono">
        <div className="w-12 h-12 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-bold tracking-wider text-rose-500 uppercase">System Error / Communication Failure</h3>
        <p className="text-[10px] text-app-muted max-w-md mx-auto mt-2 leading-relaxed">
          {error}
        </p>
        <button
          onClick={fetchAllData}
          className="mt-6 px-4 py-2 bg-app-card border border-rose-500/30 text-rose-450 font-bold text-[10px] rounded uppercase tracking-wider transition active:scale-95 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const parkingName = config?.parkingLotConfig?.name || 'ParkGestor';

  return (
    <div className={`min-h-screen flex flex-col bg-app-bg text-app-text font-sans antialiased selection:bg-indigo-500/30 selection:text-white transition-colors duration-200 ${theme === 'cyber' ? 'font-mono' : ''}`}>
      {/* Top and sidebar navigations */}
      {currentUser && (
        <Navigation
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          users={users}
          currentUser={currentUser}
          onUserChange={handleUserChange}
          parkingName={parkingName}
          theme={theme}
          setTheme={setTheme}
          onLogout={handleLogout}
        />
      )}

      {/* Main Body container */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          <Suspense fallback={<ScreenLoader />}>
          {currentUser && (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  loading={loading}
                  onRefresh={refreshStatsAndSessions}
                  setCurrentTab={setCurrentTab}
                />
              )}
              {currentTab === 'entry' && (
                <NewEntry
                  vehicleTypes={config?.vehicleTypes || []}
                  subscribers={subscribers}
                  onSuccess={refreshStatsAndSessions}
                  cashStatus={cashStatus}
                  setCurrentTab={setCurrentTab}
                />
              )}
              {currentTab === 'vehicles' && (
                <ActiveSessions
                  sessions={sessions}
                  vehicleTypes={config?.vehicleTypes || []}
                  onRefresh={refreshStatsAndSessions}
                  cashStatus={cashStatus}
                  currentUser={currentUser}
                />
              )}
              {currentTab === 'cash' && (
                <CashRegister
                  cashStatus={cashStatus}
                  cashSessions={cashSessions}
                  transactions={[
                    ...sessions.filter(s => s.status === 'completed' && s.paymentMethod).map(s => ({
                      id: `txn-session-${s.id}`,
                      cashSessionId: cashStatus?.id || '',
                      type: 'recebimento_estacionamento' as const,
                      category: 'Estacionamento Avulso',
                      amount: s.finalAmount,
                      paymentMethod: s.paymentMethod as any,
                      description: `Pagamento de Estacionamento - Placa ${s.displayPlate} (Ticket: ${s.ticketNumber})`,
                      userId: s.exitUserId || '',
                      userName: users.find(u => u.id === s.exitUserId)?.name || 'Operador',
                      createdAt: s.exitAt || s.entryAt
                    })),
                    ...subscribers.filter(sub => sub.status === 'active' && sub.updatedAt > sub.createdAt).map(sub => ({
                      id: `txn-sub-${sub.id}`,
                      cashSessionId: cashStatus?.id || '',
                      type: 'recebimento_mensalidade' as const,
                      category: 'Mensalidade',
                      amount: sub.amount,
                      paymentMethod: 'pix' as any,
                      description: `Recebimento Mensalidade de ${sub.name}`,
                      userId: 'user-3',
                      userName: 'Lucas Lima',
                      createdAt: sub.updatedAt
                    })),
                    ...expenses.filter(e => e.payFromCash).map(e => ({
                      id: `txn-expense-${e.id}`,
                      cashSessionId: cashStatus?.id || '',
                      type: 'despesa' as const,
                      category: `Despesa: ${e.category}`,
                      amount: e.amount,
                      paymentMethod: 'dinheiro' as any,
                      description: `Pagamento de Despesa: ${e.description}`,
                      userId: e.createdById,
                      userName: e.createdByName,
                      createdAt: e.createdAt
                    }))
                  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                  onRefresh={refreshStatsAndSessions}
                  currentUser={currentUser}
                />
              )}
              {currentTab === 'subscribers' && (
                <Subscribers
                  subscribers={subscribers}
                  subscriberPlans={config?.subscriberPlans || []}
                  onRefresh={refreshStatsAndSessions}
                  cashStatus={cashStatus}
                  currentUser={currentUser}
                />
              )}
              {currentTab === 'admin' && (
                <AdminConfig
                  parkingConfig={config?.parkingLotConfig}
                  pricingPlans={config?.pricingPlans || []}
                  subscriberPlans={config?.subscriberPlans || []}
                  users={users}
                  expenses={expenses}
                  auditLogs={auditLogs}
                  onRefresh={fetchAllData}
                  currentUser={currentUser}
                  cashStatus={cashStatus}
                />
              )}
            </>
          )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
