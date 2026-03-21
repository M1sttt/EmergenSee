import { useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LoginDto, RegisterDto } from '@emergensee/shared';
import { authService } from 'services/authService';
import { useAuthStore } from 'store/authStore';
import { useGoogleGSI } from 'hooks/useGoogleGSI';
import { Button, FieldError, Input, Label } from '@/components/ui';
import { toast } from 'sonner';
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
	const redirectPath = location.state?.from?.pathname || consts.defaultNextRoute;

	const handleGoogleCredential = useCallback(
		async (credential: string) => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await authService.loginWithGoogleToken(credential);
				setAuth(response.user, response.accessToken, response.refreshToken);
				toast.success(strings.googleSignInSuccess);
				navigate(redirectPath, { replace: true });
			} catch (err: unknown) {
				setError(utils.extractErrorMessage(err, strings.googleSignInFailed));
				toast.error(strings.googleSignInFailed);
			} finally {
				setIsLoading(false);
			}
		},
		[navigate, redirectPath, setAuth],
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
			toast.success(strings.loginSuccess);
			navigate(redirectPath, { replace: true });
		} catch (err: unknown) {
			setError(utils.extractErrorMessage(err, strings.loginFailed));
			toast.error(strings.loginFailed);
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
			toast.success(strings.registrationSuccess);
			navigate(redirectPath, { replace: true });
		} catch (err: unknown) {
			setError(utils.extractErrorMessage(err, strings.registrationFailed));
			toast.error(strings.registrationFailed);
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
							<Label htmlFor="email">{strings.email}</Label>
							<Input
								{...loginForm.register('email', { required: strings.emailRequired })}
								type="email"
								id="email"
								autoComplete="email"
							/>
							{loginForm.formState.errors.email && (
								<FieldError className="text-xs">{loginForm.formState.errors.email.message}</FieldError>
							)}
						</div>

						<div>
							<Label htmlFor="password">{strings.password}</Label>
							<Input
								{...loginForm.register('password', { required: strings.passwordRequired })}
								type="password"
								id="password"
								autoComplete="current-password"
							/>
							{loginForm.formState.errors.password && (
								<FieldError className="text-xs">{loginForm.formState.errors.password.message}</FieldError>
							)}
						</div>

						<Button type="submit" disabled={isLoading} variant="primary" fullWidth>
							{isLoading ? strings.loggingIn : strings.logIn}
						</Button>

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
								<Label htmlFor="firstName">{strings.firstName}</Label>
								<Input
									{...registerForm.register('firstName', { required: strings.firstNameRequired })}
									type="text"
									id="firstName"
									autoComplete="given-name"
								/>
								{registerForm.formState.errors.firstName && (
									<FieldError className="text-xs">
										{registerForm.formState.errors.firstName.message}
									</FieldError>
								)}
							</div>

							<div>
								<Label htmlFor="lastName">{strings.lastName}</Label>
								<Input
									{...registerForm.register('lastName', { required: strings.lastNameRequired })}
									type="text"
									id="lastName"
									autoComplete="family-name"
								/>
								{registerForm.formState.errors.lastName && (
									<FieldError className="text-xs">
										{registerForm.formState.errors.lastName.message}
									</FieldError>
								)}
							</div>
						</div>

						<div>
							<Label htmlFor="reg-email">{strings.email}</Label>
							<Input
								{...registerForm.register('email', { required: strings.emailRequired })}
								type="email"
								id="reg-email"
								autoComplete="email"
							/>
							{registerForm.formState.errors.email && (
								<FieldError className="text-xs">{registerForm.formState.errors.email.message}</FieldError>
							)}
						</div>

						<div>
							<Label htmlFor="reg-password">
								{strings.password} <span className="text-gray-400 font-normal">{strings.min8Chars}</span>
							</Label>
							<Input
								{...registerForm.register('password', {
									required: strings.passwordRequired,
									minLength: { value: consts.minPasswordLength, message: strings.min8CharsMessage },
								})}
								type="password"
								id="reg-password"
								autoComplete="new-password"
							/>
							{registerForm.formState.errors.password && (
								<FieldError className="text-xs">{registerForm.formState.errors.password.message}</FieldError>
							)}
						</div>

						<div>
							<Label htmlFor="confirmPassword">{strings.confirmPassword}</Label>
							<Input
								{...registerForm.register('confirmPassword', {
									required: strings.passwordConfirmRequired,
									validate: val => val === registerForm.watch('password') || strings.passwordsDoNotMatch,
								})}
								type="password"
								id="confirmPassword"
								autoComplete="new-password"
							/>
							{registerForm.formState.errors.confirmPassword && (
								<FieldError className="text-xs">
									{registerForm.formState.errors.confirmPassword.message}
								</FieldError>
							)}
						</div>

						<Button type="submit" disabled={isLoading} variant="primary" fullWidth>
							{isLoading ? strings.creatingAccount : strings.createAccount}
						</Button>

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
