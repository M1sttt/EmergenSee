import React, { useState, useMemo, useCallback, memo } from 'react';
import { Department } from '@emergensee/shared';
import { FaCheck } from 'react-icons/fa';
import { Button, Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import {
	useDepartmentMembersModalUpdateMutation,
	useDepartmentMembersModalUsersQuery,
} from 'hooks/data/useDepartmentMembersModalData';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

interface DepartmentMembersModalProps {
	department: Department;
	departments: Department[];
	onClose: () => void;
}

const DepartmentMembersModal: React.FC<DepartmentMembersModalProps> = ({ department, departments, onClose }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
	const [activeTab, setActiveTab] = useState<typeof consts.addTab | typeof consts.removeTab>(consts.addTab);

	const { data: users = [], isLoading, isError } = useDepartmentMembersModalUsersQuery();

	const displayedMembers = useMemo(
		() => utils.getDisplayedMembers(users, department.id, departments, activeTab, searchQuery),
		[users, department.id, departments, activeTab, searchQuery],
	);

	const handleToggleUser = useCallback((userId: string) => {
		setSelectedUserIds(prev => utils.toggleSelection(prev, userId));
	}, []);

	const handleTabChangeAdd = useCallback(() => {
		setActiveTab(consts.addTab);
		setSelectedUserIds(new Set());
	}, []);

	const handleTabChangeRemove = useCallback(() => {
		setActiveTab(consts.removeTab);
		setSelectedUserIds(new Set());
	}, []);

	const updateMutation = useDepartmentMembersModalUpdateMutation();

	return (
		<div className="ui-modal-root">
			<div className="ui-modal-center">
				<div className="ui-modal-backdrop" onClick={onClose} />

				<div className="ui-modal-panel ui-modal-panel-xl z-10 flex max-h-[80vh] flex-col">
					<div className="ui-modal-header flex-none border-b border-gray-200">
						<h3 className="mb-2 text-lg font-semibold leading-6 text-gray-900">
							{strings.manageMembers} {department.name}
						</h3>

						<div className="mb-4 flex border-b border-gray-200">
							<button
								className={cn(
									'border-b-2 px-4 py-2 text-sm font-medium',
									activeTab === consts.addTab
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700',
								)}
								onClick={handleTabChangeAdd}
							>
								{strings.addMembers}
							</button>
							<button
								className={cn(
									'border-b-2 px-4 py-2 text-sm font-medium',
									activeTab === consts.removeTab
										? 'border-blue-500 text-blue-600'
										: 'border-transparent text-gray-500 hover:text-gray-700',
								)}
								onClick={handleTabChangeRemove}
							>
								{strings.removeMembers}
							</button>
						</div>

						<Input
							type="text"
							placeholder={strings.searchPlaceholder}
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className="mt-0"
						/>
					</div>

					<div className="flex-1 overflow-y-auto bg-gray-50 p-4">
						{isLoading ? (
							<div className="text-center py-4 text-gray-500">{strings.loadingUsers}</div>
						) : isError ? (
							<div className="text-center py-4 text-red-500">{strings.errorText}</div>
						) : displayedMembers.length === 0 ? (
							<div className="text-center py-4 text-gray-500">{strings.noUsersFound}</div>
						) : (
							<ul className="space-y-2">
								{displayedMembers.map(({ user, selectable, viaDepartmentName }) => {
									const isSelected = selectedUserIds.has(user.id);
									return (
										<li
											key={user.id}
											onClick={() => selectable && handleToggleUser(user.id)}
											className={cn(
												'flex items-center justify-between rounded-md border p-3 transition-colors',
												!selectable && 'cursor-default opacity-70',
												selectable && 'cursor-pointer',
												isSelected
													? 'border-blue-200 bg-blue-50'
													: 'border-gray-200 bg-white hover:bg-gray-50',
											)}
										>
											<div>
												<p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
													{user.firstName} {user.lastName}
													{viaDepartmentName && (
														<span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
															{strings.viaSubDepartment(viaDepartmentName)}
														</span>
													)}
												</p>
												<p className="text-xs text-gray-500">{user.email}</p>
											</div>
											{selectable && (
												<div
													className={cn(
														'flex h-5 w-5 items-center justify-center rounded-sm border',
														isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300',
													)}
												>
													{isSelected && <FaCheck className="w-3 h-3" />}
												</div>
											)}
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<div className="ui-modal-footer flex-none border-t border-gray-200">
						<Button
							onClick={() =>
								updateMutation.mutate(
									{
										selectedUserIds,
										users,
										departmentId: department.id,
										activeTab,
									},
									{
										onSuccess: () => {
											setSelectedUserIds(new Set());
											setSearchQuery('');
											onClose();
										},
									},
								)
							}
							disabled={selectedUserIds.size === 0 || updateMutation.isPending}
							variant={activeTab === consts.addTab ? 'primary' : 'danger'}
							size="md"
							className="w-full sm:ml-3 sm:w-auto"
						>
							{updateMutation.isPending
								? strings.processing
								: activeTab === consts.addTab
									? `${strings.addSelected} (${selectedUserIds.size})`
									: `${strings.removeSelected} (${selectedUserIds.size})`}
						</Button>
						<Button onClick={onClose} variant="secondary" size="md" className="mt-3 w-full sm:mt-0 sm:w-auto">
							{strings.closeText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(DepartmentMembersModal);
