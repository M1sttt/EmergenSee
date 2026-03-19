import React, { useState, useMemo, useCallback, memo } from 'react';
import { Department } from '@emergensee/shared';
import { FaCheck } from 'react-icons/fa';
import {
	useDepartmentMembersModalUpdateMutation,
	useDepartmentMembersModalUsersQuery,
} from 'hooks/data/useDepartmentMembersModalData';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

interface DepartmentMembersModalProps {
	department: Department;
	onClose: () => void;
}

const DepartmentMembersModal: React.FC<DepartmentMembersModalProps> = ({ department, onClose }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
	const [activeTab, setActiveTab] = useState<typeof consts.addTab | typeof consts.removeTab>(
		consts.addTab,
	);

	const {
		data: users = [],
		isLoading,
		isError,
	} = useDepartmentMembersModalUsersQuery();

	const displayedUsers = useMemo(
		() => utils.filterUsers(users, department.id, activeTab, searchQuery),
		[users, department.id, activeTab, searchQuery],
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
		<div className={consts.modalContainerClass}>
			<div className={consts.modalWrapperClass}>
				<div className={consts.overlayClass} onClick={onClose} />

				<div className={consts.modalContentClass}>
					<div className={consts.headerClass}>
						<h3 className={consts.titleClass}>
							{strings.manageMembers} {department.name}
						</h3>

						<div className={consts.tabContainerClass}>
							<button
								className={`${consts.tabBaseClass} ${activeTab === consts.addTab ? consts.tabActiveClass : consts.tabInactiveClass}`}
								onClick={handleTabChangeAdd}
							>
								{strings.addMembers}
							</button>
							<button
								className={`${consts.tabBaseClass} ${activeTab === consts.removeTab ? consts.tabActiveClass : consts.tabInactiveClass}`}
								onClick={handleTabChangeRemove}
							>
								{strings.removeMembers}
							</button>
						</div>

						<input
							type="text"
							placeholder={strings.searchPlaceholder}
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className={consts.searchInputClass}
						/>
					</div>

					<div className={consts.listContainerClass}>
						{isLoading ? (
							<div className="text-center py-4 text-gray-500">{strings.loadingUsers}</div>
						) : isError ? (
							<div className="text-center py-4 text-red-500">{strings.errorText}</div>
						) : displayedUsers.length === 0 ? (
							<div className="text-center py-4 text-gray-500">{strings.noUsersFound}</div>
						) : (
							<ul className="space-y-2">
								{displayedUsers.map(user => {
									const isSelected = selectedUserIds.has(user.id);
									return (
										<li
											key={user.id}
											onClick={() => handleToggleUser(user.id)}
											className={`${consts.listItemBaseClass} ${isSelected ? consts.listItemSelectedClass : consts.listItemUnselectedClass}`}
										>
											<div>
												<p className={consts.userNameClass}>
													{user.firstName} {user.lastName}
												</p>
												<p className={consts.userEmailClass}>{user.email}</p>
											</div>
											<div
												className={`${consts.checkboxBaseClass} ${isSelected ? consts.checkboxSelectedClass : consts.checkboxUnselectedClass}`}
											>
												{isSelected && <FaCheck className="w-3 h-3" />}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<div className={consts.footerClass}>
						<button
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
										},
									},
								)
							}
							disabled={selectedUserIds.size === 0 || updateMutation.isPending}
							className={`${consts.btnPrimaryClass} ${activeTab === consts.addTab ? consts.btnAddClass : consts.btnRemoveClass}`}
						>
							{updateMutation.isPending
								? strings.processing
								: activeTab === consts.addTab
									? `${strings.addSelected} (${selectedUserIds.size})`
									: `${strings.removeSelected} (${selectedUserIds.size})`}
						</button>
						<button onClick={onClose} className={consts.btnCloseClass}>
							{strings.closeText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(DepartmentMembersModal);
