import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Department } from '@emergensee/shared';
import { usersService } from '../../services/usersService';

interface DepartmentMembersModalProps {
    department: Department;
    onClose: () => void;
}

export default function DepartmentMembersModal({ department, onClose }: DepartmentMembersModalProps) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: usersService.getAll,
    });

    // Derived members based on user's departments array
    const currentMembers = useMemo(() => {
        return users.filter(u => u.departments?.includes(department.id));
    }, [users, department.id]);

    const currentMemberIds = useMemo(() => {
        return new Set(currentMembers.map(m => m.id));
    }, [currentMembers]);

    // Filtered users for 'Add' tab (not already in department)
    const availableUsersToAdd = useMemo(() => {
        return users.filter(u => !currentMemberIds.has(u.id));
    }, [users, currentMemberIds]);

    // Filter based on search query
    const displayedUsers = useMemo(() => {
        const list = activeTab === 'add' ? availableUsersToAdd : currentMembers;
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(u =>
            (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [activeTab, availableUsersToAdd, currentMembers, searchQuery]);

    const toggleUserSelection = (userId: string) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        setSelectedUserIds(newSet);
    };

    const updateMutation = useMutation({
        mutationFn: async () => {
            const promises = Array.from(selectedUserIds).map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return Promise.resolve();

                let updatedDepartments = [...(user.departments || [])];

                if (activeTab === 'add') {
                    if (!updatedDepartments.includes(department.id)) {
                        updatedDepartments.push(department.id);
                    }
                } else {
                    updatedDepartments = updatedDepartments.filter(id => id !== department.id);
                }

                return usersService.update(userId, { departments: updatedDepartments });
            });
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSelectedUserIds(new Set());
            setSearchQuery('');
        },
    });

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl flex flex-col max-h-[80vh]">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex-none border-b border-gray-200">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                            Manage Members: {department.name}
                        </h3>

                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'add' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => { setActiveTab('add'); setSelectedUserIds(new Set()); }}
                            >
                                Add Members
                            </button>
                            <button
                                className={`py-2 px-4 font-medium text-sm border-b-2 ${activeTab === 'remove' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                onClick={() => { setActiveTab('remove'); setSelectedUserIds(new Set()); }}
                            >
                                Remove Members
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        {isLoading ? (
                            <div className="text-center py-4 text-gray-500">Loading users...</div>
                        ) : displayedUsers.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">No users found.</div>
                        ) : (
                            <ul className="space-y-2">
                                {displayedUsers.map(user => (
                                    <li
                                        key={user.id}
                                        onClick={() => toggleUserSelection(user.id)}
                                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer border transition-colors ${selectedUserIds.has(user.id)
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center ${selectedUserIds.has(user.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                                            }`}>
                                            {selectedUserIds.has(user.id) && '✓'}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 flex-none border-t border-gray-200">
                        <button
                            onClick={() => updateMutation.mutate()}
                            disabled={selectedUserIds.size === 0 || updateMutation.isPending}
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${activeTab === 'add' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'
                                } disabled:opacity-50`}
                        >
                            {updateMutation.isPending
                                ? 'Processing...'
                                : activeTab === 'add'
                                    ? `Add Selected (${selectedUserIds.size})`
                                    : `Remove Selected (${selectedUserIds.size})`
                            }
                        </button>
                        <button
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
