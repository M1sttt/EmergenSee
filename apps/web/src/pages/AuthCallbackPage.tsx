import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { User } from '@emergensee/shared';

/**
 * Landing page for the Google OAuth redirect.
 *
 * The API redirects here after successful Google login:
 *   /auth/callback?accessToken=xxx&refreshToken=yyy
 *
 * This page stores the tokens, fetches the user profile, then navigates
 * to the dashboard.
 */
export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const updateToken = useAuthStore((state) => state.updateToken);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
            setError('Authentication failed — missing tokens. Please try again.');
            return;
        }

        // Temporarily inject the access token so the interceptor can use it
        updateToken(accessToken);

        api
            .get<User>('/auth/me', {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((res) => {
                setAuth(res.data, accessToken, refreshToken);
                navigate('/dashboard', { replace: true });
            })
            .catch(() => {
                setError('Could not load your profile. Please try logging in again.');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="max-w-sm w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <a href="/login" className="text-blue-600 hover:underline text-sm">
                        Back to login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 text-sm">Signing you in…</p>
            </div>
        </div>
    );
}
