import React, { useState, useMemo, useCallback } from 'react';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { Department } from '@emergensee/shared';
import DepartmentForm from '@/components/DepartmentForm';
import DepartmentMembersModal from '@/components/DepartmentMembersModal';
import { Loader } from '@/components/common/Loader';
import { useAuthStore } from 'store/authStore';

import { STRINGS } from './strings';
import { CLASSES } from './consts';
import { filterDepartments, formatAdmins, checkIsAdmin } from './utils';
import { ActionIcon } from '@/components/common/ActionIcon';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { UserRole } from '@emergensee/shared';
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

    const {
        data: departments = [],
        isLoading,
        isError,
    } = useDepartmentsPageDepartmentsQuery();

    const { data: users = [] } = useDepartmentsPageUsersQuery();

    const filteredDepartments = useMemo(
        () => filterDepartments(departments, searchQuery),
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

    const handleDelete = useCallback(
        (id: string) => {
            setDepartmentToDelete(id);
        },
        [],
    );

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
                    {currentUser?.role === UserRole.ADMIN && (
                        <button onClick={handleCreateClick} className={CLASSES.CREATE_BUTTON}>
                            {STRINGS.CREATE_BUTTON}
                        </button>
                    )}
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
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="py-8">
                                    <Loader />
                                </td>
                            </tr>
                        ) : filteredDepartments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={CLASSES.EMPTY_ROW}>
                                    {STRINGS.NO_DEPARTMENTS}
                                </td>
                            </tr>
                        ) : (
                            filteredDepartments.map(department => {
                                const isAdmin = checkIsAdmin(department, currentUser);
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
                                                <div className="flex justify-end gap-2">
                                                    <ActionIcon
                                                        onClick={() => handleManageMembers(department)}
                                                        className="text-blue-600"
                                                        tooltipText="Manage Members"
                                                    >
                                                        <FiUsers size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        onClick={() => handleEdit(department)}
                                                        className="text-blue-600"
                                                        tooltipText="Edit"
                                                    >
                                                        <FiEdit size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        onClick={() => handleDelete(department.id)}
                                                        className="text-red-600"
                                                        tooltipText="Delete"
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </ActionIcon>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && <DepartmentForm department={selectedDepartment} onClose={handleCloseModals} />}

            {isMembersModalOpen && selectedDepartment && (
                <DepartmentMembersModal department={selectedDepartment} onClose={handleCloseModals} />
            )}

            {departmentToDelete !== null && (
                <ConfirmModal
                    message={STRINGS.CONFIRM_DELETE}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
};

export default React.memo(DepartmentsPage);
