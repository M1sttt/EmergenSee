import SelectDropdown from '@/components/SelectDropdown';
import React, { memo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Event, CreateEventDto, EventType, EventPriority } from '@emergensee/shared';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import {
	useEventFormCreateMutation,
	useEventFormDepartmentsQuery,
	useEventFormUpdateMutation,
} from 'hooks/data/useEventFormData';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

interface EventFormProps {
	event?: Event | null;
	onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onClose }) => {
	const {
		data: departments = [],
		isLoading: isLoadingDeps,
		isError: isErrorDeps,
	} = useEventFormDepartmentsQuery();

	const defaultValues = utils.getDefaultValues(event);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateEventDto>({
		defaultValues,
	});

	const onSuccess = useCallback(() => {
		onClose();
	}, [onClose]);

	const createMutation = useEventFormCreateMutation(onSuccess);

	const updateMutation = useEventFormUpdateMutation(onSuccess);

	const onSubmit = useCallback(
		(data: CreateEventDto) => {
			const formData = utils.prepareEventFormData(data);
			if (event) {
				updateMutation.mutate({ id: event.id, data: formData });
			} else {
				createMutation.mutate(formData as CreateEventDto);
			}
		},
		[event, updateMutation, createMutation],
	);

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<div className={consts.containerClass}>
			<div className={consts.formCardClass}>
				<h2 className={consts.titleClass}>
					{event ? strings.titleEdit : strings.titleCreate}
				</h2>

				{isLoadingDeps ? (
					<div className={consts.loadingContainerClass}>
						<p>{strings.loadingDepartments}</p>
					</div>
				) : isErrorDeps ? (
					<div className={consts.errorContainerClass}>
						<p className="flex items-center justify-center gap-2">
							<FiAlertCircle />
							{strings.errorDepartments}
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div>
							<label className={consts.labelClass}>{strings.labelTitle}</label>
							<input
								{...register('title', { required: strings.errTitleRequired })}
								type="text"
								className={consts.inputClass}
							/>
							{errors.title && <p className={consts.errorClass}>{errors.title.message}</p>}
						</div>

						<div>
							<label className={consts.labelClass}>{strings.labelType}</label>
							<Controller
								name="type"
								control={control}
								rules={{ required: strings.errTypeRequired }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										options={Object.values(EventType).map(type => ({ value: type, label: type }))}
										placeholder={strings.placeholderSelectType}
										error={errors.type?.message}
									/>
								)}
							/>
							{errors.type && <p className={consts.errorClass}>{errors.type.message}</p>}
						</div>

						<div>
							<label className={consts.labelClass}>{strings.labelPriority}</label>
							<Controller
								name="priority"
								control={control}
								rules={{ required: strings.errPriorityRequired }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										options={Object.values(EventPriority).map(priority => ({
											value: priority,
											label: priority,
										}))}
										placeholder={strings.placeholderSelectPriority}
										error={errors.priority?.message}
									/>
								)}
							/>
							{errors.priority && <p className={consts.errorClass}>{errors.priority.message}</p>}
						</div>

						<div>
							<label className={consts.labelClass}>{strings.labelDepartments}</label>
							<Controller
								name="departments"
								control={control}
								rules={{ required: strings.errDepartmentsRequired }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										isMulti
										options={departments.map(dept => ({
											value: dept.id || (dept as { _id?: string })._id || '',
											label: dept.name,
										}))}
										placeholder={strings.labelDepartments}
										error={errors.departments?.message}
									/>
								)}
							/>
							{errors.departments && (
								<p className={consts.errorClass}>{errors.departments.message}</p>
							)}
						</div>

						<div>
							<label className={consts.labelClass}>{strings.labelDescription}</label>
							<textarea
								{...register('description', {
									required: strings.errDescriptionRequired,
								})}
								rows={3}
								className={consts.textareaClass}
							/>
							{errors.description && (
								<p className={consts.errorClass}>{errors.description.message}</p>
							)}
						</div>

						<div className={consts.buttonGroupClass}>
							<button
								type="button"
								onClick={onClose}
								disabled={isLoading}
								className={`${consts.btnCancelClass} ${isLoading ? consts.btnLoadingClass : ''}`}
							>
								<FiX className="w-4 h-4" /> {strings.btnCancel}
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className={`${consts.btnSubmitClass} ${isLoading ? consts.btnLoadingClass : ''}`}
							>
								<FiSave className="w-4 h-4" />{' '}
								{event ? strings.btnUpdate : strings.btnCreate}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default memo(EventForm);
