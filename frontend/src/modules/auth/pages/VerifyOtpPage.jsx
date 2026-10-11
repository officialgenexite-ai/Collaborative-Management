import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import * as authApi from '../authApi';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP sent to your email');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.verifyOtp({ email, otp });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the 6-digit code we sent to your inbox">
      {success ? (
        <p className="text-green-600 text-sm">Email verified! Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
          <InputField
            label="OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
          />

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {submitting ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      )}

      <p className="text-sm text-gray-500 mt-6 text-center">
        Back to <Link to="/login" className="text-primary font-medium">Login</Link>
      </p>
    </AuthLayout>
  );
}
