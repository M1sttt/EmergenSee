import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { departmentsService } from '../../services/departmentsService';
import {
    Department,
    createDepartmentSchema,
    updateDepartmentSchema,
} from '@emergensee/shared';
import { useAuthStore } from '../../store/authStore';

interface DepartmentFormProps {
    department: Department | null;
    onClose: () => void;
}

export default function DepartmentForm({ department, onClose }: DepartmentFormProps) {
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const currentUser = useAuthStore((state) => state.user);

    const { data: allDepartmentsResponse } = useQuery<any>({
        queryKey: ['departments'],
        queryFn: departmentsService.getAll,
    });
    const allDepartments: any[] = Array.isArray(allDepartmentsResponse) ? allDepartmentsResponse : (allDepartmentsResponse?.data || []);
    const availableSubDepartments = allDepartments.filter((d: any) => !department || (d.id || (d as any)._id) !== (department.id || (department as any)._id));

    const schema = department ? updateDepartmentSchema : createDepartmentSchema;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: department || {
            name: '',
            description: '',
            admins: currentUser ? [currentUser.id] : [],
            subDepartments: [],
        },
    });

    useEffect(() => {
        if (department) {
            reset(department);
        }
    }, [department, reset]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (department) {
                return departmentsService.update(department.id, data);
            }
            return departmentsService.create({
                ...data,
                admins: currentUser ? [currentUser.id] : [], // Author becomes admin initially
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'An error occurred');
        },
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                                    {department ? 'Edit Department' : 'Create Department'}
                                </h3>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                        <input
                                            type="text"
                                            {...register('name')}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            {...register('description')}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Sub Departments (Hold Ctrl/Cmd to select multiple)</label>
                                        <select
                                            multiple
                                            {...register('subDepartments')}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm h-24"
                                        >
                                            {availableSubDepartments.map((dept: any) => (
                                                <option key={dept.id || dept._id} value={dept.id || dept._id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        {errors.subDepartments && (
                                            <p className="mt-1 text-sm text-red-600">{errors.subDepartments.message as string}</p>
                                        )}
                                    </div>

                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
