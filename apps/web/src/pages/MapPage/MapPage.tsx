import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@emergensee/shared';
import 'leaflet/dist/leaflet.css';

import { MAP_STRINGS } from './strings';
import { MAP_CLASSES, MAP_CONFIG } from './consts';
import { createDefaultIcon, getLatLng } from './utils';
import { useMapPageEventsQuery } from 'hooks/data/useMapPageData';

const MapPage: React.FC = () => {
	const {
		data: events = [],
		isLoading,
		isError,
	} = useMapPageEventsQuery();

	const defaultIcon = useMemo(() => createDefaultIcon(), []);

	if (isLoading) {
		return <div className={MAP_CLASSES.LOADING_CONTAINER}>{MAP_STRINGS.LOADING}</div>;
	}

	if (isError) {
		return <div className={MAP_CLASSES.ERROR_CONTAINER}>{MAP_STRINGS.ERROR}</div>;
	}

	return (
		<div className={MAP_CLASSES.CONTAINER}>
			<MapContainer
				center={MAP_CONFIG.DEFAULT_CENTER}
				zoom={MAP_CONFIG.DEFAULT_ZOOM}
				style={{ height: '100%', width: '100%' }}
			>
				<TileLayer attribution={MAP_STRINGS.ATTRIBUTION} url={MAP_CONFIG.TILE_URL} />
				{events.map(event => (
					<Marker key={event.id} position={getLatLng(event)} icon={defaultIcon}>
						<Popup>
							<div className={MAP_CLASSES.POPUP_CONTAINER}>
								<h3 className={MAP_CLASSES.POPUP_TITLE}>{event.title}</h3>
								<div className={MAP_CLASSES.POPUP_DETAILS}>
									<p>
										<strong>{MAP_STRINGS.TYPE}</strong> {EVENT_TYPE_LABELS[event.type]}
									</p>
									<p>
										<strong>{MAP_STRINGS.PRIORITY}</strong> {EVENT_PRIORITY_LABELS[event.priority]}
									</p>
									<p>
										<strong>{MAP_STRINGS.STATUS}</strong> {EVENT_STATUS_LABELS[event.status]}
									</p>
									<p className={MAP_CLASSES.POPUP_DESCRIPTION}>{event.description}</p>
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
