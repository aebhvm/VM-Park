import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const INSTALL_PROMPT_SEEN_KEY = 'parkgestor-install-prompt-seen';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.location.pathname.startsWith('/ticket/') || isStandaloneMode()) return;
    if (localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === '1') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
    setVisible(false);
    setInstallEvent(null);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
    setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || !installEvent) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-md rounded-2xl border border-indigo-500/30 bg-app-card p-3 shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[380px]">
      <div className="flex items-start gap-3">
        <img src="/vm-park-logo.png" alt="VM Park" className="h-12 w-20 rounded-lg border border-app-border bg-app-bg object-contain p-1" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold uppercase tracking-wide text-app-text">Instale o VM Parking</p>
          <p className="mt-1 text-[11px] leading-relaxed text-app-muted">Tenha acesso rápido ao sistema pelo ícone do app.</p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => void install()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-[10px] font-bold uppercase text-white transition hover:bg-indigo-600">
              <Download className="h-3.5 w-3.5" /> Instalar app
            </button>
            <button type="button" onClick={dismiss} className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase text-app-muted hover:bg-app-bg hover:text-app-text">
              Agora não
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Fechar convite de instalação" className="rounded p-1 text-app-muted hover:bg-app-bg hover:text-app-text">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
