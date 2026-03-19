import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from 'store/authStore';
import { ResponderStatus } from '@emergensee/shared';
import { FaShieldAlt, FaAmbulance, FaExclamationTriangle } from 'react-icons/fa';
import {
	useEmergencyReportCreateStatusMutation,
	useEmergencyReportEventsQuery,
} from 'hooks/data/useEmergencyReportPageData';

import { CONSTS } from './consts';
import { STRINGS } from './strings';
import { findOngoingRelatedEvent } from './utils';

const EmergencyReportPage: React.FC = () => {
	const user = useAuthStore(state => state.user);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { data: events = [], isLoading } = useEmergencyReportEventsQuery();

	const ongoingRelatedEvent = useMemo(() => {
		return findOngoingRelatedEvent(events, user);
	}, [events, user]);

	const reportMutation = useEmergencyReportCreateStatusMutation(status => {
		if (status === ResponderStatus.SAFE) {
			setSuccessMessage(STRINGS.SUCCESS_SAFE);
		} else if (status === ResponderStatus.NEED_HELP) {
			setSuccessMessage(STRINGS.SUCCESS_HELP);
		}
		setTimeout(() => setSuccessMessage(null), CONSTS.TIMEOUTS.SUCCESS_MESSAGE);
	});

	const ongoingEventId = ongoingRelatedEvent?.id || (ongoingRelatedEvent as { _id?: string } | undefined)?._id;

	const handleSafeClick = useCallback(() => {
		if (!ongoingEventId) return;
		reportMutation.mutate({ status: ResponderStatus.SAFE, eventId: ongoingEventId });
	}, [reportMutation, ongoingEventId]);

	const handleHelpClick = useCallback(() => {
		if (!ongoingEventId) return;
		reportMutation.mutate({ status: ResponderStatus.NEED_HELP, eventId: ongoingEventId });
	}, [reportMutation, ongoingEventId]);

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
