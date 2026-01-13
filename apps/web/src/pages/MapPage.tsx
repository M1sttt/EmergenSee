import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { eventsService } from '../services/eventsService';
import { EVENT_PRIORITY_LABELS, EVENT_STATUS_LABELS, EVENT_TYPE_LABELS } from '@emergensee/shared';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function MapPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.getAll,
  });

  if (isLoading) {
    return <div className="h-full flex items-center justify-center">Loading map...</div>;
  }

  const defaultCenter: [number, number] = [40.7128, -74.006];

  return (
    <div className="h-full">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.location.coordinates[1], event.location.coordinates[0]]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Type:</strong> {EVENT_TYPE_LABELS[event.type]}</p>
                  <p><strong>Priority:</strong> {EVENT_PRIORITY_LABELS[event.priority]}</p>
                  <p><strong>Status:</strong> {EVENT_STATUS_LABELS[event.status]}</p>
                  <p><strong>Address:</strong> {event.address}</p>
                  <p className="mt-2">{event.description}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
