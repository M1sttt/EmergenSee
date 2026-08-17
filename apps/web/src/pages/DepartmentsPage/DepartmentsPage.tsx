import React, { useState, useMemo, useCallback } from 'react';
import { FiEdit, FiTrash2, FiUsers, FiCornerDownRight } from 'react-icons/fi';
import { Department, UserRole } from '@emergensee/shared';
import DepartmentForm from '@/components/DepartmentForm';
import DepartmentMembersModal from '@/components/DepartmentMembersModal';
import { Loader } from '@/components/common/Loader';
import { useAuthStore } from 'store/authStore';
import { Button, Input } from '@/components/ui';

import * as strings from './strings';
import * as utils from './utils';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
	useDepartmentsPageDepartmentsQuery,
	useDepartmentsPageDeleteMutation,
	useDepartmentsPageUsersQuery,
} from 'hooks/data/useDepartmentsPageData';

const DepartmentsPage: React.FC = () => {
	const currentUser = useAuthStore(state => state.user);

	const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(null);

	const { data: departments = [], isLoading, isError } = useDepartmentsPageDepartmentsQuery();

	const { data: users = [] } = useDepartmentsPageUsersQuery();

	const filteredDepartments = useMemo(
		() => utils.filterDepartments(departments, searchQuery),
		[departments, searchQuery],
	);

	const deleteMutation = useDepartmentsPageDeleteMutation();

	const handleEdit = useCallback((department: Department) => {
		setSelectedDepartment(department);
		setIsFormOpen(true);
	}, []);

	const handleManageMembers = useCallback((department: Department) => {
		setSelectedDepartment(department);
		setIsMembersModalOpen(true);
	}, []);

	const handleDelete = useCallback((id: string) => {
		setDepartmentToDelete(id);
	}, []);

	const confirmDelete = useCallback(() => {
		if (departmentToDelete) {
			deleteMutation.mutate(departmentToDelete);
			setDepartmentToDelete(null);
		}
	}, [deleteMutation, departmentToDelete]);

	const cancelDelete = useCallback(() => {
		setDepartmentToDelete(null);
	}, []);

	const handleCloseModals = useCallback(() => {
		setIsFormOpen(false);
		setIsMembersModalOpen(false);
		setSelectedDepartment(null);
	}, []);

	const handleCreateClick = useCallback(() => {
		setIsFormOpen(true);
	}, []);

	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	}, []);

	if (isError) {
		return <div className="ui-page py-4 text-center text-red-500">{strings.error}</div>;
	}

	return (
		<div className="ui-page">
			<div className="mb-6 flex flex-col items-start gap-4 lg:flex-row lg:items-center">
				<h1 className="ui-page-title">{strings.pageTitle}</h1>
				<div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 lg:ml-auto lg:max-w-md">
					<Input
						type="text"
						placeholder={strings.searchPlaceholder}
						value={searchQuery}
						onChange={handleSearchChange}
						className="mt-0 min-w-0 w-full rounded-lg"
					/>
					{currentUser?.role === UserRole.ADMIN && (
						<Button
							onClick={handleCreateClick}
							variant="primary"
							size="md"
							className="shrink-0 whitespace-nowrap rounded-lg"
						>
							{strings.createButton}
						</Button>
					)}
				</div>
			</div>

			{isLoading ? (
				<div className="ui-loading-state">
					<Loader />
				</div>
			) : filteredDepartments.length === 0 ? (
				<p className="py-8 text-center text-sm text-gray-500">{strings.noDepartments}</p>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredDepartments.map(department => {
						const canManage = utils.checkIsAdmin(department, currentUser);
						const adminsDisplay = utils.formatAdmins(department.admins, users);
						const isSubDept = utils.isSubDepartment(department, departments);
						const subDeptNames = (department.subDepartments ?? [])
							.map(id => departments.find(d => d.id === id)?.name)
							.filter(Boolean) as string[];
						return (
							<div
								key={department.id}
								className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
							>
								<div>
									<div className="flex items-center gap-1.5">
										<p className="text-base font-semibold text-gray-900 leading-tight">{department.name}</p>
										{isSubDept && (
											<span
												title={strings.subDepartmentBadge}
												className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
											>
												<FiCornerDownRight size={10} /> {strings.subDepartmentBadge}
											</span>
										)}
									</div>
									{department.description && (
										<p className="mt-0.5 text-xs text-gray-400 leading-snug">{department.description}</p>
									)}
								</div>

								<div className="text-xs text-gray-500">
									<span className="font-medium text-gray-600">{strings.columnAdmins}: </span>
									{adminsDisplay}
								</div>

								{subDeptNames.length > 0 && (
									<div className="flex flex-wrap gap-1">
										{subDeptNames.map(name => (
											<span
												key={name}
												className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
											>
												{name}
											</span>
										))}
									</div>
								)}

								{canManage && (
									<div className="flex flex-col gap-2 border-t border-gray-100 pt-2">
										<button
											onClick={() => handleManageMembers(department)}
											className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
										>
											<FiUsers size={13} /> {strings.tooltipManageMembers}
										</button>
										<div className="flex gap-2">
											<button
												onClick={() => handleEdit(department)}
												className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
											>
												<FiEdit size={13} /> {strings.tooltipEdit}
											</button>
											<button
												onClick={() => handleDelete(department.id)}
												className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
											>
												<FiTrash2 size={13} /> {strings.tooltipDelete}
											</button>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{isFormOpen && <DepartmentForm department={selectedDepartment} onClose={handleCloseModals} />}

			{isMembersModalOpen && selectedDepartment && (
				<DepartmentMembersModal department={selectedDepartment} departments={departments} onClose={handleCloseModals} />
			)}

			{departmentToDelete !== null && (
				<ConfirmModal message={strings.confirmDelete} onConfirm={confirmDelete} onCancel={cancelDelete} />
			)}
		</div>
	);
};

export default React.memo(DepartmentsPage);
