import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { statusService } from 'services/statusService';
import { eventsService } from 'services/eventsService';
import { useAuthStore } from 'store/authStore';
import { ResponderStatus, Event } from '@emergensee/shared';
import { FaShieldAlt, FaAmbulance, FaExclamationTriangle } from 'react-icons/fa';

import { CONSTS } from './consts';
import { STRINGS } from './strings';
import { findOngoingRelatedEvent } from './utils';

const EmergencyReportPage: React.FC = () => {
	const user = useAuthStore(state => state.user);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { data: events = [], isLoading } = useQuery<Event[]>({
		queryKey: ['events'],
		queryFn: eventsService.getAll,
	});

	const ongoingRelatedEvent = useMemo(() => {
		return findOngoingRelatedEvent(events, user);
	}, [events, user]);

	const reportMutation = useMutation({
		mutationFn: async (status: ResponderStatus) => {
			if (!ongoingRelatedEvent) throw new Error(STRINGS.ERROR_NO_EVENT);
			return statusService.create({
				status,
				eventId: ongoingRelatedEvent.id || ((ongoingRelatedEvent as { _id?: string })._id as string),
			});
		},
		onSuccess: (_, variables) => {
			if (variables === ResponderStatus.SAFE) {
				setSuccessMessage(STRINGS.SUCCESS_SAFE);
			} else if (variables === ResponderStatus.NEED_HELP) {
				setSuccessMessage(STRINGS.SUCCESS_HELP);
			}
			setTimeout(() => setSuccessMessage(null), CONSTS.TIMEOUTS.SUCCESS_MESSAGE);
		},
	});

	const handleSafeClick = useCallback(() => {
		reportMutation.mutate(ResponderStatus.SAFE);
	}, [reportMutation]);

	const handleHelpClick = useCallback(() => {
		reportMutation.mutate(ResponderStatus.NEED_HELP);
	}, [reportMutation]);

	if (isLoading) {
		return <div className={CONSTS.CLASSES.LOADING_WRAPPER}>{STRINGS.LOADING}</div>;
	}

	if (!ongoingRelatedEvent) {
		return (
			<div className={CONSTS.CLASSES.NO_EVENT_WRAPPER}>
				<h2 className={CONSTS.CLASSES.NO_EVENT_TITLE}>{STRINGS.NO_EVENT_TITLE}</h2>
				<p className={CONSTS.CLASSES.NO_EVENT_DESC}>{STRINGS.NO_EVENT_DESC}</p>
			</div>
		);
	}

	return (
		<div className={CONSTS.CLASSES.MAIN_WRAPPER}>
			<div className={CONSTS.CLASSES.CONTENT_BOX}>
				<h1 className={CONSTS.CLASSES.TITLE}>
					<FaExclamationTriangle />
					{STRINGS.TITLE}
				</h1>
				<p className={CONSTS.CLASSES.DESCRIPTION}>
					{STRINGS.DESCRIPTION_PREFIX}
					<strong>{ongoingRelatedEvent.title}</strong>
					{STRINGS.DESCRIPTION_SUFFIX}
				</p>

				{successMessage && <div className={CONSTS.CLASSES.SUCCESS_MESSAGE}>{successMessage}</div>}

				<div className={CONSTS.CLASSES.BUTTONS_WRAPPER}>
					<button
						onClick={handleSafeClick}
						disabled={reportMutation.isPending}
						className={CONSTS.CLASSES.SAFE_BUTTON}
					>
						<FaShieldAlt /> {STRINGS.SAFE_BUTTON}
					</button>

					<button
						onClick={handleHelpClick}
						disabled={reportMutation.isPending}
						className={CONSTS.CLASSES.HELP_BUTTON}
					>
						<FaAmbulance /> {STRINGS.HELP_BUTTON}
					</button>
				</div>
			</div>
		</div>
	);
};

export default React.memo(EmergencyReportPage);
