import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

function firebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'E-mail ou senha inválidos.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  };
  return messages[code] ?? 'Ocorreu um erro. Tente novamente.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setAuthError(firebaseErrorMessage(code));
    }
  }

  async function handleForgotPassword() {
    const email = getValues('email');
    if (!email) {
      setAuthError('Digite seu e-mail antes de solicitar a redefinição.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setAuthError('');
    } catch {
      setAuthError('Não foi possível enviar o e-mail de redefinição.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Controle Financeiro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Familiar</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              id="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />

            {authError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {authError}
              </p>
            )}

            {resetSent && (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                E-mail de redefinição enviado. Verifique sua caixa de entrada.
              </p>
            )}

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-1">
              Entrar
            </Button>
          </form>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}
