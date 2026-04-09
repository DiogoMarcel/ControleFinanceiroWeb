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
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1" />

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-slate-900 dark:text-white leading-none">
            {user?.displayName ?? user?.email}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
            {user?.role === 'admin' ? 'Administrador' : 'Visualizador'}
          </span>
        </div>

        <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>

        <button
          onClick={handleLogout}
          title="Sair"
          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
