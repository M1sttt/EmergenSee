import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from 'services/usersService';
import { departmentsService } from 'services/departmentsService';
import { useAuthStore } from 'store/authStore';
import { User, USER_ROLE_LABELS, Department } from '@emergensee/shared';
import UserForm from 'components/users/UserForm';
import { FiEdit, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { STRINGS } from './strings';
import { CONSTS } from './consts';
import { isGlobalAdmin, getAdminDepartments, filterDepartments, filterUsers, getStatusColors } from './utils';
import { Loader } from '@/components/common/Loader';

const UsersPage = () => {
	const queryClient = useQueryClient();
	const currentUser = useAuthStore(state => state.user);

	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedDeptId, setSelectedDeptId] = useState<string>(CONSTS.ALL_DEPTS_ID);
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
		data: usersData,
		isLoading: isLoadingUsers,
		isError: isErrorUsers,
	} = useQuery<User[]>({
		queryKey: ['users'],
		queryFn: () => usersService.getAll(),
	});

	const users = usersData ?? [];

	const {
		data: departmentsData,
		isLoading: isLoadingDepartments,
		isError: isErrorDepts,
	} = useQuery<{ data: Department[] } | Department[]>({
		queryKey: ['departments'],
		queryFn: departmentsService.getAll,
	});

	const departments = useMemo(() => {
		return Array.isArray(departmentsData) ? departmentsData : (departmentsData?.data ?? []);
	}, [departmentsData]);

	const isAdmin = isGlobalAdmin(currentUser?.role);
	const myAdminDepartments = useMemo(
		() => getAdminDepartments(departments, currentUser?.id),
		[departments, currentUser?.id],
	);
	const isDepartmentAdmin = myAdminDepartments.length > 0;
	const canCreateUser = isAdmin || isDepartmentAdmin;

	const deleteMutation = useMutation({
		mutationFn: (id: string) => usersService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
		},
	});

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
		() => filterDepartments(availableDepartments, deptSearchTerm),
		[availableDepartments, deptSearchTerm],
	);
	const displayedUsers = useMemo(() => filterUsers(users, selectedDeptId), [users, selectedDeptId]);

	const isLoading = isLoadingUsers || isLoadingDepartments;

	if (isErrorUsers || isErrorDepts) {
		return <div className="p-6 text-red-600">{STRINGS.ERROR}</div>;
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-6">
					<h1 className="text-3xl font-bold text-gray-900">{STRINGS.TITLE}</h1>
					<div className="relative w-64" ref={dropdownRef}>
						<div
							className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex justify-between items-center hover:bg-gray-50 transition-colors"
							onClick={toggleDropdown}
						>
							<span className="truncate text-sm font-medium text-gray-700">
								{selectedDeptId === CONSTS.ALL_DEPTS_ID
									? STRINGS.ALL_DEPARTMENTS
									: availableDepartments.find(
										(d: Department) => (d.id || (d as unknown as { _id?: string })._id) === selectedDeptId,
									)?.name || STRINGS.SELECT_DEPARTMENT}
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
										placeholder={STRINGS.SEARCH_DEPARTMENTS}
										className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
										value={deptSearchTerm}
										onChange={e => setDeptSearchTerm(e.target.value)}
										onClick={e => e.stopPropagation()}
									/>
								</div>
								<ul className="max-h-60 overflow-y-auto">
									<li
										className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedDeptId === CONSTS.ALL_DEPTS_ID ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
										onClick={() => {
											setSelectedDeptId(CONSTS.ALL_DEPTS_ID);
											setIsDeptDropdownOpen(false);
											setDeptSearchTerm('');
										}}
									>
										{STRINGS.ALL_DEPARTMENTS}
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
											{STRINGS.NO_DEPARTMENTS}
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
						{STRINGS.CREATE_USER}
					</button>
				)}
			</div>

			<div className="bg-white rounded-lg shadow overflow-hidden">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{STRINGS.COLUMNS.NAME}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{STRINGS.COLUMNS.EMAIL}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{STRINGS.COLUMNS.ROLE}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{STRINGS.COLUMNS.STATUS}
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								{STRINGS.COLUMNS.PHONE_NUMBER}
							</th>
							{canCreateUser && (
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									{STRINGS.COLUMNS.ACTIONS}
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
								const statusColors = getStatusColors(user.status);
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
												className={`text-sm font-medium text-gray-900 truncate ${CONSTS.MAX_WIDTH_CLASSES.NAME_COL}`}
												title={`${user.firstName} ${user.lastName}`}
											>
												{user.firstName} {user.lastName}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<div
												className={`text-sm text-gray-900 truncate ${CONSTS.MAX_WIDTH_CLASSES.EMAIL_COL}`}
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
											<div className="text-sm text-gray-900">{user.phoneNumber || STRINGS.EMPTY_PHONE}</div>
										</td>
										{canCreateUser && (
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												{(canEdit || userId === currentUser?.id) && (
													<>
														<button
															onClick={() => handleEdit(user)}
															className="mr-4"
															title={STRINGS.ACTION_EDIT}
														>
															<FiEdit />
														</button>
														{isAdmin && (
															<button
																onClick={() => handleDelete(userId!)}
																className="text-red-600 hover:text-red-900"
																title={STRINGS.ACTION_DELETE}
															>
																<FiTrash2 />
															</button>
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
					message={STRINGS.CONFIRM_DELETE}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>
			)}
		</div>
	);
};

export default React.memo(UsersPage);
