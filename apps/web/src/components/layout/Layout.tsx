import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Events', href: '/events', icon: '🚨' },
    { name: 'Map', href: '/map', icon: '🗺️' },
    { name: 'Users', href: '/users', icon: '👥' },
    { name: 'Status', href: '/status', icon: '📍' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const userInitials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`relative bg-white shadow-lg transition-all duration-200 ${isSidebarExpanded ? 'w-64' : 'w-20'
          }`}
      >
        <button
          type="button"
          aria-label={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setIsSidebarExpanded((prev) => !prev)}
          className="absolute -right-3 top-8 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
        >
          {isSidebarExpanded ? '◀' : '▶'}
        </button>

        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`py-4 border-b border-gray-200 ${isSidebarExpanded ? 'px-6' : 'px-3 text-center'
              }`}
          >
            <h1 className="text-2xl font-bold text-blue-600">
              {isSidebarExpanded ? 'EmergenSee' : 'E'}
            </h1>
            {isSidebarExpanded && (
              <p className="text-xs text-gray-600 mt-1">Emergency Response</p>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-4 space-y-1 ${isSidebarExpanded ? 'px-4' : 'px-2'}`}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                title={!isSidebarExpanded ? item.name : undefined}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                  } ${isSidebarExpanded ? '' : 'justify-center px-2'}`}
              >
                <span className={`${isSidebarExpanded ? 'mr-3' : ''} text-lg`}>{item.icon}</span>
                {isSidebarExpanded && item.name}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className={`px-4 py-4 border-t border-gray-200 ${isSidebarExpanded ? '' : 'text-center'}`}>
            <button
              onClick={() => location.pathname === '/profile' ? navigate(-1) : navigate('/profile')}
              className={`block w-full text-left hover:bg-gray-50 rounded-lg ${isSidebarExpanded ? 'p-2 -mx-2' : ''}`}
            >
              {isSidebarExpanded ? (
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                  {userInitials}
                </div>
              )}
            </button>

            <button
              onClick={() => authService.logout()}
              className={`mt-3 w-full text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ${isSidebarExpanded ? 'px-4 py-2' : 'px-2 py-2'
                }`}
              title={!isSidebarExpanded ? 'Logout' : undefined}
            >
              {isSidebarExpanded ? 'Logout' : '↩'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
