import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';
import LoginPage from 'pages/LoginPage';
import DashboardPage from 'pages/DashboardPage';
import EventsPage from 'pages/EventsPage';
import MapPage from 'pages/MapPage';
import UsersPage from 'pages/UsersPage';
import DepartmentsPage from 'pages/DepartmentsPage';
import StatusPage from 'pages/StatusPage';
import ProfilePage from 'pages/ProfilePage';
import EmergencyReportPage from 'pages/EmergencyReportPage';
import Layout from 'components/Layout';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const location = useLocation();

	return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
}

function App() {
	return (
		<Router>
			<Toaster richColors position="bottom-right" />
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<Layout />
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
					<Route path="profile" element={<ProfilePage />} />
				</Route>
			</Routes>
		</Router>
	);
}

export default App;
