// Shared TypeScript types

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}

export type TipoContaPortador = 'C' | 'D' | 'I' | 'P';
export type TipoContaFinanceira = 'P' | 'R';
export type TipoSaldoExtrato = '=' | 'P' | 'R';
