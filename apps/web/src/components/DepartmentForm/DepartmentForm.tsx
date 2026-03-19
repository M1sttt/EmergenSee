import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { Department, createDepartmentSchema, updateDepartmentSchema } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import SelectDropdown from '@/components/SelectDropdown';
import {
	useDepartmentFormDepartmentsQuery,
	useDepartmentFormSaveMutation,
} from 'hooks/data/useDepartmentFormData';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

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
		() => utils.getAvailableSubDepartments(allDepartments, department),
		[allDepartments, department],
	);

	const schema = useMemo(() => (department ? updateDepartmentSchema : createDepartmentSchema), [department]);

	const {
		register,
		control,
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
			setError(message || strings.defaultError);
		},
	});

	const onSubmit = useCallback(
		(data: DepartmentFormData) => {
			mutation.mutate(data);
		},
		[mutation],
	);

	const subDepartmentOptions = useMemo(
		() =>
			availableSubDepartments.map(dept => ({
				value: dept.id,
				label: dept.name,
			})),
		[availableSubDepartments],
	);

	if (isLoading) {
		return (
			<div className={consts.modalContainerClass}>
				<div className={consts.modalWrapperClass}>
					<div className={consts.overlayClass} />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10">
						Loading...
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className={consts.modalContainerClass}>
				<div className={consts.modalWrapperClass}>
					<div className={consts.overlayClass} />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10 text-red-600 flex items-center gap-2">
						<FiAlertCircle /> Failed to load departments
						<button onClick={onClose} className={consts.cancelButtonClass}>
							{strings.cancelText}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={consts.modalContainerClass}>
			<div className={consts.modalWrapperClass}>
				<div className={consts.overlayClass} onClick={onClose} />

				<div className={consts.modalContentClass}>
					<div className={consts.modalBodyClass}>
						<div className="sm:flex sm:items-start">
							<div className={consts.formContainerClass}>
								<h3 className={consts.headingClass}>
									{department ? strings.editDepartment : strings.createDepartment}
								</h3>

								<form onSubmit={handleSubmit(onSubmit)} className={consts.formLayoutClass}>
									{error && (
										<div className={consts.errorBoxClass}>
											<div className="flex items-center gap-2">
												<FiAlertCircle />
												<span>{error}</span>
											</div>
										</div>
									)}

									<div>
										<label className={consts.labelClass}>{strings.nameLabel}</label>
										<input type="text" {...register('name')} className={consts.inputBaseClass} />
										{errors.name && (
											<p className={consts.errorTextClass}>{errors.name.message as string}</p>
										)}
									</div>

									<div>
										<label className={consts.labelClass}>{strings.descriptionLabel}</label>
										<textarea
											{...register('description')}
											rows={3}
											className={consts.inputBaseClass}
										/>
										{errors.description && (
											<p className={consts.errorTextClass}>{errors.description.message as string}</p>
										)}
									</div>

									<div>
										<label className={consts.labelClass}>{strings.subDepartmentsLabel}</label>
										<Controller
											name="subDepartments"
											control={control}
											render={({ field }) => (
												<SelectDropdown
													{...field}
													isMulti
													options={subDepartmentOptions}
													placeholder={strings.subDepartmentsLabel}
													closeMenuOnSelect={false}
													error={errors.subDepartments?.message as string | undefined}
												/>
											)}
										/>
									</div>

									<div className={consts.actionsContainerClass}>
										<button type="submit" disabled={isSubmitting} className={consts.saveButtonClass}>
											<FiSave className="mr-2 h-4 w-4" />
											{isSubmitting ? strings.savingText : strings.saveText}
										</button>
										<button type="button" onClick={onClose} className={consts.cancelButtonClass}>
											<FiX className="mr-2 h-4 w-4" />
											{strings.cancelText}
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
