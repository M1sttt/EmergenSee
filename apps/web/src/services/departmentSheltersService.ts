import { api } from './api';
import {
	CreateDepartmentShelterDto,
	DepartmentShelter,
	UpdateDepartmentShelterDto,
} from '@emergensee/shared';

export const departmentSheltersService = {
	getAll: async (): Promise<DepartmentShelter[]> => {
		const response = await api.get<DepartmentShelter[]>('/department-shelters');
		return response.data;
	},

	create: async (data: CreateDepartmentShelterDto): Promise<DepartmentShelter> => {
		const response = await api.post<DepartmentShelter>('/department-shelters', data);
		return response.data;
	},

	update: async (id: string, data: UpdateDepartmentShelterDto): Promise<DepartmentShelter> => {
		const response = await api.patch<DepartmentShelter>(`/department-shelters/${id}`, data);
		return response.data;
	},

	delete: async (id: string): Promise<void> => {
		await api.delete(`/department-shelters/${id}`);
	},
};
