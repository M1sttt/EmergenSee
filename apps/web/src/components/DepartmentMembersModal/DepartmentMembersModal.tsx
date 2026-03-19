import React, { useState, useMemo, useCallback, memo } from 'react';
import { Department } from '@emergensee/shared';
import { FaCheck } from 'react-icons/fa';
import {
	useDepartmentMembersModalUpdateMutation,
	useDepartmentMembersModalUsersQuery,
} from 'hooks/data/useDepartmentMembersModalData';
import { STRINGS } from './strings';
import { CONSTS } from './consts';
import { filterUsers, toggleSelection } from './utils';

interface DepartmentMembersModalProps {
	department: Department;
	onClose: () => void;
}

const DepartmentMembersModal: React.FC<DepartmentMembersModalProps> = ({ department, onClose }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
	const [activeTab, setActiveTab] = useState<typeof CONSTS.TABS.ADD | typeof CONSTS.TABS.REMOVE>(
		CONSTS.TABS.ADD,
	);

	const {
		data: users = [],
		isLoading,
		isError,
	} = useDepartmentMembersModalUsersQuery();

	const displayedUsers = useMemo(
		() => filterUsers(users, department.id, activeTab, searchQuery),
		[users, department.id, activeTab, searchQuery],
	);

	const handleToggleUser = useCallback((userId: string) => {
		setSelectedUserIds(prev => toggleSelection(prev, userId));
	}, []);

	const handleTabChangeAdd = useCallback(() => {
		setActiveTab(CONSTS.TABS.ADD);
		setSelectedUserIds(new Set());
	}, []);

	const handleTabChangeRemove = useCallback(() => {
		setActiveTab(CONSTS.TABS.REMOVE);
		setSelectedUserIds(new Set());
	}, []);

	const updateMutation = useDepartmentMembersModalUpdateMutation();

	return (
		<div className={CONSTS.CLASSES.MODAL_CONTAINER}>
			<div className={CONSTS.CLASSES.MODAL_WRAPPER}>
				<div className={CONSTS.CLASSES.OVERLAY} onClick={onClose} />

				<div className={CONSTS.CLASSES.MODAL_CONTENT}>
					<div className={CONSTS.CLASSES.HEADER}>
						<h3 className={CONSTS.CLASSES.TITLE}>
							{STRINGS.MANAGE_MEMBERS} {department.name}
						</h3>

						<div className={CONSTS.CLASSES.TAB_CONTAINER}>
							<button
								className={`${CONSTS.CLASSES.TAB_BASE} ${activeTab === CONSTS.TABS.ADD ? CONSTS.CLASSES.TAB_ACTIVE : CONSTS.CLASSES.TAB_INACTIVE}`}
								onClick={handleTabChangeAdd}
							>
								{STRINGS.ADD_MEMBERS}
							</button>
							<button
								className={`${CONSTS.CLASSES.TAB_BASE} ${activeTab === CONSTS.TABS.REMOVE ? CONSTS.CLASSES.TAB_ACTIVE : CONSTS.CLASSES.TAB_INACTIVE}`}
								onClick={handleTabChangeRemove}
							>
								{STRINGS.REMOVE_MEMBERS}
							</button>
						</div>

						<input
							type="text"
							placeholder={STRINGS.SEARCH_PLACEHOLDER}
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className={CONSTS.CLASSES.SEARCH_INPUT}
						/>
					</div>

					<div className={CONSTS.CLASSES.LIST_CONTAINER}>
						{isLoading ? (
							<div className="text-center py-4 text-gray-500">{STRINGS.LOADING_USERS}</div>
						) : isError ? (
							<div className="text-center py-4 text-red-500">{STRINGS.ERROR}</div>
						) : displayedUsers.length === 0 ? (
							<div className="text-center py-4 text-gray-500">{STRINGS.NO_USERS_FOUND}</div>
						) : (
							<ul className="space-y-2">
								{displayedUsers.map(user => {
									const isSelected = selectedUserIds.has(user.id);
									return (
										<li
											key={user.id}
											onClick={() => handleToggleUser(user.id)}
											className={`${CONSTS.CLASSES.LIST_ITEM_BASE} ${isSelected ? CONSTS.CLASSES.LIST_ITEM_SELECTED : CONSTS.CLASSES.LIST_ITEM_UNSELECTED}`}
										>
											<div>
												<p className={CONSTS.CLASSES.USER_NAME}>
													{user.firstName} {user.lastName}
												</p>
												<p className={CONSTS.CLASSES.USER_EMAIL}>{user.email}</p>
											</div>
											<div
												className={`${CONSTS.CLASSES.CHECKBOX_BASE} ${isSelected ? CONSTS.CLASSES.CHECKBOX_SELECTED : CONSTS.CLASSES.CHECKBOX_UNSELECTED}`}
											>
												{isSelected && <FaCheck className="w-3 h-3" />}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<div className={CONSTS.CLASSES.FOOTER}>
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
							className={`${CONSTS.CLASSES.BTN_PRIMARY} ${activeTab === CONSTS.TABS.ADD ? CONSTS.CLASSES.BTN_ADD : CONSTS.CLASSES.BTN_REMOVE}`}
						>
							{updateMutation.isPending
								? STRINGS.PROCESSING
								: activeTab === CONSTS.TABS.ADD
									? `${STRINGS.ADD_SELECTED} (${selectedUserIds.size})`
									: `${STRINGS.REMOVE_SELECTED} (${selectedUserIds.size})`}
						</button>
						<button onClick={onClose} className={CONSTS.CLASSES.BTN_CLOSE}>
							{STRINGS.CLOSE}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default memo(DepartmentMembersModal);
