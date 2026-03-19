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
import { Button, FieldError, Input, Label, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';
import * as strings from './strings';
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
		<div className="ui-modal-root">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" onClick={onClose} />
				<div className="ui-modal-panel ui-modal-panel-2xl z-10 p-6">
					<h2 className="mb-6 flex flex-row items-center gap-2 text-2xl font-bold text-gray-900">
					{event ? strings.titleEdit : strings.titleCreate}
					</h2>

					{isLoadingDeps ? (
						<div className="flex flex-col items-center justify-center p-12 text-gray-500">
							<p>{strings.loadingDepartments}</p>
						</div>
					) : isErrorDeps ? (
						<div className="rounded-md bg-red-50 p-4 text-center text-red-600">
							<p className="flex items-center justify-center gap-2">
								<FiAlertCircle />
								{strings.errorDepartments}
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="ui-form-spacing">
							<div>
								<Label className="mb-1 mt-4">{strings.labelTitle}</Label>
								<Input
									{...register('title', { required: strings.errTitleRequired })}
									type="text"
									className="mt-0"
								/>
								<FieldError>{errors.title?.message}</FieldError>
							</div>

							<div>
								<Label className="mb-1 mt-4">{strings.labelType}</Label>
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
								<FieldError>{errors.type?.message}</FieldError>
							</div>

							<div>
								<Label className="mb-1 mt-4">{strings.labelPriority}</Label>
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
								<FieldError>{errors.priority?.message}</FieldError>
							</div>

							<div>
								<Label className="mb-1 mt-4">{strings.labelDepartments}</Label>
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
								<FieldError>{errors.departments?.message}</FieldError>
							</div>

							<div>
								<Label className="mb-1 mt-4">{strings.labelDescription}</Label>
								<Textarea
									{...register('description', {
										required: strings.errDescriptionRequired,
									})}
									rows={3}
									className="mt-0"
								/>
								<FieldError>{errors.description?.message}</FieldError>
							</div>

							<div className="mt-8 flex justify-end space-x-3">
								<Button
									type="button"
									onClick={onClose}
									disabled={isLoading}
									variant="secondary"
									size="md"
									className={cn(isLoading && 'cursor-not-allowed opacity-50')}
								>
									<FiX className="h-4 w-4" /> {strings.btnCancel}
								</Button>
								<Button
									type="submit"
									disabled={isLoading}
									variant="primary"
									size="md"
									className={cn(isLoading && 'cursor-not-allowed opacity-50')}
								>
									<FiSave className="h-4 w-4" />
									{event ? strings.btnUpdate : strings.btnCreate}
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
};

export default memo(EventForm);
