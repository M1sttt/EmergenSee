import React, { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from 'store/authStore';
import { User, USER_ROLE_LABELS, Department } from '@emergensee/shared';
import UserForm from 'components/users/UserForm';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { ActionIcon } from '@/components/common/ActionIcon';
import GenericTable, { type GenericTableColumn } from '@/components/common/GenericTable';
import SelectDropdown from '@/components/SelectDropdown';
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
	const [userToDelete, setUserToDelete] = useState<string | null>(null);

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

	const availableDepartments = isAdmin ? departments : myAdminDepartments;
	const departmentOptions = useMemo(
		() => [
			{ value: consts.allDeptsId, label: strings.allDepartments },
			...availableDepartments.map((department: Department) => ({
				value: (department.id || (department as unknown as { _id?: string })._id || '') as string,
				label: department.name,
			})),
		],
		[availableDepartments],
	);
	const displayedUsers = useMemo(() => utils.filterUsers(users, selectedDeptId), [users, selectedDeptId]);

	const userColumns = useMemo<GenericTableColumn<User>[]>(() => {
		const columns: GenericTableColumn<User>[] = [
			{
				id: 'name',
				header: strings.columnName,
				renderCell: user => (
					<div
						className={`text-sm font-medium text-gray-900 truncate ${consts.nameColMaxWidthClass}`}
						title={`${user.firstName} ${user.lastName}`}
					>
						{user.firstName} {user.lastName}
					</div>
				),
			},
			{
				id: 'email',
				header: strings.columnEmail,
				renderCell: user => (
					<div
						className={`text-sm text-gray-900 truncate ${consts.emailColMaxWidthClass}`}
						title={user.email}
					>
						{user.email}
					</div>
				),
			},
			{
				id: 'role',
				header: strings.columnRole,
				renderCell: user => (
					<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
						{USER_ROLE_LABELS[user.role]}
					</span>
				),
			},
			{
				id: 'status',
				header: strings.columnStatus,
				renderCell: user => {
					const statusColors = utils.getStatusColors(user.status);
					return (
						<span
							className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}
						>
							{user.status}
						</span>
					);
				},
			},
			{
				id: 'phone',
				header: strings.columnPhoneNumber,
				renderCell: user => <div className="text-sm text-gray-900">{user.phoneNumber || strings.emptyPhone}</div>,
			},
		];

		if (canCreateUser) {
			columns.push({
				id: 'actions',
				header: strings.columnActions,
				headerClassName: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
				cellClassName: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium',
				renderCell: user => {
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
						<>
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
						</>
					);
				},
			});
		}

		return columns;
	}, [canCreateUser, currentUser?.id, handleDelete, handleEdit, isAdmin, myAdminDepartments]);

	const isLoading = isLoadingUsers || isLoadingDepartments;

	if (isErrorUsers || isErrorDepts) {
		return <div className="p-6 text-red-600">{strings.error}</div>;
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-6">
					<h1 className="text-3xl font-bold text-gray-900">{strings.title}</h1>
					<SelectDropdown
						value={selectedDeptId}
						onChange={value =>
							setSelectedDeptId(Array.isArray(value) || !value ? consts.allDeptsId : value)
						}
						options={departmentOptions}
						placeholder={strings.selectDepartment}
						isSearchable
						isClearable={false}
						noOptionsMessage={() => strings.noDepartments}
						containerClassName="w-64"
					/>
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

			<GenericTable
				columns={userColumns}
				rows={displayedUsers}
				getRowKey={user => (user.id || (user as unknown as { _id?: string })._id || user.email) as string}
				isLoading={isLoading}
				loadingContent={
					<div className="py-8">
						<Loader />
					</div>
				}
				emptyContent={strings.noUsersFound}
			/>

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
