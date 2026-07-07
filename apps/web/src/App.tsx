import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import { UserRole } from '@emergensee/shared';
import LoginPage from 'pages/LoginPage';
import DashboardPage from 'pages/DashboardPage';
import EventsPage from 'pages/EventsPage';
import UsersPage from 'pages/UsersPage';
import DepartmentsPage from 'pages/DepartmentsPage';
import StatusPage from 'pages/StatusPage';
import ProfilePage from 'pages/ProfilePage';
import EmergencyReportPage from 'pages/EmergencyReportPage';
import CameraPage from 'pages/CameraPage';
import CameraStationPage from 'pages/CameraStationPage';
import AdminCameraPage from 'pages/AdminCameraPage';
import FaceRegistrationPage from 'pages/FaceRegistrationPage';
import SheltersPage from 'pages/SheltersPage';
import LandingPage from 'pages/LandingPage';
import Layout from 'components/Layout';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const location = useLocation();

	return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
	const user = useAuthStore(state => state.user);

	return user?.role === UserRole.ADMIN ? <>{children}</> : <Navigate to="/" replace />;
}

function HomeRedirect() {
	const user = useAuthStore(state => state.user);
	return user?.role === UserRole.ADMIN
		? <Navigate to="/dashboard" replace />
		: <Navigate to="/landing" replace />;
}

function CameraRoleGuard({ children }: { children: React.ReactNode }) {
	const user = useAuthStore(state => state.user);
	if (user?.role === UserRole.CAMERA) {
		return <Navigate to="/station" replace />;
	}
	return <>{children}</>;
}

function FaceRegistrationGuard({ children }: { children: React.ReactNode }) {
	const user = useAuthStore(state => state.user);
	const location = useLocation();

	if (
		user &&
		user.role !== UserRole.CAMERA &&
		!user.faceIdentity &&
		!localStorage.getItem(`face-reg-done-${user.id}`) &&
		location.pathname !== '/register-face'
	) {
		return <Navigate to="/register-face" replace state={{ firstTime: true }} />;
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
					path="/register-face"
					element={
						<ProtectedRoute>
							<FaceRegistrationPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<CameraRoleGuard>
								<FaceRegistrationGuard>
									<Layout />
								</FaceRegistrationGuard>
							</CameraRoleGuard>
						</ProtectedRoute>
					}
				>
					<Route index element={<HomeRedirect />} />
					<Route path="landing" element={<LandingPage />} />
					<Route path="dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
					<Route path="events" element={<AdminRoute><EventsPage /></AdminRoute>} />
					<Route path="shelters" element={<SheltersPage />} />
					<Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
					<Route path="departments" element={<AdminRoute><DepartmentsPage /></AdminRoute>} />
					<Route path="status" element={<AdminRoute><StatusPage /></AdminRoute>} />
					<Route path="emergency-report" element={<EmergencyReportPage />} />
					<Route path="camera" element={<CameraPage />} />
					<Route path="admin/cameras" element={<AdminRoute><AdminCameraPage /></AdminRoute>} />
					<Route path="profile" element={<ProfilePage />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
