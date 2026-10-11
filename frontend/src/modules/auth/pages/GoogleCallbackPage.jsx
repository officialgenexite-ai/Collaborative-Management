import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

// ============================================
// EXPECTED BACKEND BEHAVIOR (integration dependency):
// After Google OAuth succeeds, the backend's Passport callback
// must redirect the browser to:
//   FRONTEND_URL/auth/google/callback?token=<accessToken>&user=<encodeURIComponent(JSON.stringify(userObj))>
// If your existing Google OAuth callback currently returns JSON instead
// of redirecting, this is the one backend change needed to connect it here.
// ============================================
export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSessionFromGoogle } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token) {
      let userData = null;
      try {
        userData = userParam ? JSON.parse(decodeURIComponent(userParam)) : null;
      } catch (err) {
        userData = null;
      }
      setSessionFromGoogle(token, userData);
      navigate('/dashboard');
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, setSessionFromGoogle, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Completing sign-in...</p>
    </div>
  );
}
