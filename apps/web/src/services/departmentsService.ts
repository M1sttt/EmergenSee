import { api } from './api';
import { Department, CreateDepartmentDto, UpdateDepartmentDto } from '@emergensee/shared';

class DepartmentsService {
    async getAll(): Promise<Department[]> {
        const response = await api.get('/departments');
        return response.data;
    }

    async getById(id: string): Promise<Department> {
        const response = await api.get(`/departments/${id}`);
        return response.data;
    }

    async create(data: CreateDepartmentDto): Promise<Department> {
        const response = await api.post('/departments', data);
        return response.data;
    }

    async update(id: string, data: UpdateDepartmentDto): Promise<Department> {
        const response = await api.patch(`/departments/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/departments/${id}`);
    }
}

export const departmentsService = new DepartmentsService();
