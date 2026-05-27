import { api } from './api';
import { StatusUpdate, CreateStatusUpdateDto, UpdateStatusUpdateDto } from '@emergensee/shared';

export const statusService = {
	getAll: async (): Promise<StatusUpdate[]> => {
		const response = await api.get<StatusUpdate[]>('/status');
		return response.data;
	},

	getOne: async (id: string): Promise<StatusUpdate> => {
		const response = await api.get<StatusUpdate>(`/status/${id}`);
		return response.data;
	},

	getByUser: async (userId: string): Promise<StatusUpdate[]> => {
		const response = await api.get<StatusUpdate[]>(`/status/user/${userId}`);
		return response.data;
	},

	getLatestByUser: async (userId: string): Promise<StatusUpdate | null> => {
		const response = await api.get<StatusUpdate>(`/status/user/${userId}/latest`);
		return response.data;
	},

	create: async (data: CreateStatusUpdateDto): Promise<StatusUpdate> => {
		const response = await api.post<StatusUpdate>('/status', data);
		return response.data;
	},

	update: async (id: string, data: UpdateStatusUpdateDto): Promise<StatusUpdate> => {
		const response = await api.patch<StatusUpdate>(`/status/${id}`, data);
		return response.data;
	},

	delete: async (id: string): Promise<void> => {
		await api.delete(`/status/${id}`);
	},
};
