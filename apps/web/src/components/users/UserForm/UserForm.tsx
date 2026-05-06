import React, { useMemo, useCallback, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { User, UserRole } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { FiCheck, FiCopy, FiSave, FiX } from 'react-icons/fi';
import { FaCamera } from 'react-icons/fa';
import SelectDropdown from '@/components/SelectDropdown';
import { getEntityId } from '@/types/entities';
import {
	useUserFormCreateMutation,
	useUserFormDepartmentsQuery,
	useUserFormUpdateMutation,
} from 'hooks/data/useUserFormData';
import { Button, FieldError, Input, Label } from '@/components/ui';

import * as strings from './strings';
import * as utils from './utils';

interface UserFormProps {
	user?: User | null;
	onClose: () => void;
}

function CameraCodeSuccess({ code, onDone }: { code: string; onDone: () => void }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(code).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div className="flex flex-col items-center gap-5 py-4 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
				<FiCheck className="text-3xl text-green-600" />
			</div>
			<div>
				<h3 className="text-lg font-bold text-gray-900">Camera Station Created</h3>
				<p className="mt-1 text-sm text-gray-500">Share this code with the device to log in.</p>
			</div>

			<div className="w-full rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-5">
				<p className="text-xs font-medium uppercase tracking-wider text-blue-500">Camera Code</p>
				<p className="mt-2 text-3xl font-bold tracking-[0.2em] text-blue-700">{code}</p>
			</div>

			<button
				onClick={handleCopy}
				className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
			>
				{copied ? <FiCheck className="text-green-600" /> : <FiCopy />}
				{copied ? 'Copied!' : 'Copy to clipboard'}
			</button>

			<Button onClick={onDone} variant="primary" size="md" fullWidth>
				Done
			</Button>
		</div>
	);
}

function UserForm({ user, onClose }: UserFormProps) {
	const currentUser = useAuthStore(state => state.user);
	const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
	const [createdCameraCode, setCreatedCameraCode] = useState<string | null>(null);

	const { data: allDepartmentsResponse = [], isLoading, isError } = useUserFormDepartmentsQuery();

	const managedDepartments = useMemo(() => {
		return utils.getManagedDepartments(allDepartmentsResponse, currentUser);
	}, [allDepartmentsResponse, currentUser]);

	const defaultValues = useMemo<Partial<utils.UserFormData>>(() => {
		if (user) {
			return {
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				phoneNumber: user.phoneNumber,
				departments: user.departments || [],
				location: user.location,
			};
		}
		return {
			role: isGlobalAdmin ? undefined : UserRole.MEMBER,
			departments: [],
		};
	}, [user, isGlobalAdmin]);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<utils.UserFormData>({
		defaultValues,
	});

	const watchedRole = useWatch({ control, name: 'role' });
	const isCameraRole = watchedRole === UserRole.CAMERA;

	const roleOptions = useMemo(() => Object.values(UserRole).map(role => ({ value: role, label: role })), []);

	const departmentOptions = useMemo(
		() =>
			managedDepartments.map(dept => ({
				value: getEntityId(dept),
				label: dept.name,
			})),
		[managedDepartments],
	);

	const invalidateAndClose = useCallback(() => {
		onClose();
	}, [onClose]);

	const handleCreateSuccess = useCallback((createdUser: User) => {
		if (createdUser.cameraCode) {
			setCreatedCameraCode(createdUser.cameraCode);
		} else {
			onClose();
		}
	}, [onClose]);

	const createMutation = useUserFormCreateMutation(handleCreateSuccess);
	const updateMutation = useUserFormUpdateMutation(invalidateAndClose);

	const onSubmit = useCallback(
		(data: utils.UserFormData) => {
			if (user) {
				const updateData = utils.prepareUpdateUserData(data, user, managedDepartments, isGlobalAdmin);
				updateMutation.mutate({ id: getEntityId(user), data: updateData });
			} else {
				const createData = utils.prepareCreateUserData(data, managedDepartments, isGlobalAdmin);
				createMutation.mutate(createData);
			}
		},
		[user, managedDepartments, isGlobalAdmin, createMutation, updateMutation],
	);

	return (
		<div className="ui-modal-root">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" onClick={onClose} />
				<div className="ui-modal-panel ui-modal-panel-2xl z-10 p-6">
					<h2 className="mb-6 text-2xl font-bold text-gray-900">
						{user ? strings.titleEdit : strings.titleCreate}
					</h2>

					{createdCameraCode ? (
						<CameraCodeSuccess code={createdCameraCode} onDone={onClose} />
					) : isLoading ? (
						<p>{strings.loading}</p>
					) : isError ? (
						<p className="ui-field-error">{strings.error}</p>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="ui-form-spacing">
							{isGlobalAdmin && (
								<div>
									<Label>{strings.role}</Label>
									<Controller
										name="role"
										control={control}
										rules={{ required: strings.roleReq }}
										render={({ field }) => (
											<SelectDropdown
												{...field}
												options={roleOptions}
												placeholder={strings.selectRole}
												error={errors.role?.message as string | undefined}
											/>
										)}
									/>
								</div>
							)}

							{/* Camera role — simplified form */}
							{isCameraRole && !user && (
								<div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
									<FaCamera />
									<span>A unique camera code will be generated automatically.</span>
								</div>
							)}

							{/* Standard identity fields — hidden for new CAMERA users */}
							{!(isCameraRole && !user) && (
								<div className="ui-form-grid-2">
									<div>
										<Label>{strings.firstName}</Label>
										<Input {...register('firstName', { required: !isCameraRole && strings.firstNameReq })} type="text" />
										<FieldError>{errors.firstName?.message as string | undefined}</FieldError>
									</div>
									<div>
										<Label>{strings.lastName}</Label>
										<Input {...register('lastName', { required: !isCameraRole && strings.lastNameReq })} type="text" />
										<FieldError>{errors.lastName?.message as string | undefined}</FieldError>
									</div>
								</div>
							)}

							{!(isCameraRole && !user) && (
								<div>
									<Label>{strings.email}</Label>
									<Input {...register('email', { required: !isCameraRole && strings.emailReq })} type="email" />
									<FieldError>{errors.email?.message as string | undefined}</FieldError>
								</div>
							)}

							{!user && (
								<div>
									<Label>{strings.password}</Label>
									<Input {...register('password', { required: strings.passwordReq })} type="password" />
									<FieldError>{errors.password?.message as string | undefined}</FieldError>
								</div>
							)}

							<div className="ui-form-grid-1">
								{!(isCameraRole && !user) && (
									<div>
										<Label>{strings.phoneNumber}</Label>
										<Input {...register('phoneNumber')} type="tel" />
									</div>
								)}

								{watchedRole === UserRole.CAMERA && (
									<div>
										<Label>{strings.location}</Label>
										<Input {...register('location')} type="text" placeholder={strings.locationPlaceholder} />
									</div>
								)}

								<div>
									<Label>{strings.departments}</Label>
									<Controller
										name="departments"
										control={control}
										render={({ field }) => (
											<SelectDropdown
												{...field}
												isMulti
												options={departmentOptions}
												placeholder={strings.departments}
												closeMenuOnSelect={false}
											/>
										)}
									/>
								</div>
							</div>

							<div className="ui-form-actions">
								<Button type="button" onClick={onClose} variant="secondary" size="md">
									<FiX /> {strings.btnCancel}
								</Button>
								<Button type="submit" variant="primary" size="md">
									<FiSave /> {user ? strings.btnUpdate : strings.btnCreate}
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

export default React.memo(UserForm);
