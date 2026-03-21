import React, { useState, useMemo, useCallback } from 'react';
import { FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { Department } from '@emergensee/shared';
import DepartmentForm from '@/components/DepartmentForm';
import DepartmentMembersModal from '@/components/DepartmentMembersModal';
import GenericTable, { type GenericTableColumn } from '@/components/common/GenericTable';
import { Loader } from '@/components/common/Loader';
import { useAuthStore } from 'store/authStore';
import { Button, IconButton, Input } from '@/components/ui';

import * as strings from './strings';
import * as utils from './utils';
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

    const departmentColumns = useMemo<GenericTableColumn<Department>[]>(
        () => [
            {
                id: 'name',
                header: strings.columnName,
                renderCell: department => (
                    <div className="max-w-[150px] truncate text-sm font-medium text-gray-900" title={department.name}>
                        {department.name}
                    </div>
                ),
            },
            {
                id: 'description',
                header: strings.columnDescription,
                renderCell: department => (
                    <div className="max-w-[200px] truncate text-sm text-gray-500" title={department.description}>
                        {department.description}
                    </div>
                ),
            },
            {
                id: 'admins',
                header: strings.columnAdmins,
                renderCell: department => {
                    const adminsDisplay = utils.formatAdmins(department.admins, users);
                    return (
                        <div className="max-w-[250px] truncate text-sm text-gray-500" title={adminsDisplay}>
                            {adminsDisplay}
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: strings.columnActions,
                headerClassName: 'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
                cellClassName: 'px-6 py-4 whitespace-nowrap text-left text-sm font-medium',
                renderCell: department => {
                    const canManageDepartment = utils.checkIsAdmin(department, currentUser);

                    if (!canManageDepartment) return null;

                    return (
                        <div className="flex justify-start gap-2">
                            <IconButton
                                onClick={() => handleManageMembers(department)}
                                className="text-blue-600"
                                tooltipText={strings.tooltipManageMembers}
                            >
                                <FiUsers size={16} />
                            </IconButton>
                            <IconButton
                                onClick={() => handleEdit(department)}
                                className="text-blue-600"
                                tooltipText={strings.tooltipEdit}
                            >
                                <FiEdit size={16} />
                            </IconButton>
                            <IconButton
                                onClick={() => handleDelete(department.id)}
                                className="text-red-600"
                                tooltipText={strings.tooltipDelete}
                            >
                                <FiTrash2 size={16} />
                            </IconButton>
                        </div>
                    );
                },
            },
        ],
        [currentUser, handleDelete, handleEdit, handleManageMembers, users],
    );

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
                        <Button onClick={handleCreateClick} variant="primary" size="md" className="shrink-0 whitespace-nowrap rounded-lg">
                            {strings.createButton}
                        </Button>
                    )}
                </div>
            </div>

            <GenericTable
                columns={departmentColumns}
                rows={filteredDepartments}
                getRowKey={department => department.id}
                isLoading={isLoading}
                loadingContent={
                    <div className="ui-loading-state">
                        <Loader />
                    </div>
                }
                emptyContent={strings.noDepartments}
            />

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
