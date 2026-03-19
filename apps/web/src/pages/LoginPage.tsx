import { useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoginDto, RegisterDto } from '@emergensee/shared';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useGoogleGSI } from '../hooks/useGoogleGSI';

type Mode = 'login' | 'register';

// ─── Shared field classes ─────────────────────────────────────────────────────
const inputCls =
  'mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm';
const errorCls = 'mt-1 text-xs text-red-600';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── GSI button container ─────────────────────────────────────────────────────
  const gsiContainerRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.loginWithGoogleToken(credential);
        setAuth(response.user, response.accessToken, response.refreshToken);
        const destination = location.state?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, setAuth],
  );

  // Loads the GSI script and renders the official button into gsiContainerRef
  useGoogleGSI(gsiContainerRef, handleGoogleCredential);

  // ── Login form ──────────────────────────────────────────────────────────────
  const savedCredsStr = localStorage.getItem('last_login_creds');
  const savedCreds = savedCredsStr ? JSON.parse(savedCredsStr) : { email: '', password: '' };
  
  const loginForm = useForm<LoginDto>({ 
    defaultValues: { 
      email: savedCreds.email, 
      password: savedCreds.password 
    } 
  });

  const onLogin = async (data: LoginDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      localStorage.setItem('last_login_creds', JSON.stringify({ email: data.email, password: data.password }));
      setAuth(response.user, response.accessToken, response.refreshToken);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register form ───────────────────────────────────────────────────────────
  const registerForm = useForm<RegisterDto>();

  const onRegister = async (data: RegisterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      localStorage.setItem('last_login_creds', JSON.stringify({ email: data.email, password: data.password }));
      setAuth(response.user, response.accessToken, response.refreshToken);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setError(null);
    loginForm.reset();
    registerForm.reset();
    setMode(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">EmergenSee</h1>
          <p className="text-gray-600 mt-1">Emergency Response System</p>
        </div>


        {/* Error banner */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        {/* ── Official GSI button (rendered by the hook) ────────────────────────── */}
        <div className="flex justify-center mb-4">
          {/* GSI injects a button element inside this div */}
          <div ref={gsiContainerRef} className="w-full" />
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-400">or use email</span>
          </div>
        </div>

        {/* ── LOGIN form ──────────────────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...loginForm.register('email', { required: 'Email is required' })}
                type="email"
                id="email"
                className={inputCls}
                autoComplete="email"
              />
              {loginForm.formState.errors.email && (
                <p className={errorCls}>{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...loginForm.register('password', { required: 'Password is required' })}
                type="password"
                id="password"
                className={inputCls}
                autoComplete="current-password"
              />
              {loginForm.formState.errors.password && (
                <p className={errorCls}>{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in…' : 'Log in'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-blue-600 hover:underline font-medium"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER form ────────────────────────────────────────────────────── */}
        {mode === 'register' && (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  {...registerForm.register('firstName', { required: 'Required' })}
                  type="text"
                  id="firstName"
                  className={inputCls}
                  autoComplete="given-name"
                />
                {registerForm.formState.errors.firstName && (
                  <p className={errorCls}>{registerForm.formState.errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  {...registerForm.register('lastName', { required: 'Required' })}
                  type="text"
                  id="lastName"
                  className={inputCls}
                  autoComplete="family-name"
                />
                {registerForm.formState.errors.lastName && (
                  <p className={errorCls}>{registerForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...registerForm.register('email', { required: 'Email is required' })}
                type="email"
                id="reg-email"
                className={inputCls}
                autoComplete="email"
              />
              {registerForm.formState.errors.email && (
                <p className={errorCls}>{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                Password{' '}
                <span className="text-gray-400 font-normal">(min. 8 characters)</span>
              </label>
              <input
                {...registerForm.register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                })}
                type="password"
                id="reg-password"
                className={inputCls}
                autoComplete="new-password"
              />
              {registerForm.formState.errors.password && (
                <p className={errorCls}>{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                {...registerForm.register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) =>
                    val === registerForm.watch('password') || 'Passwords do not match',
                })}
                type="password"
                id="confirmPassword"
                className={inputCls}
                autoComplete="new-password"
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className={errorCls}>
                  {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
