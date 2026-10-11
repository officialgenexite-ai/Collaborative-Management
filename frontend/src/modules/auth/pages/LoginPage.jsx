import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import { useAuth } from '../../../hooks/useAuth';
import * as authApi from '../authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/workspaces');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authApi.googleLoginUrl();
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to your workspace">
      <form onSubmit={handleSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@example.com"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-3 text-xs text-gray-400">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition"
      >
        Continue with Google
      </button>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium">Register</Link>
      </p>
    </AuthLayout>
  );
}
