import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Wallet, CreditCard, BarChart2,
  Car, Building2, Briefcase, Settings, FileText, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contas', icon: Receipt, label: 'Contas do Mês' },
  { to: '/extrato', icon: FileText, label: 'Extrato' },
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
        'flex flex-col w-64 flex-shrink-0 bg-surface-raised border-r border-canvas-border',
        !mobile && 'hidden lg:flex sticky top-0 h-screen',
        mobile && 'flex h-full',
      )}
    >
      {/* Logo */}
      <div className="flex items-center px-5 h-14 border-b border-canvas-border">
        <div className="flex flex-col leading-none">
          <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-accent">
            Controle
          </span>
          <span className="text-[15px] font-semibold text-ink mt-0.5 tracking-tight">
            Financeiro
          </span>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="ml-auto text-ink-subtle hover:text-ink transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-ink-muted hover:text-ink hover:bg-surface',
                  )
                }
              >
                <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
