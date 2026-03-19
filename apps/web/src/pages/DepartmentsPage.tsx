import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsService } from '../services/departmentsService';
import { usersService } from '../services/usersService';
import { Department } from '@emergensee/shared';
import DepartmentForm from '../components/departments/DepartmentForm';
import DepartmentMembersModal from '../components/departments/DepartmentMembersModal';
import { useAuthStore } from '../store/authStore';

export default function DepartmentsPage() {
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((state) => state.user);

    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: departments = [], isLoading } = useQuery({
        queryKey: ['departments'],
        queryFn: departmentsService.getAll,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: usersService.getAll,
    });

    const filteredDepartments = useMemo(() => {
        if (!searchQuery.trim()) return departments;
        const lowerQuery = searchQuery.toLowerCase();
        return departments.filter(dep =>
            dep.name.toLowerCase().includes(lowerQuery) ||
            dep.description.toLowerCase().includes(lowerQuery)
        );
    }, [departments, searchQuery]);

    const deleteMutation = useMutation({
        mutationFn: departmentsService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
        },
    });

    const handleEdit = (department: Department) => {
        setSelectedDepartment(department);
        setIsFormOpen(true);
    };

    const handleManageMembers = (department: Department) => {
        setSelectedDepartment(department);
        setIsMembersModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCloseModals = () => {
        setIsFormOpen(false);
        setIsMembersModalOpen(false);
        setSelectedDepartment(null);
    };

    if (isLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
                <div className="flex gap-4 w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Search departments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    >
                        Create Department
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Admins
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDepartments.map((department) => {
                            const isAdmin = currentUser && department.admins?.includes(currentUser.id);

                            const adminsDisplay = department.admins?.length
                                ? department.admins.map(id => {
                                    const user = users.find(u => u.id === id || (u as any)._id === id);
                                    return user ? `${user.firstName}(${id})` : `Unknown(${id})`;
                                }).join(', ')
                                : 'No Admins';

                            return (
                                <tr key={department.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={department.name}>{department.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 truncate max-w-[200px]" title={department.description}>{department.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 truncate max-w-[250px]" title={adminsDisplay}>{adminsDisplay}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {isAdmin && (
                                            <>
                                                <button
                                                    onClick={() => handleManageMembers(department)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    title="Manage Members"
                                                >
                                                    👥
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(department)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(department.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredDepartments.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No departments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <DepartmentForm
                    department={selectedDepartment}
                    onClose={handleCloseModals}
                />
            )}

            {isMembersModalOpen && selectedDepartment && (
                <DepartmentMembersModal
                    department={selectedDepartment}
                    onClose={handleCloseModals}
                />
            )}
        </div>
    );
}
