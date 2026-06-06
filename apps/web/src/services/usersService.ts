import { api } from './api';
import { User, CreateUserDto, UpdateUserDto } from '@emergensee/shared';

export const usersService = {
	getAll: async (): Promise<User[]> => {
		const response = await api.get<User[]>('/users');
		return response.data;
	},

	getOne: async (id: string): Promise<User> => {
		const response = await api.get<User>(`/users/${id}`);
		return response.data;
	},

	create: async (data: CreateUserDto): Promise<User> => {
		const response = await api.post<User>('/users', data);
		return response.data;
	},

	update: async (id: string, data: UpdateUserDto): Promise<User> => {
		const response = await api.patch<User>(`/users/${id}`, data);
		return response.data;
	},

	delete: async (id: string): Promise<void> => {
		await api.delete(`/users/${id}`);
	},

	uploadFaceImage: async (id: string, file: File): Promise<User> => {
		const formData = new FormData();
		formData.append('image', file);
		const response = await api.post<User>(`/users/${id}/face-images`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	deleteFaceImage: async (id: string, filename: string): Promise<User> => {
		const response = await api.delete<User>(`/users/${id}/face-images/${filename}`);
		return response.data;
	},
};
