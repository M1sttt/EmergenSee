import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from 'store/authStore';
import { User, USER_ROLE_LABELS, Department } from '@emergensee/shared';
import UserForm from 'components/users/UserForm';
import { FiEdit, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionIcon } from '@/components/common/ActionIcon';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
import { Loader } from '@/components/common/Loader';
import {
	useUsersPageDepartmentsQuery,
	useUsersPageDeleteUserMutation,
	useUsersPageUsersQuery,
} from 'hooks/data/useUsersPageData';

const UsersPage = () => {
	const currentUser = useAuthStore(state => state.user);

	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedDeptId, setSelectedDeptId] = useState<string>(consts.allDeptsId);
	const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
	const [deptSearchTerm, setDeptSearchTerm] = useState('');
	const [userToDelete, setUserToDelete] = useState<string | null>(null);

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDeptDropdownOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const {
		data: users = [],
		isLoading: isLoadingUsers,
		isError: isErrorUsers,
	} = useUsersPageUsersQuery();

	const {
		data: departments = [],
		isLoading: isLoadingDepartments,
		isError: isErrorDepts,
	} = useUsersPageDepartmentsQuery();

	const isAdmin = utils.isGlobalAdmin(currentUser?.role);
	const myAdminDepartments = useMemo(
		() => utils.getAdminDepartments(departments, currentUser?.id),
		[departments, currentUser?.id],
	);
	const isDepartmentAdmin = myAdminDepartments.length > 0;
	const canCreateUser = isAdmin || isDepartmentAdmin;

	const deleteMutation = useUsersPageDeleteUserMutation();

	const handleEdit = useCallback((user: User) => {
		setSelectedUser(user);
		setIsFormOpen(true);
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			setUserToDelete(id);
		},
		[],
	);

	const confirmDelete = useCallback(() => {
		if (userToDelete) {
			deleteMutation.mutate(userToDelete);
			setUserToDelete(null);
		}
	}, [deleteMutation, userToDelete]);

	const cancelDelete = useCallback(() => {
		setUserToDelete(null);
	}, []);

	const handleFormClose = useCallback(() => {
		setIsFormOpen(false);
		setSelectedUser(null);
	}, []);

	const toggleDropdown = useCallback(() => setIsDeptDropdownOpen(prev => !prev), []);

	const availableDepartments = isAdmin ? departments : myAdminDepartments;
	const filteredDepts = useMemo(
		() => utils.filterDepartments(availableDepartments, deptSearchTerm),
		[availableDepartments, deptSearchTerm],
	);
	const displayedUsers = useMemo(() => utils.filterUsers(users, selectedDeptId), [users, selectedDeptId]);

	const isLoading = isLoadingUsers || isLoadingDepartments;

	if (isErrorUsers || isErrorDepts) {
		return <div className="p-6 text-red-600">{strings.error}</div>;
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-6">
					<h1 className="text-3xl font-bold text-gray-900">{strings.title}</h1>
					<div className="relative w-64" ref={dropdownRef}>
						<div
							className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
							onClick={toggleDropdown}
						>
							<span className="truncate text-sm font-medium text-gray-700">
								{selectedDeptId === consts.allDeptsId
									? strings.allDepartments
									: availableDepartments.find(
										(d: Department) => (d.id || (d as unknown as { _id?: string })._id) === selectedDeptId,
									)?.name || strings.selectDepartment}
							</span>
							<FiChevronDown
								className={`w-4 h-4 text-gray-400 transition-transform ${isDeptDropdownOpen ? 'transform rotate-180' : ''}`}
							/>
						</div>

						{isDeptDropdownOpen && (
							<div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden">
								<div className="p-2 border-b border-gray-100 bg-gray-50">
									<input
										type="text"
										placeholder={strings.searchDepartments}
										className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										value={deptSearchTerm}
										onChange={e => setDeptSearchTerm(e.target.value)}
										onClick={e => e.stopPropagation()}
									/>
								</div>
								<ul className="max-h-60 overflow-y-auto">
									<li
										className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedDeptId === consts.allDeptsId ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
										onClick={() => {
											setSelectedDeptId(consts.allDeptsId);
											setIsDeptDropdownOpen(false);
											setDeptSearchTerm('');
										}}
									>
										{strings.allDepartments}
									</li>
									{filteredDepts.map((dept: Department) => {
										const id = (dept.id || (dept as unknown as { _id?: string })._id) as string;
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
									{filteredDepts.length === 0 && (
										<li className="px-4 py-3 text-sm text-gray-500 text-center italic">
											{strings.noDepartments}
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
						{strings.createUser}
					</button>
				)}
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnName}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnEmail}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnRole}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnStatus}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{strings.columnPhoneNumber}
							</th>
							{canCreateUser && (
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									{strings.columnActions}
								</th>
							)}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{isLoading ? (
							<tr>
								<td colSpan={canCreateUser ? 6 : 5} className="py-8">
									<Loader />
								</td>
							</tr>
						) : displayedUsers.length === 0 ? (
							<tr>
								<td colSpan={canCreateUser ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
									No users found.
								</td>
							</tr>
						) : (
							displayedUsers.map(user => {
								const statusColors = utils.getStatusColors(user.status);
								const userId = user.id || (user as unknown as { _id?: string })._id;

								const canEdit =
									isAdmin ||
									(user.departments &&
										user.departments.some((deptId: string | Department) =>
											myAdminDepartments.some(
												d =>
													(d.id || (d as unknown as { _id?: string })._id) ===
													(typeof deptId === 'string'
														? deptId
														: (deptId as unknown as { _id?: string })._id || deptId.id),
											),
										));

								return (
									<tr key={userId}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div
												className={`text-sm font-medium text-gray-900 truncate ${consts.nameColMaxWidthClass}`}
												title={`${user.firstName} ${user.lastName}`}
											>
												{user.firstName} {user.lastName}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div
												className={`text-sm text-gray-900 truncate ${consts.emailColMaxWidthClass}`}
												title={user.email}
											>
												{user.email}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
												{USER_ROLE_LABELS[user.role]}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<span
												className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}
											>
												{user.status}
											</span>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{user.phoneNumber || strings.emptyPhone}</div>
										</td>
										{canCreateUser && (
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												{(canEdit || userId === currentUser?.id) && (
													<>
														<ActionIcon
															onClick={() => handleEdit(user)}
															className="mr-2 text-blue-600"
															tooltipText={strings.actionEdit}
														>
															<FiEdit size={16} />
														</ActionIcon>
														{isAdmin && (
															<ActionIcon
																onClick={() => handleDelete(userId!)}
																className="text-red-600"
																tooltipText={strings.actionDelete}
															>
																<FiTrash2 size={16} />
															</ActionIcon>
														)}
													</>
												)}
											</td>
										)}
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{isFormOpen && <UserForm user={selectedUser} onClose={handleFormClose} />}

			{userToDelete !== null && (
				<ConfirmModal
					message={strings.confirmDelete}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>
			)}
		</div>
	);
};

export default React.memo(UsersPage);
