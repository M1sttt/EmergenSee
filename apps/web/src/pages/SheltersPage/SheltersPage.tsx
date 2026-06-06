import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import * as consts from './consts';
import * as strings from './strings';
import { fetchShelters } from './utils';

// Green circle marker — no external CDN dependency
const shelterIcon = L.divIcon({
	className: '',
	html: '<div style="width:14px;height:14px;background:#22c55e;border:2.5px solid #15803d;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
	iconSize: [14, 14],
	iconAnchor: [7, 7],
	popupAnchor: [0, -10],
});

const SheltersPage: React.FC = () => {
	const {
		data: shelters = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['shelters-israel'],
		queryFn: fetchShelters,
		staleTime: consts.sheltersCacheMs,
		retry: 2,
	});

	const shelterCount = useMemo(() => shelters.length, [shelters]);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
				<div>
					<h1 className="text-xl font-bold text-gray-900">{strings.pageTitle}</h1>
					<p className="text-sm text-gray-500">{strings.pageSubtitle}</p>
				</div>
				{!isLoading && !isError && (
					<span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
						{strings.shelterCount(shelterCount)}
					</span>
				)}
			</div>

			{/* Map */}
			<div className="relative flex-1">
				{isLoading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
						<div className="flex flex-col items-center gap-2">
							<div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
							<span className="text-sm text-gray-500">{strings.loading}</span>
						</div>
					</div>
				)}
				{isError && (
					<div className="flex h-full items-center justify-center text-red-500">
						{strings.error}
					</div>
				)}
				<MapContainer
					center={consts.israelCenter}
					zoom={consts.israelZoom}
					style={{ height: '100%', width: '100%' }}
				>
					<TileLayer attribution={strings.attribution} url={consts.tileUrl} />
					{shelters.map(shelter => (
						<Marker key={shelter.id} position={shelter.latlng} icon={shelterIcon}>
							<Popup>
								<div className="min-w-[160px] p-1">
									<p className="font-semibold text-gray-900">{shelter.name}</p>
									{shelter.address ? (
										<p className="mt-0.5 text-sm text-gray-500">{shelter.address}</p>
									) : (
										<p className="mt-0.5 text-sm text-gray-400">{strings.noAddress}</p>
									)}
								</div>
							</Popup>
						</Marker>
					))}
				</MapContainer>
			</div>
		</div>
	);
};

export default React.memo(SheltersPage);
