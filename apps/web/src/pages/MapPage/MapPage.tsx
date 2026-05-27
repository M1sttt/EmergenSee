import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@emergensee/shared';
import 'leaflet/dist/leaflet.css';

import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
import { useMapPageEventsQuery } from 'hooks/data/useMapPageData';

const MapPage: React.FC = () => {
	const { data: events = [], isLoading, isError } = useMapPageEventsQuery();

	const defaultIcon = useMemo(() => utils.createDefaultIcon(), []);

	if (isLoading) {
		return <div className="flex h-full items-center justify-center">{strings.loading}</div>;
	}

	if (isError) {
		return <div className="flex h-full items-center justify-center text-red-500">{strings.error}</div>;
	}

	return (
		<div className="h-full">
			<MapContainer
				center={consts.defaultCenter}
				zoom={consts.defaultZoom}
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer attribution={strings.attribution} url={consts.tileUrl} />
				{events.map(event => (
					<Marker key={event.id} position={utils.getLatLng(event)} icon={defaultIcon}>
						<Popup>
							<div className="p-2">
								<h3 className="mb-2 text-lg font-bold">{event.title}</h3>
								<div className="space-y-1 text-sm">
									<p>
										<strong>{strings.type}</strong> {EVENT_TYPE_LABELS[event.type]}
									</p>
									<p>
										<strong>{strings.priority}</strong> {EVENT_PRIORITY_LABELS[event.priority]}
									</p>
									<p>
										<strong>{strings.status}</strong> {EVENT_STATUS_LABELS[event.status]}
									</p>
									<p className="mt-2">{event.description}</p>
								</div>
							</div>
						</Popup>
					</Marker>
				))}
			</MapContainer>
		</div>
	);
};

export default React.memo(MapPage);
