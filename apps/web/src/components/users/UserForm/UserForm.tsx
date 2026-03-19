import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { User, UpdateUserDto, UserRole, CreateUserDto } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import { FiSave, FiX } from 'react-icons/fi';
import {
	useUserFormCreateMutation,
	useUserFormDepartmentsQuery,
	useUserFormUpdateMutation,
} from 'hooks/data/useUserFormData';

import { STRINGS } from './strings';
import { CONSTANTS } from './consts';
import { getManagedDepartments, prepareUserData } from './utils';

interface UserFormProps {
	user?: User | null;
	onClose: () => void;
}

type UserFormData = CreateUserDto & UpdateUserDto;

function UserForm({ user, onClose }: UserFormProps) {
	const currentUser = useAuthStore(state => state.user);
	const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;

	const {
		data: allDepartmentsResponse = [],
		isLoading,
		isError,
	} = useUserFormDepartmentsQuery();

	const managedDepartments = useMemo(() => {
		return getManagedDepartments(
			Array.isArray(allDepartmentsResponse)
				? allDepartmentsResponse
				: (allDepartmentsResponse as any).data || [],
			currentUser,
		);
	}, [allDepartmentsResponse, currentUser]);

	const defaultValues = useMemo(() => {
		if (user) {
			return {
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				phoneNumber: user.phoneNumber,
				departments: user.departments || [],
			};
		}
		return {
			role: isGlobalAdmin ? undefined : UserRole.MEMBER,
			departments: [],
		};
	}, [user, isGlobalAdmin]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<UserFormData>({
		defaultValues: defaultValues as any,
	});

	const invalidateAndClose = useCallback(() => {
		onClose();
	}, [onClose]);

	const createMutation = useUserFormCreateMutation(invalidateAndClose);

	const updateMutation = useUserFormUpdateMutation(invalidateAndClose);

	const onSubmit = useCallback(
		(data: UserFormData) => {
			const preparedData = prepareUserData(data, user, managedDepartments, isGlobalAdmin);

			if (user) {
				const updateData: UpdateUserDto = { ...preparedData };
				delete (updateData as any).password;
				updateMutation.mutate({ id: user.id || (user as any)._id, data: updateData });
			} else {
				createMutation.mutate(preparedData as CreateUserDto);
			}
		},
		[user, managedDepartments, isGlobalAdmin, createMutation, updateMutation],
	);

	return (
		<div className={CONSTANTS.CLASSES.OVERLAY}>
			<div className={CONSTANTS.CLASSES.MODAL}>
				<h2 className={CONSTANTS.CLASSES.TITLE}>{user ? STRINGS.TITLE_EDIT : STRINGS.TITLE_CREATE}</h2>

				{isLoading ? (
					<p>{STRINGS.LOADING}</p>
				) : isError ? (
					<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{STRINGS.ERROR}</p>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className={CONSTANTS.CLASSES.SPACE_Y_4}>
						<div className={CONSTANTS.CLASSES.GRID_2_COLS}>
							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.FIRST_NAME}</label>
								<input
									{...register('firstName', { required: STRINGS.FIRST_NAME_REQ })}
									type="text"
									className={CONSTANTS.CLASSES.INPUT}
								/>
								{errors.firstName && (
									<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{errors.firstName.message as string}</p>
								)}
							</div>

							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.LAST_NAME}</label>
								<input
									{...register('lastName', { required: STRINGS.LAST_NAME_REQ })}
									type="text"
									className={CONSTANTS.CLASSES.INPUT}
								/>
								{errors.lastName && (
									<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{errors.lastName.message as string}</p>
								)}
							</div>
						</div>

						<div>
							<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.EMAIL}</label>
							<input
								{...register('email', { required: STRINGS.EMAIL_REQ })}
								type="email"
								className={CONSTANTS.CLASSES.INPUT}
							/>
							{errors.email && (
								<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{errors.email.message as string}</p>
							)}
						</div>

						{!user && (
							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.PASSWORD}</label>
								<input
									{...register('password', { required: STRINGS.PASSWORD_REQ })}
									type="password"
									className={CONSTANTS.CLASSES.INPUT}
								/>
								{errors.password && (
									<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{errors.password.message as string}</p>
								)}
							</div>
						)}

						{isGlobalAdmin && (
							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.ROLE}</label>
								<select
									{...register('role', { required: STRINGS.ROLE_REQ })}
									className={CONSTANTS.CLASSES.INPUT}
								>
									<option value="">{STRINGS.SELECT_ROLE}</option>
									{Object.values(UserRole).map(role => (
										<option key={role} value={role}>
											{role}
										</option>
									))}
								</select>
								{errors.role && (
									<p className={CONSTANTS.CLASSES.ERROR_TEXT}>{errors.role.message as string}</p>
								)}
							</div>
						)}

						<div className={CONSTANTS.CLASSES.GRID_1_COL}>
							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.PHONE_NUMBER}</label>
								<input {...register('phoneNumber')} type="tel" className={CONSTANTS.CLASSES.INPUT} />
							</div>

							<div>
								<label className={CONSTANTS.CLASSES.LABEL}>{STRINGS.DEPARTMENTS}</label>
								<select multiple {...register('departments')} className={CONSTANTS.CLASSES.SELECT_DEPTS}>
									{managedDepartments.map(dept => (
										<option key={dept.id || (dept as any)._id} value={dept.id || (dept as any)._id}>
											{dept.name}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className={CONSTANTS.CLASSES.ACTIONS_WRAPPER}>
							<button type="button" onClick={onClose} className={CONSTANTS.CLASSES.CANCEL_BTN}>
								<FiX /> {STRINGS.BTN_CANCEL}
							</button>
							<button type="submit" className={CONSTANTS.CLASSES.SUBMIT_BTN}>
								<FiSave /> {user ? STRINGS.BTN_UPDATE : STRINGS.BTN_CREATE}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}

export default React.memo(UserForm);
