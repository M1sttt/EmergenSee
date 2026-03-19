import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from 'store/authStore';
import { ResponderStatus } from '@emergensee/shared';
import { FaShieldAlt, FaAmbulance, FaExclamationTriangle } from 'react-icons/fa';
import {
  useEmergencyReportCreateStatusMutation,
  useEmergencyReportEventsQuery,
} from 'hooks/data/useEmergencyReportPageData';
import { Button } from '@/components/ui';

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
    return <div className="ui-page">{strings.loading}</div>;
  }

  if (!ongoingRelatedEvent) {
    return (
      <div className="ui-page text-center">
        <h2 className="text-2xl font-bold text-gray-800">{strings.noEventTitle}</h2>
        <p className="mt-2 text-gray-600">{strings.noEventDesc}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-6">
      <div className="w-full max-w-lg rounded-lg border-t-4 border-red-600 bg-white p-8 text-center shadow-xl">
        <h1 className="mb-2 flex items-center justify-center gap-2 text-4xl font-bold text-red-600">
          <FaExclamationTriangle />
          {strings.title}
        </h1>
        <p className="mb-6 text-lg text-gray-700">
          {strings.descriptionPrefix}
          <strong>{ongoingRelatedEvent.title}</strong>
          {strings.descriptionSuffix}
        </p>

        {successMessage && <div className="mb-6 rounded-md bg-blue-50 p-4 font-medium text-blue-800">{successMessage}</div>}

        <div className="space-y-6">
          <Button
            onClick={handleSafeClick}
            disabled={reportMutation.isPending}
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-xl bg-green-500 py-6 text-2xl font-bold text-white shadow-lg hover:bg-green-600 active:scale-95"
          >
            <FaShieldAlt /> {strings.safeButton}
          </Button>

          <Button
            onClick={handleHelpClick}
            disabled={reportMutation.isPending}
            variant="danger"
            size="lg"
            fullWidth
            className="rounded-xl py-6 text-2xl font-bold shadow-lg active:scale-95"
          >
            <FaAmbulance /> {strings.helpButton}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmergencyReportPage);
