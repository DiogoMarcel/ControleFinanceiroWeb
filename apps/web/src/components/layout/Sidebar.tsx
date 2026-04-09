import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Wallet, CreditCard, BarChart2,
  Car, Building2, Briefcase, Settings, TrendingUp, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contas', icon: Receipt, label: 'Contas do Mês' },
  { to: '/portadores', icon: Wallet, label: 'Portadores' },
  { to: '/cartoes', icon: CreditCard, label: 'Cartões' },
  { to: '/relatorios', icon: BarChart2, label: 'Relatórios' },
  { to: '/veiculos', icon: Car, label: 'Veículos' },
  { to: '/alugueis', icon: Building2, label: 'Aluguéis' },
  { to: '/fgts', icon: Briefcase, label: 'FGTS' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700',
        !mobile && 'hidden lg:flex sticky top-0 h-screen',
        mobile && 'flex h-full',
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">
          Controle<br />Financeiro
        </span>
        {mobile && (
          <button
            onClick={onClose}
            className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200',
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
