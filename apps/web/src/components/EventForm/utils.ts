import { CreateEventDto, Event } from '@emergensee/shared';
import { EventFormConsts } from './consts';

export const prepareEventFormData = (data: CreateEventDto) => {
	return {
		...data,
		location: data.location || EventFormConsts.DEFAULT_LOCATION,
	};
};

export const getDefaultValues = (event?: Event | null): Partial<CreateEventDto> | undefined => {
	if (!event) return undefined;

	return {
		type: event.type,
		priority: event.priority,
		title: event.title,
		description: event.description,
		location: event.location,
		departments: event.departments,
	};
};
