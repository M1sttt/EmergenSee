import { useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoginDto, RegisterDto } from '@emergensee/shared';
import { authService } from 'services/authService';
import { useAuthStore } from 'store/authStore';
import { useGoogleGSI } from 'hooks/useGoogleGSI';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

type Mode = 'login' | 'register';

export default function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const setAuth = useAuthStore(state => state.setAuth);

	const [mode, setMode] = useState<Mode>('login');
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const gsiContainerRef = useRef<HTMLDivElement>(null);

	const handleGoogleCredential = useCallback(
		async (credential: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await authService.loginWithGoogleToken(credential);
				setAuth(response.user, response.accessToken, response.refreshToken);
				const destination = location.state?.from?.pathname || consts.defaultNextRoute;
				navigate(destination, { replace: true });
			} catch (err: any) {
				setError(err.response?.data?.message || strings.googleSignInFailed);
			} finally {
				setIsLoading(false);
			}
		},
		[navigate, setAuth],
	);

	useGoogleGSI(gsiContainerRef, handleGoogleCredential);

	const savedCreds = utils.getSavedCredentials();

	const loginForm = useForm<LoginDto>({
		defaultValues: {
			email: savedCreds.email,
			password: savedCreds.password,
		},
	});

	const onLogin = async (data: LoginDto) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authService.login(data);
			utils.saveCredentials(data.email, data.password);
			setAuth(response.user, response.accessToken, response.refreshToken);
			const destination = location.state?.from?.pathname || consts.defaultNextRoute;
			navigate(destination, { replace: true });
		} catch (err: any) {
			setError(utils.extractErrorMessage(err, strings.loginFailed));
		} finally {
			setIsLoading(false);
		}
	};

	const registerForm = useForm<RegisterDto>();

	const onRegister = async (data: RegisterDto) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authService.register(data);
			utils.saveCredentials(data.email, data.password);
			setAuth(response.user, response.accessToken, response.refreshToken);
			const destination = location.state?.from?.pathname || consts.defaultNextRoute;
			navigate(destination, { replace: true });
		} catch (err: any) {
			setError(utils.extractErrorMessage(err, strings.registrationFailed));
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
				<div className="text-center mb-6">
					<h1 className="text-3xl font-bold text-gray-900">{strings.title}</h1>
					<p className="text-gray-600 mt-1">{strings.subtitle}</p>
				</div>

				{error && (
					<div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
						{error}
					</div>
				)}

				<div className="flex justify-center mb-4">
					<div ref={gsiContainerRef} className="w-full" />
				</div>

				<div className="relative mb-4">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-200" />
					</div>
					<div className="relative flex justify-center text-xs">
						<span className="px-2 bg-white text-gray-400">{strings.orEmail}</span>
					</div>
				</div>

				{mode === 'login' && (
					<form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700">
								{strings.email}
							</label>
							<input
								{...loginForm.register('email', { required: strings.emailRequired })}
								type="email"
								id="email"
								className={consts.inputCls}
								autoComplete="email"
							/>
							{loginForm.formState.errors.email && (
								<p className={consts.errorCls}>{loginForm.formState.errors.email.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700">
								{strings.password}
							</label>
							<input
								{...loginForm.register('password', { required: strings.passwordRequired })}
								type="password"
								id="password"
								className={consts.inputCls}
								autoComplete="current-password"
							/>
							{loginForm.formState.errors.password && (
								<p className={consts.errorCls}>{loginForm.formState.errors.password.message}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						>
							{isLoading ? strings.loggingIn : strings.logIn}
						</button>

						<p className="text-center text-sm text-gray-500">
							{strings.dontHaveAccount}
							<button
								type="button"
								onClick={() => switchMode('register')}
								className="text-blue-600 hover:underline font-medium"
							>
								{strings.registerBtn}
							</button>
						</p>
					</form>
				)}

				{mode === 'register' && (
					<form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
									{strings.firstName}
								</label>
								<input
									{...registerForm.register('firstName', { required: strings.firstNameRequired })}
									type="text"
									id="firstName"
									className={consts.inputCls}
									autoComplete="given-name"
								/>
								{registerForm.formState.errors.firstName && (
									<p className={consts.errorCls}>{registerForm.formState.errors.firstName.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
									{strings.lastName}
								</label>
								<input
									{...registerForm.register('lastName', { required: strings.lastNameRequired })}
									type="text"
									id="lastName"
									className={consts.inputCls}
									autoComplete="family-name"
								/>
								{registerForm.formState.errors.lastName && (
									<p className={consts.errorCls}>{registerForm.formState.errors.lastName.message}</p>
								)}
							</div>
						</div>

						<div>
							<label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
								{strings.email}
							</label>
							<input
								{...registerForm.register('email', { required: strings.emailRequired })}
								type="email"
								id="reg-email"
								className={consts.inputCls}
								autoComplete="email"
							/>
							{registerForm.formState.errors.email && (
								<p className={consts.errorCls}>{registerForm.formState.errors.email.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
								{strings.password} <span className="text-gray-400 font-normal">{strings.min8Chars}</span>
							</label>
							<input
								{...registerForm.register('password', {
									required: strings.passwordRequired,
									minLength: { value: consts.minPasswordLength, message: strings.min8CharsMessage },
								})}
								type="password"
								id="reg-password"
								className={consts.inputCls}
								autoComplete="new-password"
							/>
							{registerForm.formState.errors.password && (
								<p className={consts.errorCls}>{registerForm.formState.errors.password.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
								{strings.confirmPassword}
							</label>
							<input
								{...registerForm.register('confirmPassword', {
									required: strings.passwordConfirmRequired,
									validate: val => val === registerForm.watch('password') || strings.passwordsDoNotMatch,
								})}
								type="password"
								id="confirmPassword"
								className={consts.inputCls}
								autoComplete="new-password"
							/>
							{registerForm.formState.errors.confirmPassword && (
								<p className={consts.errorCls}>{registerForm.formState.errors.confirmPassword.message}</p>
							)}
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
						>
							{isLoading ? strings.creatingAccount : strings.createAccount}
						</button>

						<p className="text-center text-sm text-gray-500">
							{strings.alreadyHaveAccount}
							<button
								type="button"
								onClick={() => switchMode('login')}
								className="text-blue-600 hover:underline font-medium"
							>
								{strings.logIn}
							</button>
						</p>
					</form>
				)}
			</div>
		</div>
	);
}
