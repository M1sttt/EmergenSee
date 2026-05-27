import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import { UserRole } from '@emergensee/shared';
import LoginPage from 'pages/LoginPage';
import DashboardPage from 'pages/DashboardPage';
import EventsPage from 'pages/EventsPage';
import MapPage from 'pages/MapPage';
import UsersPage from 'pages/UsersPage';
import DepartmentsPage from 'pages/DepartmentsPage';
import StatusPage from 'pages/StatusPage';
import ProfilePage from 'pages/ProfilePage';
import EmergencyReportPage from 'pages/EmergencyReportPage';
import CameraPage from 'pages/CameraPage';
import CameraStationPage from 'pages/CameraStationPage';
import AdminCameraPage from 'pages/AdminCameraPage';
import FaceRegistrationPage from 'pages/FaceRegistrationPage';
import Layout from 'components/Layout';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const location = useLocation();

	return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
	const user = useAuthStore(state => state.user);

	return user?.role === UserRole.ADMIN ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function CameraRoleGuard({ children }: { children: React.ReactNode }) {
	const user = useAuthStore(state => state.user);
	if (user?.role === UserRole.CAMERA) {
		return <Navigate to="/station" replace />;
	}
	return <>{children}</>;
}

function App() {
	return (
		<Router>
			<Toaster richColors position="bottom-right" />
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/station"
					element={
						<ProtectedRoute>
							<CameraStationPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<CameraRoleGuard>
								<Layout />
							</CameraRoleGuard>
						</ProtectedRoute>
					}
				>
					<Route index element={<Navigate to="/dashboard" />} />
					<Route path="dashboard" element={<DashboardPage />} />
					<Route path="events" element={<EventsPage />} />
					<Route path="map" element={<MapPage />} />
					<Route path="users" element={<UsersPage />} />
					<Route path="departments" element={<DepartmentsPage />} />
					<Route path="status" element={<StatusPage />} />
					<Route path="emergency-report" element={<EmergencyReportPage />} />
					<Route path="camera" element={<AdminRoute><CameraPage /></AdminRoute>} />
					<Route path="admin/cameras" element={<AdminRoute><AdminCameraPage /></AdminRoute>} />
					<Route path="profile" element={<ProfilePage />} />
					<Route path="register-face" element={<FaceRegistrationPage />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
