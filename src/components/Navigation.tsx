import React, { useState } from 'react';
import { 
  LayoutDashboard, PlusCircle, Car, Coins, Users, Settings, 
  ChevronDown, UserCircle, Menu, X, Sun, Moon, Terminal, Shield, LogOut
} from 'lucide-react';
import { User } from '../types';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  parkingName: string;
  theme: 'light' | 'obsidian' | 'cyber';
  setTheme: (theme: 'light' | 'obsidian' | 'cyber') => void;
  onLogout?: () => void;
}

export default function Navigation({
  currentTab,
  setCurrentTab,
  currentUser,
  parkingName,
  theme,
  setTheme,
  onLogout
}: NavigationProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, roles: ['admin', 'manager', 'operator'] },
    { id: 'entry', label: 'Nova Entrada', icon: PlusCircle, roles: ['admin', 'manager', 'operator'], highlight: true },
    { id: 'vehicles', label: 'Pátio Ativo', icon: Car, roles: ['admin', 'manager', 'operator'] },
    { id: 'cash', label: 'Caixa', icon: Coins, roles: ['admin', 'manager', 'operator'] },
    { id: 'subscribers', label: 'Mensalistas', icon: Users, roles: ['admin', 'manager', 'operator'] },
    { id: 'admin', label: 'Configuração', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-rose-550/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 tracking-wider">Admin</span>;
      case 'manager':
        return <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-amber-550/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 tracking-wider">Gestor</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-emerald-550/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 tracking-wider">Operador</span>;
    }
  };

  return (
    <>
      {/* Premium Top Navigation Bar */}
      <header id="top-header" className="sticky top-0 z-40 bg-app-card border-b border-app-border shadow-xs backdrop-blur-md bg-opacity-95 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Brand Identity */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
                <div className="w-9 h-9 rounded-lg bg-[#1E4E44] flex items-center justify-center text-[#C5B08E] shadow-md shadow-indigo-600/10 border border-[#C5B08E]/20 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#C5B08E]" fill="none" stroke="currentColor" strokeWidth="4">
                    {/* Circular border */}
                    <circle cx="50" cy="50" r="44" strokeWidth="4" fill="none" />
                    {/* Pillars */}
                    <line x1="33" y1="52" x2="33" y2="73" strokeWidth="5.5" strokeLinecap="round" />
                    <line x1="67" y1="52" x2="67" y2="73" strokeWidth="5.5" strokeLinecap="round" />
                    {/* Inner arch */}
                    <path d="M 39 73 A 11 11 0 0 1 61 73" strokeWidth="4.5" strokeLinecap="round" />
                    {/* Lintel/horizontal beam */}
                    <line x1="26" y1="52" x2="74" y2="52" strokeWidth="6" strokeLinecap="round" />
                    <line x1="29" y1="47" x2="71" y2="47" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Top dome/arch cap */}
                    <path d="M 33 47 C 33 28, 67 28, 67 47" strokeWidth="4.5" fill="none" strokeLinecap="round" />
                    <path d="M 40 40 C 40 33, 60 33, 60 40" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-app-text flex items-center gap-2 theme-font-title">
                    {parkingName}
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">v4.2</span>
                  </h1>
                  <p className="text-[10px] text-app-subtle font-medium leading-none mt-0.5 uppercase tracking-wider">Unidade Centro</p>
                </div>
              </div>

              {/* Desktop Centered Horizontal Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {filteredNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                        isActive
                          ? item.highlight 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                          : item.highlight
                            ? 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20'
                            : 'text-app-muted hover:bg-app-bg hover:text-app-text'
                      }`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.id === 'entry' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Tools */}
            <div className="flex items-center gap-4">
              
              {/* Segmented Theme Switcher */}
              <div className="hidden sm:flex items-center bg-app-bg border border-app-border-sub rounded-lg p-0.5 shadow-inner gap-0.5">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-md cursor-pointer transition-all ${
                    theme === 'light'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                  title="Tema Claro"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('obsidian')}
                  className={`p-1.5 rounded-md cursor-pointer transition-all ${
                    theme === 'obsidian'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                  title="Tema Escuro"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme('cyber')}
                  className={`p-1.5 rounded-md cursor-pointer transition-all ${
                    theme === 'cyber'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                  title="Tema Terminal"
                >
                  <Terminal className="w-4 h-4" />
                </button>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  id="user-profile-button"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-app-bg hover:bg-app-border-sub border border-app-border text-xs font-semibold tracking-tight transition duration-150 cursor-pointer text-app-text"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <UserCircle className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                  <span className="max-w-[120px] truncate hidden sm:inline">{currentUser.name.toUpperCase()}</span>
                  {getRoleBadge(currentUser.role)}
                  <ChevronDown className="w-4 h-4 text-app-muted" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-45" onClick={() => setUserDropdownOpen(false)} />
                    <div 
                      id="user-profile-dropdown"
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-app-card border border-app-border shadow-xl text-app-text py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    >
                      <div className="px-4 py-3 border-b border-app-border bg-app-bg/30">
                        <p className="text-[10px] font-bold text-app-subtle uppercase tracking-widest flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-500" />
                          Funcionário logado
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-app-subtle mt-0.5 truncate">{currentUser.email}</p>
                          </div>
                          {getRoleBadge(currentUser.role)}
                        </div>
                      </div>
                      
                      <div className="border-t border-app-border mt-1 pt-1 bg-rose-500/5 dark:bg-rose-950/5">
                        <button
                          onClick={() => {
                            if (onLogout) onLogout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Fazer Logout (Sair)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Burger Menu Button */}
              <button 
                id="mobile-menu-toggle"
                className="md:hidden p-2 rounded-lg text-app-muted hover:text-app-text hover:bg-app-bg transition cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Menu Overlay) */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-app-card text-app-muted z-40 md:hidden flex flex-col justify-between py-4 shadow-2xl border-r border-app-border animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-1 px-3">
              <p className="text-[10px] font-bold text-app-subtle uppercase tracking-widest px-3 py-1.5 mb-1.5">Navegação</p>
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
                      isActive
                        ? item.highlight 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-app-bg text-indigo-600 dark:text-indigo-400 border-l-2 border-indigo-500'
                        : item.highlight
                          ? 'text-indigo-600 hover:bg-indigo-55/10'
                          : 'text-app-muted hover:bg-app-bg hover:text-app-text'
                    }`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t border-app-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">Gateway Ativo</span>
              </div>
              <p className="text-[10px] text-app-subtle font-medium leading-relaxed">Conexão de dados ativa. Operações registradas em tempo real.</p>
            </div>
          </aside>
        </>
      )}

      {/* Floating Glassmorphism Mobile Bottom Tab Bar */}
      <div id="mobile-bottom-tabs" className="md:hidden fixed bottom-4 left-4 right-4 h-14 bg-app-card/90 border border-app-border/45 backdrop-blur-md flex justify-around items-center px-2 z-40 text-app-muted shadow-2xl rounded-2xl transition-all duration-200">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`flex flex-col items-center justify-center w-12 py-1 transition duration-150 cursor-pointer ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' : 'hover:text-app-text'
              }`}
              onClick={() => setCurrentTab(item.id)}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-app-subtle'}`} />
              <span className="text-[9px] mt-1 font-bold uppercase tracking-tight truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
