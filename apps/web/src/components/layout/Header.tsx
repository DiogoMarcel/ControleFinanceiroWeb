import { Menu, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  async function handleLogout() {
    await signOut(auth);
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() ?? '?';

  return (
    <header className="h-14 bg-surface-raised border-b border-canvas-border flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-ink-muted hover:text-ink transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[13px] font-medium text-ink leading-none">
            {user?.displayName ?? user?.email}
          </span>
          <span className="text-[11px] text-ink-muted capitalize mt-0.5">
            {user?.role === 'admin' ? 'Administrador' : 'Visualizador'}
          </span>
        </div>

        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          {initials}
        </div>

        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="text-ink-subtle hover:text-ledger-danger transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
