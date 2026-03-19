import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from 'store/authStore';
import { ResponderStatus } from '@emergensee/shared';
import { FaShieldAlt, FaAmbulance, FaExclamationTriangle } from 'react-icons/fa';
import {
  useEmergencyReportCreateStatusMutation,
  useEmergencyReportEventsQuery,
} from 'hooks/data/useEmergencyReportPageData';

import * as consts from './consts';
import * as strings from './strings';
import * as utils from './utils';

const EmergencyReportPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: events = [], isLoading } = useEmergencyReportEventsQuery();

  const ongoingRelatedEvent = useMemo(() => {
    return utils.findOngoingRelatedEvent(events, user);
  }, [events, user]);

  const reportMutation = useEmergencyReportCreateStatusMutation(status => {
    if (status === ResponderStatus.SAFE) {
      setSuccessMessage(strings.successSafe);
    } else if (status === ResponderStatus.NEED_HELP) {
      setSuccessMessage(strings.successHelp);
    }
    setTimeout(() => setSuccessMessage(null), consts.successMessageTimeout);
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
    return <div className={consts.loadingWrapperClass}>{strings.loading}</div>;
  }

  if (!ongoingRelatedEvent) {
    return (
      <div className={consts.noEventWrapperClass}>
        <h2 className={consts.noEventTitleClass}>{strings.noEventTitle}</h2>
        <p className={consts.noEventDescClass}>{strings.noEventDesc}</p>
      </div>
    );
  }

  return (
    <div className={consts.mainWrapperClass}>
      <div className={consts.contentBoxClass}>
        <h1 className={consts.titleClass}>
          <FaExclamationTriangle />
          {strings.title}
        </h1>
        <p className={consts.descriptionClass}>
          {strings.descriptionPrefix}
          <strong>{ongoingRelatedEvent.title}</strong>
          {strings.descriptionSuffix}
        </p>

        {successMessage && <div className={consts.successMessageClass}>{successMessage}</div>}

        <div className={consts.buttonsWrapperClass}>
          <button
            onClick={handleSafeClick}
            disabled={reportMutation.isPending}
            className={consts.safeButtonClass}
          >
            <FaShieldAlt /> {strings.safeButton}
          </button>

          <button
            onClick={handleHelpClick}
            disabled={reportMutation.isPending}
            className={consts.helpButtonClass}
          >
            <FaAmbulance /> {strings.helpButton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmergencyReportPage);
