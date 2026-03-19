import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';
import { Department } from '@emergensee/shared';
import DepartmentForm from '@/components/DepartmentForm';
import DepartmentMembersModal from '@/components/DepartmentMembersModal';
import { useAuthStore } from 'store/authStore';

import { STRINGS } from './strings';
import { CONSTANTS, CLASSES } from './consts';
import { filterDepartments, formatAdmins, checkIsAdmin } from './utils';

const DepartmentsPage: React.FC = () => {
	const queryClient = useQueryClient();
	const currentUser = useAuthStore(state => state.user);

	const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	const {
		data: departments = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: [CONSTANTS.QUERY_KEYS.DEPARTMENTS],
		queryFn: departmentsService.getAll,
	});

	const { data: users = [] } = useQuery({
		queryKey: [CONSTANTS.QUERY_KEYS.USERS],
		queryFn: usersService.getAll,
	});

	const filteredDepartments = useMemo(
		() => filterDepartments(departments, searchQuery),
		[departments, searchQuery],
	);

	const deleteMutation = useMutation({
		mutationFn: departmentsService.delete,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [CONSTANTS.QUERY_KEYS.DEPARTMENTS] });
		},
	});

	const handleEdit = useCallback((department: Department) => {
		setSelectedDepartment(department);
		setIsFormOpen(true);
	}, []);

	const handleManageMembers = useCallback((department: Department) => {
		setSelectedDepartment(department);
		setIsMembersModalOpen(true);
	}, []);

	const handleDelete = useCallback(
		(id: string) => {
			if (window.confirm(STRINGS.CONFIRM_DELETE)) {
				deleteMutation.mutate(id);
			}
		},
		[deleteMutation],
	);

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

	if (isLoading) {
		return <div className={CLASSES.PAGE_CONTAINER}>{STRINGS.LOADING}</div>;
	}

	if (isError) {
		return <div className={CLASSES.ERROR_TEXT}>{STRINGS.ERROR}</div>;
	}

	return (
		<div className={CLASSES.PAGE_CONTAINER}>
			<div className={CLASSES.HEADER_WRAPPER}>
				<h1 className={CLASSES.PAGE_TITLE}>{STRINGS.PAGE_TITLE}</h1>
				<div className={CLASSES.SEARCH_CONTAINER}>
					<input
						type="text"
						placeholder={STRINGS.SEARCH_PLACEHOLDER}
						value={searchQuery}
						onChange={handleSearchChange}
						className={CLASSES.SEARCH_INPUT}
					/>
					<button onClick={handleCreateClick} className={CLASSES.CREATE_BUTTON}>
						{STRINGS.CREATE_BUTTON}
					</button>
				</div>
			</div>

			<div className={CLASSES.TABLE_CONTAINER}>
				<table className={CLASSES.TABLE}>
					<thead className={CLASSES.THEAD}>
						<tr>
							<th className={CLASSES.TH}>Name</th>
							<th className={CLASSES.TH}>Description</th>
							<th className={CLASSES.TH}>Admins</th>
							<th className={CLASSES.TH_LAST}>Actions</th>
						</tr>
					</thead>
					<tbody className={CLASSES.TBODY}>
						{filteredDepartments.map(department => {
							const isAdmin = checkIsAdmin(department, currentUser?.id);
							const adminsDisplay = formatAdmins(department.admins, users);

							return (
								<tr key={department.id}>
									<td className={CLASSES.TD}>
										<div className={CLASSES.TD_TEXT} title={department.name}>
											{department.name}
										</div>
									</td>
									<td className={CLASSES.TD}>
										<div className={CLASSES.TD_DESC} title={department.description}>
											{department.description}
										</div>
									</td>
									<td className={CLASSES.TD}>
										<div className={CLASSES.TD_ADMINS} title={adminsDisplay}>
											{adminsDisplay}
										</div>
									</td>
									<td className={CLASSES.TD_ACTIONS}>
										{isAdmin && (
											<>
												<button
													onClick={() => handleManageMembers(department)}
													className={CLASSES.ACTION_BTN_INFO}
													title="Manage Members"
												>
													<FiUsers />
												</button>
												<button
													onClick={() => handleEdit(department)}
													className={CLASSES.ACTION_BTN_EDIT}
													title="Edit"
												>
													<FiEdit />
												</button>
												<button
													onClick={() => handleDelete(department.id)}
													className={CLASSES.ACTION_BTN_DEL}
													title="Delete"
												>
													<FiTrash2 />
												</button>
											</>
										)}
									</td>
								</tr>
							);
						})}
						{filteredDepartments.length === 0 && (
							<tr>
								<td colSpan={4} className={CLASSES.EMPTY_ROW}>
									{STRINGS.NO_DEPARTMENTS}
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{isFormOpen && <DepartmentForm department={selectedDepartment} onClose={handleCloseModals} />}

			{isMembersModalOpen && selectedDepartment && (
				<DepartmentMembersModal department={selectedDepartment} onClose={handleCloseModals} />
			)}
		</div>
	);
};

export default React.memo(DepartmentsPage);
