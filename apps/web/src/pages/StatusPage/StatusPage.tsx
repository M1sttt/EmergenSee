import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statusService } from 'services/statusService';
import { eventsService } from 'services/eventsService';
import { departmentsService } from 'services/departmentsService';
import { usersService } from 'services/usersService';
import { useAuthStore } from 'store/authStore';
import { EventStatus, RESPONDER_STATUS_LABELS, ResponderStatus, UserRole } from '@emergensee/shared';
import { format } from 'date-fns';

export default function StatusPage() {
	const queryClient = useQueryClient();
	const currentUser = useAuthStore(state => state.user);

	const [selectedEventId, setSelectedEventId] = useState<string>('');
	const [selectedDeptId, setSelectedDeptId] = useState<string>('all');

	const { data: events = [], isLoading: isLoadingEvents } = useQuery({
		queryKey: ['events'],
		queryFn: eventsService.getAll,
	});
	const { data: deptsResponse, isLoading: isLoadingDepts } = useQuery<any>({
		queryKey: ['departments'],
		queryFn: departmentsService.getAll,
	});
	const { data: users = [], isLoading: isLoadingUsers } = useQuery({
		queryKey: ['users'],
		queryFn: usersService.getAll,
	});
	const { data: statusUpdates = [], isLoading: isLoadingStatus } = useQuery({
		queryKey: ['status'],
		queryFn: statusService.getAll,
	});

	const activeEvents = useMemo(() => events.filter(e => e.status === EventStatus.ONGOING), [events]);
	const departments = useMemo(
		() => (Array.isArray(deptsResponse) ? deptsResponse : deptsResponse?.data || []),
		[deptsResponse],
	);

	useEffect(() => {
		if (!selectedEventId && activeEvents.length > 0) {
			setSelectedEventId(activeEvents[0].id || (activeEvents[0] as any)._id);
		}
	}, [activeEvents, selectedEventId]);

	const reportMutation = useMutation({
		mutationFn: (data: { status: ResponderStatus; userId: string; eventId: string }) => {
			return statusService.create({
				status: data.status,
				eventId: data.eventId,
				userId: data.userId,
			} as any);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['status'] });
		},
	});

	const isGlobalAdmin = currentUser?.role === UserRole.ADMIN;
	const userAdminDepts = departments.filter((d: any) => d.admins?.includes(currentUser?.id));
	const isDeptAdmin = userAdminDepts.length > 0;

	const validDepartments = isGlobalAdmin ? departments : isDeptAdmin ? userAdminDepts : [];

	const displayUsers = useMemo(() => {
		if (!selectedEventId || selectedEventId === '') return [];

		let filteredUsers = users;
		if (selectedDeptId !== 'all') {
			filteredUsers = users.filter((u: any) => u.departments?.includes(selectedDeptId));
		} else {
			if (!isGlobalAdmin && isDeptAdmin) {
				const adminDeptIds = userAdminDepts.map((d: any) => d.id || d._id);
				filteredUsers = users.filter((u: any) =>
					u.departments?.some((dId: string) => adminDeptIds.includes(dId)),
				);
			}
		}

		return filteredUsers.map((u: any) => {
			const userStatuses = statusUpdates.filter((s: any) => {
				const uid = s.userId?.id || s.userId?._id || s.userId || s.userId;
				const eid = s.eventId?.id || s.eventId?._id || s.eventId || s.eventId;
				return uid === u.id && eid === selectedEventId;
			});
			userStatuses.sort(
				(a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			);

			return {
				user: u,
				status: userStatuses.length > 0 ? userStatuses[0] : null,
			};
		});
	}, [selectedEventId, selectedDeptId, users, statusUpdates, isGlobalAdmin, isDeptAdmin, userAdminDepts]);

	const isLoading = isLoadingEvents || isLoadingDepts || isLoadingUsers || isLoadingStatus;

	if (isLoading) {
		return <div className="p-6">Loading...</div>;
	}

	return (
		<div className="p-6">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
				<h1 className="text-3xl font-bold text-gray-900">Status Tracker</h1>

				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex items-center gap-2">
						<label className="text-sm font-medium text-gray-700">Active Event:</label>
						<select
							value={selectedEventId}
							onChange={e => setSelectedEventId(e.target.value)}
							className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
						>
							<option value="" disabled>
								Select an event
							</option>
							{activeEvents.map((e: any) => (
								<option key={e.id || e._id} value={e.id || e._id}>
									{e.title}
								</option>
							))}
						</select>
					</div>

					{(isGlobalAdmin || isDeptAdmin) && (
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-gray-700">Department:</label>
							<select
								value={selectedDeptId}
								onChange={e => setSelectedDeptId(e.target.value)}
								className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 bg-white"
							>
								<option value="all">All Departments</option>
								{validDepartments.map((d: any) => (
									<option key={d.id || d._id} value={d.id || d._id}>
										{d.name}
									</option>
								))}
							</select>
						</div>
					)}
				</div>
			</div>

			{!selectedEventId ? (
				<div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
					No active events found, or none selected.
				</div>
			) : (
				<div className="bg-white rounded-lg shadow overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Last Updated
								</th>
								<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{displayUsers.map(({ user, status }) => {
								const canReport =
									isGlobalAdmin ||
									(isDeptAdmin &&
										user.departments.some((ud: string) =>
											userAdminDepts.map((d: any) => d.id || d._id).includes(ud),
										));

								return (
									<tr key={user.id}>
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm font-medium text-gray-900">
												{user.firstName} {user.lastName}
											</div>
											<div className="text-sm text-gray-500">{user.email}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											{status && status.status !== ResponderStatus.UNKNOWN ? (
												<span
													className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.status === ResponderStatus.SAFE ? 'bg-green-100 text-green-800' : status.status === ResponderStatus.NEED_HELP ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
												>
													{RESPONDER_STATUS_LABELS[status.status as keyof typeof RESPONDER_STATUS_LABELS] ||
														status.status}
												</span>
											) : (
												<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
													{RESPONDER_STATUS_LABELS[
														ResponderStatus.UNKNOWN as keyof typeof RESPONDER_STATUS_LABELS
													] || 'Unknown'}
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{status ? format(new Date(status.createdAt), 'MMM d, HH:mm') : '-'}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											{canReport && (
												<div className="flex justify-end gap-2">
													<button
														onClick={() =>
															reportMutation.mutate({
																status: ResponderStatus.SAFE,
																userId: user.id,
																eventId: selectedEventId,
															})
														}
														className="bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded text-xs font-medium transition"
													>
														Mark Safe
													</button>
													<button
														onClick={() =>
															reportMutation.mutate({
																status: ResponderStatus.NEED_HELP,
																userId: user.id,
																eventId: selectedEventId,
															})
														}
														className="bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium transition"
													>
														Mark Need Help
													</button>
												</div>
											)}
										</td>
									</tr>
								);
							})}
							{displayUsers.length === 0 && (
								<tr>
									<td colSpan={4} className="px-6 py-4 text-center text-gray-500">
										No users found for the selected criteria.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
