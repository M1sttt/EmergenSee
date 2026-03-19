import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { usersService } from '../../services/usersService';
import { departmentsService } from '../../services/departmentsService';
import { User, UpdateUserDto, UserRole } from '@emergensee/shared';
import { useAuthStore } from '../../store/authStore';

interface UserFormProps {
  user?: User | null;
  onClose: () => void;
}

export default function UserForm({ user, onClose }: UserFormProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const { data: allDepartmentsResponse } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: departmentsService.getAll,
  });
  const allDepartments: any[] = Array.isArray(allDepartmentsResponse) ? allDepartmentsResponse : (allDepartmentsResponse?.data || []);

  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;

  const managedDepartments = isGlobalAdmin
    ? allDepartments
    : allDepartments.filter(d => d.admins?.includes(currentUser?.id));

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: user ? {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      departments: user.departments || [],
    } : {
      role: isGlobalAdmin ? undefined : UserRole.MEMBER,
      departments: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const onSubmit = (data: any) => {
    let finalDepartments = data.departments || [];
    if (!isGlobalAdmin && user?.departments) {
      // Merge back departments that the user had but current user couldn't manage/see
      const unmanagedUserDepts = user.departments.filter(deptId => !managedDepartments.some(d => (d.id || d._id) === deptId));
      finalDepartments = Array.from(new Set([...finalDepartments, ...unmanagedUserDepts]));
    }
    data.departments = finalDepartments;

    if (!isGlobalAdmin && !user) {
      data.role = UserRole.MEMBER;
    }

    if (user) {
      const updateData: UpdateUserDto = { ...data };
      delete (updateData as any).password; // Don't send password on update
      updateMutation.mutate({ id: user.id || (user as any)._id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {user ? 'Edit User' : 'Create User'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message as string}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email', { required: 'Email is required' })}
              type="email"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>
            )}
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...register('password', { required: !user ? 'Password is required' : false })}
                type="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>
              )}
            </div>
          )}

          {isGlobalAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register('role', { required: 'Role is required' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select role</option>
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                {...register('phoneNumber')}
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Departments</label>
              <select
                multiple
                {...register('departments')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-24"
              >
                {managedDepartments.map((dept: any) => (
                  <option key={dept.id || dept._id} value={dept.id || dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
