import { Department, User } from '@emergensee/shared';
import * as consts from './consts';

export interface MemberEntry {
	user: User;
	// false in the "Remove" tab when the user isn't a direct member of this department, but
	// of one of its (possibly deeply nested) sub-departments — shown for visibility, not
	// selectable, since removal only applies to the department they're actually a direct
	// member of. Always true in the "Add" tab.
	selectable: boolean;
	// Name of the sub-department the user is already a member of, when applicable — shown
	// as an info badge in both tabs.
	viaDepartmentName?: string;
	// Nesting level of viaDepartmentName below this department (1 = direct child, 2 =
	// grandchild, ...). 0 when there's no sub-department relation (direct member, or an
	// Add-tab candidate with no sub-department membership at all).
	depth: number;
}

// BFS over `subDepartments` so members of a sub-department's own sub-department (and so on)
// are still found, with each descendant's minimal nesting depth (1 = direct child).
export const getDescendantDepthMap = (departmentId: string, allDepartments: Department[]): Map<string, number> => {
	const byId = new Map(allDepartments.map(d => [d.id, d]));
	const depthMap = new Map<string, number>();
	let frontier = byId.get(departmentId)?.subDepartments ?? [];
	let depth = 1;

	while (frontier.length) {
		const next: string[] = [];
		for (const id of frontier) {
			if (depthMap.has(id)) continue;
			depthMap.set(id, depth);
			const dep = byId.get(id);
			if (dep?.subDepartments) next.push(...dep.subDepartments);
		}
		frontier = next;
		depth += 1;
	}

	return depthMap;
};

export const getDescendantDepartmentIds = (departmentId: string, allDepartments: Department[]): string[] =>
	Array.from(getDescendantDepthMap(departmentId, allDepartments).keys());

const findVia = (
	user: User,
	depthMap: Map<string, number>,
	byId: Map<string, Department>,
): { name: string; depth: number } | undefined => {
	const viaId = (user.departments || []).find(id => depthMap.has(id));
	if (!viaId) return undefined;
	const name = byId.get(viaId)?.name;
	return name ? { name, depth: depthMap.get(viaId) as number } : undefined;
};

const getAddTabEntries = (users: User[], departmentId: string, allDepartments: Department[]): MemberEntry[] => {
	const depthMap = getDescendantDepthMap(departmentId, allDepartments);
	const byId = new Map(allDepartments.map(d => [d.id, d]));

	return users
		.filter(u => !(u.departments || []).includes(departmentId))
		.map(user => {
			const via = findVia(user, depthMap, byId);
			return { user, selectable: true, viaDepartmentName: via?.name, depth: via?.depth ?? 0 };
		});
};

const getRemoveTabEntries = (users: User[], departmentId: string, allDepartments: Department[]): MemberEntry[] => {
	const depthMap = getDescendantDepthMap(departmentId, allDepartments);
	const byId = new Map(allDepartments.map(d => [d.id, d]));
	const entries: MemberEntry[] = [];

	for (const user of users) {
		const depts = user.departments || [];
		if (depts.includes(departmentId)) {
			entries.push({ user, selectable: true, depth: 0 });
			continue;
		}
		const via = findVia(user, depthMap, byId);
		if (via) {
			entries.push({ user, selectable: false, viaDepartmentName: via.name, depth: via.depth });
		}
	}

	return entries;
};

export const getDisplayedMembers = (
	users: User[],
	departmentId: string,
	allDepartments: Department[],
	activeTab: typeof consts.addTab | typeof consts.removeTab,
	searchQuery: string,
): MemberEntry[] => {
	const entries: MemberEntry[] =
		activeTab === consts.addTab
			? getAddTabEntries(users, departmentId, allDepartments)
			: getRemoveTabEntries(users, departmentId, allDepartments);

	const filtered = !searchQuery.trim()
		? entries
		: entries.filter(({ user }) => {
				const q = searchQuery.toLowerCase();
				return `${user.firstName} ${user.lastName}`.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
			});

	return [...filtered].sort((a, b) => a.depth - b.depth);
};

export const toggleSelection = (currentSelection: Set<string>, userId: string): Set<string> => {
	const newSet = new Set(currentSelection);
	if (newSet.has(userId)) {
		newSet.delete(userId);
	} else {
		newSet.add(userId);
	}
	return newSet;
};

export const getUpdatedDepartments = (
	userDepartments: string[] = [],
	departmentId: string,
	activeTab: typeof consts.addTab | typeof consts.removeTab,
): string[] => {
	let updated = [...userDepartments];
	if (activeTab === consts.addTab) {
		if (!updated.includes(departmentId)) {
			updated.push(departmentId);
		}
	} else {
		updated = updated.filter(id => id !== departmentId);
	}
	return updated;
};
