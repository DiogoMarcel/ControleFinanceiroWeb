import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/contas', icon: Receipt, label: 'Contas' },
  { to: '/portadores', icon: Wallet, label: 'Portadores' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Config.' },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface-raised border-t border-canvas-border lg:hidden"
      data-bottomnav
    >
      <ul className="flex">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-medium transition-colors',
                  isActive
                    ? 'text-accent'
                    : 'text-ink-subtle hover:text-ink',
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
