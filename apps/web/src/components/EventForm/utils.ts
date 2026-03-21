import { CreateEventDto, Event } from '@emergensee/shared';
import * as consts from './consts';

export const prepareEventFormData = (data: CreateEventDto) => {
	return {
		...data,
		location: data.location || {
			type: consts.defaultLocationType,
			coordinates: consts.defaultLocationCoordinates,
		},
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
