import React, { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from 'store/authStore';
import { usersService } from 'services/usersService';
import { Button, FieldError, Input, Label } from '@/components/ui';
import { FiUpload, FiTrash2, FiUser } from 'react-icons/fi';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

	const [faceImages, setFaceImages] = useState<string[]>(user?.faceImages ?? []);
	const [uploadingImage, setUploadingImage] = useState(false);
	const [imageError, setImageError] = useState('');
	const fileInputRef = useRef<HTMLInputElement>(null);

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
				setSuccess(strings.successMessage);
				reset({ firstName: updatedUser.firstName, lastName: updatedUser.lastName, password: '' });
			} catch (err: unknown) {
				const errorMessage = utils.formatUpdateError(err);
				setError(errorMessage || strings.defaultErrorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[user, updateUser, reset],
	);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file || !user?.id) return;

			if (faceImages.length >= 5) {
				setImageError('You can upload a maximum of 5 face images.');
				return;
			}

			setImageError('');
			setUploadingImage(true);
			try {
				const updatedUser = await usersService.uploadFaceImage(user.id, file);
				setFaceImages(updatedUser.faceImages ?? []);
				updateUser(updatedUser);
			} catch {
				setImageError('Failed to upload image. Please try again.');
			} finally {
				setUploadingImage(false);
				if (fileInputRef.current) fileInputRef.current.value = '';
			}
		},
		[user, faceImages.length, updateUser],
	);

	const handleDeleteImage = useCallback(
		async (filename: string) => {
			if (!user?.id) return;
			setImageError('');
			try {
				const updatedUser = await usersService.deleteFaceImage(user.id, filename);
				setFaceImages(updatedUser.faceImages ?? []);
				updateUser(updatedUser);
			} catch {
				setImageError('Failed to delete image. Please try again.');
			}
		},
		[user, updateUser],
	);

	const handleFormSubmit = handleSubmit(onSubmit);

	return (
		<div className="ui-page">
			<div className="mb-8">
				<h1 className="ui-page-title mb-6">{strings.profileTitle}</h1>
				<p className="mt-1 text-sm text-gray-500">{strings.profileDescription}</p>
			</div>

			<div className="ui-card overflow-hidden mb-6">
				<form onSubmit={handleFormSubmit} className="ui-card-body space-y-6">
					{error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
					{success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{success}</div>}

					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
						<div>
							<Label>{strings.firstNameLabel}</Label>
							<Input type="text" {...register('firstName', { required: strings.firstNameRequiredError })} />
							{errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
						</div>

						<div>
							<Label>{strings.lastNameLabel}</Label>
							<Input type="text" {...register('lastName', { required: strings.lastNameRequiredError })} />
							{errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
						</div>
					</div>

					<div>
						<Label>{strings.newPasswordLabel}</Label>
						<Input
							type="password"
							{...register('password', {
								minLength: { value: consts.passwordMinLength, message: strings.passwordMinLengthError },
							})}
							placeholder={strings.passwordPlaceholder}
						/>
						{errors.password && <FieldError>{errors.password.message}</FieldError>}
					</div>

					<div className="flex justify-end pt-4">
						<Button type="submit" disabled={isLoading} variant="primary" size="md">
							{isLoading ? strings.savingButtonText : strings.saveButtonText}
						</Button>
					</div>
				</form>
			</div>

			{/* Face Recognition Photos */}
			<div className="ui-card overflow-hidden">
				<div className="ui-card-body space-y-4">
					<div>
						<h2 className="text-base font-semibold text-gray-900">Face Recognition Photos</h2>
						<p className="mt-1 text-sm text-gray-500">
							Upload clear, front-facing photos of yourself for the AI face recognition service. Up to 5 images.
						</p>
					</div>

					{imageError && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{imageError}</div>}

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
						{faceImages.map(filename => (
							<div key={filename} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
								<img
									src={`${API_URL}/uploads/faces/${filename}`}
									alt="Face"
									className="h-full w-full object-cover"
								/>
								<button
									onClick={() => handleDeleteImage(filename)}
									className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
									title="Remove photo"
								>
									<FiTrash2 className="text-white" size={20} />
								</button>
							</div>
						))}

						{faceImages.length < 5 && (
							<button
								onClick={() => fileInputRef.current?.click()}
								disabled={uploadingImage}
								className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors disabled:opacity-50"
							>
								{uploadingImage ? (
									<span className="text-xs">Uploading…</span>
								) : (
									<>
										{faceImages.length === 0 ? (
											<FiUser size={24} />
										) : (
											<FiUpload size={24} />
										)}
										<span className="text-xs font-medium">Add photo</span>
									</>
								)}
							</button>
						)}
					</div>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={handleFileChange}
					/>

					<p className="text-xs text-gray-400">
						Accepted formats: JPEG, PNG, WebP · Max size: 5 MB per photo
					</p>
				</div>
			</div>
		</div>
	);
};

export default React.memo(ProfilePage);
