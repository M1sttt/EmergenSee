import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { Department, createDepartmentSchema, updateDepartmentSchema } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import {
	useDepartmentFormDepartmentsQuery,
	useDepartmentFormSaveMutation,
} from 'hooks/data/useDepartmentFormData';

import { STRINGS } from './strings';
import { CONSTS } from './consts';
import { getAvailableSubDepartments } from './utils';

interface DepartmentFormProps {
	department: Department | null;
	onClose: () => void;
}

type DepartmentFormData = {
	name: string;
	description: string;
	admins: string[];
	subDepartments: string[];
};

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onClose }) => {
	const [error, setError] = useState('');
	const currentUser = useAuthStore(state => state.user);

	const {
		data: allDepartmentsResponse = [],
		isLoading,
		isError,
	} = useDepartmentFormDepartmentsQuery();

	const allDepartments = useMemo(() => {
		return allDepartmentsResponse || [];
	}, [allDepartmentsResponse]);

	const availableSubDepartments = useMemo(
		() => getAvailableSubDepartments(allDepartments, department),
		[allDepartments, department],
	);

	const schema = useMemo(() => (department ? updateDepartmentSchema : createDepartmentSchema), [department]);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<any>({
		resolver: zodResolver(schema),
		defaultValues: department || {
			name: '',
			description: '',
			admins: currentUser ? [currentUser.id] : [],
			subDepartments: [],
		},
	});

	useEffect(() => {
		if (department) {
			reset(department);
		}
	}, [department, reset]);

	const mutation = useDepartmentFormSaveMutation({
		department,
		currentUserId: currentUser?.id,
		onSuccess: onClose,
		onError: message => {
			setError(message || STRINGS.DEFAULT_ERROR);
		},
	});

	const onSubmit = useCallback(
		(data: DepartmentFormData) => {
			mutation.mutate(data);
		},
		[mutation],
	);

	if (isLoading) {
		return (
			<div className={CONSTS.UI_CLASSES.MODAL_CONTAINER}>
				<div className={CONSTS.UI_CLASSES.MODAL_WRAPPER}>
					<div className={CONSTS.UI_CLASSES.OVERLAY} />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10">
						Loading...
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className={CONSTS.UI_CLASSES.MODAL_CONTAINER}>
				<div className={CONSTS.UI_CLASSES.MODAL_WRAPPER}>
					<div className={CONSTS.UI_CLASSES.OVERLAY} />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10 text-red-600 flex items-center gap-2">
						<FiAlertCircle /> Failed to load departments
						<button onClick={onClose} className={CONSTS.UI_CLASSES.CANCEL_BUTTON}>
							{STRINGS.CANCEL}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={CONSTS.UI_CLASSES.MODAL_CONTAINER}>
			<div className={CONSTS.UI_CLASSES.MODAL_WRAPPER}>
				<div className={CONSTS.UI_CLASSES.OVERLAY} onClick={onClose} />

				<div className={CONSTS.UI_CLASSES.MODAL_CONTENT}>
					<div className={CONSTS.UI_CLASSES.MODAL_BODY}>
						<div className="sm:flex sm:items-start">
							<div className={CONSTS.UI_CLASSES.FORM_CONTAINER}>
								<h3 className={CONSTS.UI_CLASSES.HEADING}>
									{department ? STRINGS.EDIT_DEPARTMENT : STRINGS.CREATE_DEPARTMENT}
								</h3>

								<form onSubmit={handleSubmit(onSubmit)} className={CONSTS.UI_CLASSES.FORM_LAYOUT}>
									{error && (
										<div className={CONSTS.UI_CLASSES.ERROR_BOX}>
											<div className="flex items-center gap-2">
												<FiAlertCircle />
												<span>{error}</span>
											</div>
										</div>
									)}

									<div>
										<label className={CONSTS.UI_CLASSES.LABEL}>{STRINGS.NAME_LABEL}</label>
										<input type="text" {...register('name')} className={CONSTS.UI_CLASSES.INPUT_BASE} />
										{errors.name && (
											<p className={CONSTS.UI_CLASSES.ERROR_TEXT}>{errors.name.message as string}</p>
										)}
									</div>

									<div>
										<label className={CONSTS.UI_CLASSES.LABEL}>{STRINGS.DESCRIPTION_LABEL}</label>
										<textarea
											{...register('description')}
											rows={3}
											className={CONSTS.UI_CLASSES.INPUT_BASE}
										/>
										{errors.description && (
											<p className={CONSTS.UI_CLASSES.ERROR_TEXT}>{errors.description.message as string}</p>
										)}
									</div>

									<div>
										<label className={CONSTS.UI_CLASSES.LABEL}>{STRINGS.SUB_DEPARTMENTS_LABEL}</label>
										<select
											multiple
											{...register('subDepartments')}
											className={CONSTS.UI_CLASSES.SELECT_MULTIPLE}
										>
											{availableSubDepartments.map(dept => (
												<option key={dept.id} value={dept.id}>
													{dept.name}
												</option>
											))}
										</select>
										{errors.subDepartments && (
											<p className={CONSTS.UI_CLASSES.ERROR_TEXT}>
												{errors.subDepartments.message as string}
											</p>
										)}
									</div>

									<div className={CONSTS.UI_CLASSES.ACTIONS_CONTAINER}>
										<button type="submit" disabled={isSubmitting} className={CONSTS.UI_CLASSES.SAVE_BUTTON}>
											<FiSave className="mr-2 h-4 w-4" />
											{isSubmitting ? STRINGS.SAVING : STRINGS.SAVE}
										</button>
										<button type="button" onClick={onClose} className={CONSTS.UI_CLASSES.CANCEL_BUTTON}>
											<FiX className="mr-2 h-4 w-4" />
											{STRINGS.CANCEL}
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default React.memo(DepartmentForm);
