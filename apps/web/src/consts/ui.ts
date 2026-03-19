import { EventPriority, EventStatus, ResponderStatus, UserStatus } from '@emergensee/shared';

export type UiTone = 'neutral' | 'info' | 'success' | 'warning' | 'orange' | 'danger';

export const getEventPriorityTone = (priority: EventPriority): UiTone => {
	switch (priority) {
		case EventPriority.CRITICAL:
			return 'danger';
		case EventPriority.HIGH:
			return 'orange';
		case EventPriority.MEDIUM:
			return 'warning';
		case EventPriority.LOW:
			return 'success';
		default:
			return 'neutral';
	}
};

export const getEventStatusTone = (status: EventStatus): UiTone => {
	switch (status) {
		case EventStatus.ONGOING:
			return 'info';
		case EventStatus.RESOLVED:
			return 'success';
		case EventStatus.CANCELLED:
			return 'danger';
		default:
			return 'neutral';
	}
};

export const getResponderStatusTone = (status: ResponderStatus): UiTone => {
	switch (status) {
		case ResponderStatus.SAFE:
			return 'success';
		case ResponderStatus.NEED_HELP:
			return 'danger';
		case ResponderStatus.AWAY:
			return 'info';
		case ResponderStatus.UNKNOWN:
		default:
			return 'neutral';
	}
};

export const getUserStatusTone = (status: UserStatus): UiTone => {
	switch (status) {
		case UserStatus.ACTIVE:
			return 'success';
		case UserStatus.INACTIVE:
			return 'neutral';
		case UserStatus.SUSPENDED:
		default:
			return 'danger';
	}
};
