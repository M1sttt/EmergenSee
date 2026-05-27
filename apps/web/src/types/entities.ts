import { Department, Event, StatusUpdate, User } from '@emergensee/shared';

export interface OptionalObjectId {
	_id?: string;
}

export type WithOptionalObjectId<T> = T & OptionalObjectId;

export type EntityIdSource = string | { id?: string; _id?: string } | null | undefined;

export const getEntityId = (source: EntityIdSource): string => {
	if (!source) return '';
	if (typeof source === 'string') return source;
	return source.id || source._id || '';
};

export type DepartmentReference = string | { id?: string; _id?: string };
export type UserReference = string | { id?: string; _id?: string };
export type EventReference = string | { id?: string; _id?: string };

export type DepartmentWithOptionalObjectId = WithOptionalObjectId<Department>;

export type EventWithOptionalObjectId = WithOptionalObjectId<Event> & {
	departments?: DepartmentReference[];
};

export type UserWithOptionalObjectId = WithOptionalObjectId<User> & {
	departments?: DepartmentReference[];
};

export type StatusUpdateWithReferences = WithOptionalObjectId<StatusUpdate> & {
	userId: UserReference;
	eventId: EventReference;
	createdAt: Date | string;
	updatedAt: Date | string;
};

export const toDate = (value: Date | string): Date => {
	return value instanceof Date ? value : new Date(value);
};
