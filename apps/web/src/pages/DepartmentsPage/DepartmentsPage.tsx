import React, { useState, useMemo, useCallback } from 'react';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { Department } from '@emergensee/shared';
import DepartmentForm from '@/components/DepartmentForm';
import DepartmentMembersModal from '@/components/DepartmentMembersModal';
import { Loader } from '@/components/common/Loader';
import { useAuthStore } from 'store/authStore';

import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
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
        return <div className={consts.errorTextClass}>{strings.error}</div>;
    }

    return (
        <div className={consts.pageContainerClass}>
            <div className={consts.headerWrapperClass}>
                <h1 className={consts.pageTitleClass}>{strings.pageTitle}</h1>
                <div className={consts.searchContainerClass}>
                    <input
                        type="text"
                        placeholder={strings.searchPlaceholder}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={consts.searchInputClass}
                    />
                    {currentUser?.role === UserRole.ADMIN && (
                        <button onClick={handleCreateClick} className={consts.createButtonClass}>
                            {strings.createButton}
                        </button>
                    )}
                </div>
            </div>

            <div className={consts.tableContainerClass}>
                <table className={consts.tableClass}>
                    <thead className={consts.theadClass}>
                        <tr>
                            <th className={consts.thClass}>Name</th>
                            <th className={consts.thClass}>Description</th>
                            <th className={consts.thClass}>Admins</th>
                            <th className={consts.thLastClass}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className={consts.tbodyClass}>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="py-8">
                                    <Loader />
                                </td>
                            </tr>
                        ) : filteredDepartments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={consts.emptyRowClass}>
                                    {strings.noDepartments}
                                </td>
                            </tr>
                        ) : (
                            filteredDepartments.map(department => {
                                const isAdmin = utils.checkIsAdmin(department, currentUser);
                                const adminsDisplay = utils.formatAdmins(department.admins, users);

                                return (
                                    <tr key={department.id}>
                                        <td className={consts.tdClass}>
                                            <div className={consts.tdTextClass} title={department.name}>
                                                {department.name}
                                            </div>
                                        </td>
                                        <td className={consts.tdClass}>
                                            <div className={consts.tdDescClass} title={department.description}>
                                                {department.description}
                                            </div>
                                        </td>
                                        <td className={consts.tdClass}>
                                            <div className={consts.tdAdminsClass} title={adminsDisplay}>
                                                {adminsDisplay}
                                            </div>
                                        </td>
                                        <td className={consts.tdActionsClass}>
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
                    message={strings.confirmDelete}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </div>
    );
};

export default React.memo(DepartmentsPage);
