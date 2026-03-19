import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/usersService';
import { departmentsService } from '../services/departmentsService';
import { useAuthStore } from '../store/authStore';
import { User, USER_ROLE_LABELS, UserStatus, UserRole } from '@emergensee/shared';
import UserForm from '../components/users/UserForm';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [deptSearchTerm, setDeptSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getAll,
  });

  const { data: allDepartmentsResponse, isLoading: isLoadingDepartments } = useQuery<any>({
    queryKey: ['departments'],
    queryFn: departmentsService.getAll,
  });
  const departments: any[] = Array.isArray(allDepartmentsResponse) ? allDepartmentsResponse : (allDepartmentsResponse?.data || []);

  const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
  const myAdminDepartments = departments.filter(d => d.admins?.includes(currentUser?.id));
  const isDepartmentAdmin = myAdminDepartments.length > 0;
  const canCreateUser = isGlobalAdmin || isDepartmentAdmin;

  const deleteMutation = useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  if (isLoadingUsers || isLoadingDepartments) {
    return <div className="p-6">Loading...</div>;
  }

  const availableDepartments = isGlobalAdmin ? departments : myAdminDepartments;
  const filteredDepartments = availableDepartments.filter((d: any) =>
    (d.name || '').toLowerCase().includes(deptSearchTerm.toLowerCase())
  );

  const displayedUsers = users.filter((user: User) => {
    if (selectedDeptId === 'all') return true;
    return user.departments?.some((deptId) => {
      const idStr = typeof deptId === 'string' ? deptId : ((deptId as any)._id || (deptId as any).id);
      return idStr === selectedDeptId;
    });
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>

          <div className="relative w-64" ref={dropdownRef}>
            <div
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
            >
              <span className="truncate text-sm font-medium text-gray-700">
                {selectedDeptId === 'all'
                  ? 'All Departments'
                  : availableDepartments.find(d => (d.id || d._id) === selectedDeptId)?.name || 'Select Department'}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDeptDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isDeptDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Search departments..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={deptSearchTerm}
                    onChange={(e) => setDeptSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  <li
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedDeptId === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedDeptId('all');
                      setIsDeptDropdownOpen(false);
                      setDeptSearchTerm('');
                    }}
                  >
                    All Departments
                  </li>
                  {filteredDepartments.map((dept: any) => {
                    const id = dept.id || dept._id;
                    return (
                      <li
                        key={id}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedDeptId === id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                        onClick={() => {
                          setSelectedDeptId(id);
                          setIsDeptDropdownOpen(false);
                          setDeptSearchTerm('');
                        }}
                      >
                        {dept.name}
                      </li>
                    );
                  })}
                  {filteredDepartments.length === 0 && (
                    <li className="px-4 py-3 text-sm text-gray-500 text-center italic">
                      No departments found
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {canCreateUser && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create User
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              {canCreateUser && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedUsers.map((user: User) => (
              <tr key={user.id || (user as any)._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]" title={`${user.firstName} ${user.lastName}`}>
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 truncate max-w-[200px]" title={user.email}>{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {USER_ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === UserStatus.ACTIVE
                        ? 'bg-green-100 text-green-800'
                        : user.status === UserStatus.INACTIVE
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.phoneNumber || '-'}</div>
                </td>
                {canCreateUser && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {(isGlobalAdmin || (user.departments && user.departments.some(deptId => myAdminDepartments.some(d => (d.id || d._id) === deptId)))) && (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        {isGlobalAdmin && (
                          <button
                            onClick={() => handleDelete(user.id || (user as any)._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <UserForm
          user={selectedUser}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
