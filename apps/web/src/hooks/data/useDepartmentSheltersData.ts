import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateDepartmentShelterDto, Department, DepartmentShelter } from '@emergensee/shared';
import { departmentSheltersService } from 'services/departmentSheltersService';
import { departmentsService } from 'services/departmentsService';
import { toast } from 'sonner';
import * as strings from './strings';

export const DEPARTMENT_SHELTERS_QUERY_KEYS = {
	departmentShelters: ['department-shelters'] as const,
	departments: ['departments'] as const,
};

export function useDepartmentSheltersQuery() {
	return useQuery<DepartmentShelter[]>({
		queryKey: DEPARTMENT_SHELTERS_QUERY_KEYS.departmentShelters,
		queryFn: departmentSheltersService.getAll,
	});
}

export function useDepartmentSheltersDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: DEPARTMENT_SHELTERS_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useCreateDepartmentShelterMutation(onSuccess: () => void) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateDepartmentShelterDto) => departmentSheltersService.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DEPARTMENT_SHELTERS_QUERY_KEYS.departmentShelters });
			toast.success(strings.departmentShelterCreateSuccess);
			onSuccess();
		},
		onError: () => {
			toast.error(strings.departmentShelterCreateError);
		},
	});
}

export function useDeleteDepartmentShelterMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => departmentSheltersService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DEPARTMENT_SHELTERS_QUERY_KEYS.departmentShelters });
			toast.success(strings.departmentShelterDeleteSuccess);
		},
		onError: () => {
			toast.error(strings.departmentShelterDeleteError);
		},
	});
}
