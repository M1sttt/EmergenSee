import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { Department, createDepartmentSchema, updateDepartmentSchema } from '@emergensee/shared';
import { useAuthStore } from 'store/authStore';
import SelectDropdown from '@/components/SelectDropdown';
import { Button, FieldError, Input, Label, Textarea } from '@/components/ui';
import {
	useDepartmentFormDepartmentsQuery,
	useDepartmentFormSaveMutation,
} from 'hooks/data/useDepartmentFormData';
import * as strings from './strings';
import * as utils from './utils';

interface DepartmentFormProps {
	department: Department | null;
	onClose: () => void;
}

type DepartmentFormData = {
	name?: string;
	description?: string;
	admins?: string[];
	subDepartments?: string[];
};

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, onClose }) => {
	const [error, setError] = useState('');
	const currentUser = useAuthStore(state => state.user);

	const { data: allDepartmentsResponse = [], isLoading, isError } = useDepartmentFormDepartmentsQuery();

	const allDepartments = useMemo(() => {
		return allDepartmentsResponse || [];
	}, [allDepartmentsResponse]);

	const availableSubDepartments = useMemo(
		() => utils.getAvailableSubDepartments(allDepartments, department),
		[allDepartments, department],
	);

	const schema = useMemo(() => (department ? updateDepartmentSchema : createDepartmentSchema), [department]);

	const formDefaults = useMemo<DepartmentFormData>(
		() => ({
			name: department?.name || '',
			description: department?.description || '',
			admins: department?.admins || (currentUser ? [currentUser.id] : []),
			subDepartments: department?.subDepartments || [],
		}),
		[currentUser, department],
	);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<DepartmentFormData>({
		resolver: zodResolver(schema),
		defaultValues: formDefaults,
	});

	useEffect(() => {
		reset(formDefaults);
	}, [formDefaults, reset]);

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
			mutation.mutate({
				name: data.name || '',
				description: data.description || '',
				admins: data.admins || [],
				subDepartments: data.subDepartments || [],
			});
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
			<div className="ui-modal-root">
				<div className="ui-modal-center">
					<div className="ui-modal-backdrop" />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10">
						Loading...
					</div>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="ui-modal-root">
				<div className="ui-modal-center">
					<div className="ui-modal-backdrop" />
					<div className="relative transform overflow-hidden rounded-lg bg-white p-6 shadow-xl text-center z-10 text-red-600 flex items-center gap-2">
						<FiAlertCircle /> Failed to load departments
						<Button onClick={onClose} variant="secondary" size="md" className="mt-3 sm:mt-0">
							{strings.cancelText}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="ui-modal-root">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" onClick={onClose} />

				<div className="ui-modal-panel ui-modal-panel-md z-10">
					<div className="ui-modal-header">
						<div className="sm:flex sm:items-start">
							<div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
								<h3 className="mb-4 text-lg font-semibold leading-6 text-gray-900">
									{department ? strings.editDepartment : strings.createDepartment}
								</h3>

								<form onSubmit={handleSubmit(onSubmit)} className="ui-form-spacing">
									{error && (
										<div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
											<div className="flex items-center gap-2">
												<FiAlertCircle />
												<span>{error}</span>
											</div>
										</div>
									)}

									<div>
										<Label>{strings.nameLabel}</Label>
										<Input type="text" {...register('name')} />
										<FieldError>{errors.name?.message as string | undefined}</FieldError>
									</div>

									<div>
										<Label>{strings.descriptionLabel}</Label>
										<Textarea {...register('description')} rows={3} className="min-h-[96px]" />
										<FieldError>{errors.description?.message as string | undefined}</FieldError>
									</div>

									<div>
										<Label>{strings.subDepartmentsLabel}</Label>
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

									<div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
										<Button
											type="submit"
											disabled={isSubmitting}
											variant="primary"
											size="md"
											className="w-full sm:ml-3 sm:w-auto"
										>
											<FiSave className="mr-2 h-4 w-4" />
											{isSubmitting ? strings.savingText : strings.saveText}
										</Button>
										<Button
											type="button"
											onClick={onClose}
											variant="secondary"
											size="md"
											className="mt-3 w-full sm:mt-0 sm:w-auto"
										>
											<FiX className="mr-2 h-4 w-4" />
											{strings.cancelText}
										</Button>
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
