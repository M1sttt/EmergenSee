import SelectDropdown from '@/components/SelectDropdown';
import React, { memo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { eventsService } from 'services/eventsService';
import { departmentsService } from 'services/departmentsService';
import { Event, CreateEventDto, UpdateEventDto, EventType, EventPriority } from '@emergensee/shared';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { EventFormStrings } from './strings';
import { EventFormConsts } from './consts';
import { prepareEventFormData, getDefaultValues } from './utils';

// Avoid using any by expecting the correct department structure
interface DepartmentOption {
	id?: string;
	_id?: string;
	name: string;
}

interface EventFormProps {
	event?: Event | null;
	onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onClose }) => {
	const queryClient = useQueryClient();

	// Fix: no <any> for query response
	const {
		data: departmentsResponse,
		isLoading: isLoadingDeps,
		isError: isErrorDeps,
	} = useQuery<unknown, Error>({
		queryKey: EventFormConsts.QUERY_KEYS.DEPARTMENTS,
		queryFn: departmentsService.getAll,
	});

	// Safe cast with check
	const departmentsList = departmentsResponse as { data?: DepartmentOption[] } | DepartmentOption[];
	const departments: DepartmentOption[] = Array.isArray(departmentsList)
		? departmentsList
		: departmentsList?.data || [];

	const defaultValues = getDefaultValues(event);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateEventDto>({
		defaultValues,
	});

	const onSuccess = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: EventFormConsts.QUERY_KEYS.EVENTS });
		onClose();
	}, [queryClient, onClose]);

	const createMutation = useMutation({
		mutationFn: eventsService.create,
		onSuccess,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: UpdateEventDto }) => eventsService.update(id, data),
		onSuccess,
	});

	const onSubmit = useCallback(
		(data: CreateEventDto) => {
			const formData = prepareEventFormData(data);
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
		<div className={EventFormConsts.STYLES.CONTAINER}>
			<div className={EventFormConsts.STYLES.FORM_CARD}>
				<h2 className={EventFormConsts.STYLES.TITLE}>
					{event ? EventFormStrings.TITLE_EDIT : EventFormStrings.TITLE_CREATE}
				</h2>

				{isLoadingDeps ? (
					<div className={EventFormConsts.STYLES.LOADING_CONTAINER}>
						<p>{EventFormStrings.LOADING_DEPARTMENTS}</p>
					</div>
				) : isErrorDeps ? (
					<div className={EventFormConsts.STYLES.ERROR_CONTAINER}>
						<p className="flex items-center justify-center gap-2">
							<FiAlertCircle />
							{EventFormStrings.ERROR_DEPARTMENTS}
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div>
							<label className={EventFormConsts.STYLES.LABEL}>{EventFormStrings.LABEL_TITLE}</label>
							<input
								{...register('title', { required: EventFormStrings.ERR_TITLE_REQUIRED })}
								type="text"
								className={EventFormConsts.STYLES.INPUT}
							/>
							{errors.title && <p className={EventFormConsts.STYLES.ERROR}>{errors.title.message}</p>}
						</div>

						<div>
							<label className={EventFormConsts.STYLES.LABEL}>{EventFormStrings.LABEL_TYPE}</label>
							<Controller
								name="type"
								control={control}
								rules={{ required: EventFormStrings.ERR_TYPE_REQUIRED }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										options={Object.values(EventType).map(type => ({ value: type, label: type }))}
										placeholder={EventFormStrings.PLACEHOLDER_SELECT_TYPE}
										error={errors.type?.message}
									/>
								)}
							/>
							{errors.type && <p className={EventFormConsts.STYLES.ERROR}>{errors.type.message}</p>}
						</div>

						<div>
							<label className={EventFormConsts.STYLES.LABEL}>{EventFormStrings.LABEL_PRIORITY}</label>
							<Controller
								name="priority"
								control={control}
								rules={{ required: EventFormStrings.ERR_PRIORITY_REQUIRED }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										options={Object.values(EventPriority).map(priority => ({
											value: priority,
											label: priority,
										}))}
										placeholder={EventFormStrings.PLACEHOLDER_SELECT_PRIORITY}
										error={errors.priority?.message}
									/>
								)}
							/>
							{errors.priority && <p className={EventFormConsts.STYLES.ERROR}>{errors.priority.message}</p>}
						</div>

						<div>
							<label className={EventFormConsts.STYLES.LABEL}>{EventFormStrings.LABEL_DEPARTMENTS}</label>
							<Controller
								name="departments"
								control={control}
								rules={{ required: EventFormStrings.ERR_DEPARTMENTS_REQUIRED }}
								render={({ field }) => (
									<SelectDropdown
										{...field}
										isMulti
										options={departments.map(dept => ({
											value: dept.id || dept._id || '',
											label: dept.name,
										}))}
										placeholder={EventFormStrings.LABEL_DEPARTMENTS}
										error={errors.departments?.message}
									/>
								)}
							/>
							{errors.departments && (
								<p className={EventFormConsts.STYLES.ERROR}>{errors.departments.message}</p>
							)}
						</div>

						<div>
							<label className={EventFormConsts.STYLES.LABEL}>{EventFormStrings.LABEL_DESCRIPTION}</label>
							<textarea
								{...register('description', {
									required: EventFormStrings.ERR_DESCRIPTION_REQUIRED,
								})}
								rows={3}
								className={EventFormConsts.STYLES.TEXTAREA}
							/>
							{errors.description && (
								<p className={EventFormConsts.STYLES.ERROR}>{errors.description.message}</p>
							)}
						</div>

						<div className={EventFormConsts.STYLES.BUTTON_GROUP}>
							<button
								type="button"
								onClick={onClose}
								disabled={isLoading}
								className={`${EventFormConsts.STYLES.BTN_CANCEL} ${isLoading ? EventFormConsts.STYLES.BTN_LOADING : ''}`}
							>
								<FiX className="w-4 h-4" /> {EventFormStrings.BTN_CANCEL}
							</button>
							<button
								type="submit"
								disabled={isLoading}
								className={`${EventFormConsts.STYLES.BTN_SUBMIT} ${isLoading ? EventFormConsts.STYLES.BTN_LOADING : ''}`}
							>
								<FiSave className="w-4 h-4" />{' '}
								{event ? EventFormStrings.BTN_UPDATE : EventFormStrings.BTN_CREATE}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};

export default memo(EventForm);
