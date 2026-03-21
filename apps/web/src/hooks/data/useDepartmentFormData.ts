import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateDepartmentDto, Department, UpdateDepartmentDto } from '@emergensee/shared';
import { departmentsService } from 'services/departmentsService';
import { toast } from 'sonner';
import * as strings from './strings';

export const DEPARTMENT_FORM_QUERY_KEYS = {
	departments: ['departments'] as const,
};

export function useDepartmentFormDepartmentsQuery() {
	return useQuery<Department[]>({
		queryKey: DEPARTMENT_FORM_QUERY_KEYS.departments,
		queryFn: departmentsService.getAll,
	});
}

export function useDepartmentFormSaveMutation(params: {
	department: Department | null;
	currentUserId?: string;
	onSuccess: () => void;
	onError: (message: string) => void;
}) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: { name: string; description: string; admins: string[]; subDepartments: string[] }) => {
			if (params.department) {
				const updateData: UpdateDepartmentDto = {
					name: data.name,
					description: data.description,
					admins: data.admins,
					subDepartments: data.subDepartments,
				};
				return departmentsService.update(params.department.id, updateData);
			}

			const createData: CreateDepartmentDto = {
				name: data.name,
				description: data.description,
				admins: params.currentUserId ? [params.currentUserId] : [],
				subDepartments: data.subDepartments,
			};

			return departmentsService.create(createData);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: DEPARTMENT_FORM_QUERY_KEYS.departments });
			toast.success(strings.departmentSaveSuccess);
			params.onSuccess();
		},
		onError: (error: unknown) => {
			const message =
				(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
				'An error occurred';
			toast.error(strings.departmentSaveError);
			params.onError(message);
		},
	});
}
