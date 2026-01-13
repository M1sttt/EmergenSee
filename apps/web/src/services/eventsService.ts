import { api } from './api';
import { Event, CreateEventDto, UpdateEventDto } from '@emergensee/shared';

export const eventsService = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  getOne: async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEventDto): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  getNearby: async (longitude: number, latitude: number, maxDistance?: number): Promise<Event[]> => {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
    });
    if (maxDistance) {
      params.append('maxDistance', maxDistance.toString());
    }
    const response = await api.get<Event[]>(`/events/nearby?${params.toString()}`);
    return response.data;
  },
};
