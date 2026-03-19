import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from 'store/authStore';
import { usersService } from 'services/usersService';
import {
	PROFILE_TITLE,
	PROFILE_DESCRIPTION,
	FIRST_NAME_LABEL,
	LAST_NAME_LABEL,
	NEW_PASSWORD_LABEL,
	PASSWORD_PLACEHOLDER,
	SAVE_BUTTON_TEXT,
	SAVING_BUTTON_TEXT,
	SUCCESS_MESSAGE,
	DEFAULT_ERROR_MESSAGE,
	ERRORS,
} from './strings';
import { CLASSES, PASSWORD_MIN_LENGTH } from './consts';
import { formatUpdateError } from './utils';

type ProfileFormData = {
	firstName: string;
	lastName: string;
	password?: string;
};

const ProfilePage = () => {
	const user = useAuthStore(state => state.user);
	const updateUser = useAuthStore(state => state.updateUser);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ProfileFormData>({
		defaultValues: {
			firstName: user?.firstName || '',
			lastName: user?.lastName || '',
			password: '',
		},
	});

	const onSubmit = useCallback(
		async (data: ProfileFormData) => {
			if (!user?.id) return;
			try {
				setError('');
				setSuccess('');
				setIsLoading(true);

				const updatePayload: Record<string, string> = {
					firstName: data.firstName,
					lastName: data.lastName,
				};

				if (data.password) {
					updatePayload.password = data.password;
				}

				const updatedUser = await usersService.update(user.id, updatePayload);
				updateUser(updatedUser);
				setSuccess(SUCCESS_MESSAGE);
				reset({ firstName: updatedUser.firstName, lastName: updatedUser.lastName, password: '' });
			} catch (err: unknown) {
				const errorMessage = formatUpdateError(err);
				setError(errorMessage || DEFAULT_ERROR_MESSAGE);
			} finally {
				setIsLoading(false);
			}
		},
		[user, updateUser, reset],
	);

	const handleFormSubmit = handleSubmit(onSubmit);

	return (
		<div className={CLASSES.container}>
			<div className={CLASSES.headerContainer}>
				<h1 className={CLASSES.title}>{PROFILE_TITLE}</h1>
				<p className={CLASSES.description}>{PROFILE_DESCRIPTION}</p>
			</div>

			<div className={CLASSES.formContainer}>
				<form onSubmit={handleFormSubmit} className={CLASSES.form}>
					{error && <div className={CLASSES.errorBox}>{error}</div>}

					{success && <div className={CLASSES.successBox}>{success}</div>}

					<div className={CLASSES.grid}>
						<div>
							<label className={CLASSES.label}>{FIRST_NAME_LABEL}</label>
							<input
								type="text"
								{...register('firstName', { required: ERRORS.FIRST_NAME_REQUIRED })}
								className={CLASSES.input}
							/>
							{errors.firstName && <p className={CLASSES.errorMessage}>{errors.firstName.message}</p>}
						</div>

						<div>
							<label className={CLASSES.label}>{LAST_NAME_LABEL}</label>
							<input
								type="text"
								{...register('lastName', { required: ERRORS.LAST_NAME_REQUIRED })}
								className={CLASSES.input}
							/>
							{errors.lastName && <p className={CLASSES.errorMessage}>{errors.lastName.message}</p>}
						</div>
					</div>

					<div>
						<label className={CLASSES.label}>{NEW_PASSWORD_LABEL}</label>
						<input
							type="password"
							{...register('password', {
								minLength: { value: PASSWORD_MIN_LENGTH, message: ERRORS.PASSWORD_MIN_LENGTH },
							})}
							className={CLASSES.input}
							placeholder={PASSWORD_PLACEHOLDER}
						/>
						{errors.password && <p className={CLASSES.errorMessage}>{errors.password.message}</p>}
					</div>

					<div className={CLASSES.buttonContainer}>
						<button type="submit" disabled={isLoading} className={CLASSES.button}>
							{isLoading ? SAVING_BUTTON_TEXT : SAVE_BUTTON_TEXT}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default React.memo(ProfilePage);
