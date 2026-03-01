import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';
import './index.css';
import { requestDashboardAccess, verifyAdminKey } from './services/api';

function AdminSessionGuard({ isAdmin, setIsAdminState }) {
  const location = useLocation();

  useEffect(() => {
    if (!isAdmin) return;
    if (location.pathname === '/dashboard') return;

    localStorage.removeItem('adminKey');
    localStorage.setItem('adminAuthorized', 'false');
    setIsAdminState(false);
  }, [isAdmin, location.pathname, setIsAdminState]);

  useEffect(() => {
    if (!isAdmin) return;

    const handleUnload = () => {
      localStorage.removeItem('adminKey');
      localStorage.setItem('adminAuthorized', 'false');
      setIsAdminState(false);
    };

    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isAdmin, setIsAdminState]);

  return null;
}

function AdminLogin({ setIsAdmin }) {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState(null);
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestError, setRequestError] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = adminKey.trim();
    if (!trimmed) {
      setError('Please enter admin key');
      return;
    }
    localStorage.setItem('adminKey', trimmed);

    try {
      await verifyAdminKey();
      localStorage.setItem('adminAuthorized', 'true');
      setIsAdmin(true);
      navigate('/dashboard');
    } catch (err) {
      localStorage.removeItem('adminKey');
      localStorage.setItem('adminAuthorized', 'false');
      setIsAdmin(false);
      const isAccessCode = adminKey.length > 20;
      if (isAccessCode) {
        setError('Invalid token');
      } else {
        setError('Invalid admin key');
      }
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSuccess(null);

    const name = requestName.trim();
    const email = requestEmail.trim();
    const reason = requestReason.trim();

    if (!name || !email || !reason) {
      setRequestError('Please fill name, email and reason');
      return;
    }

    setIsRequesting(true);
    try {
      await requestDashboardAccess({ name, email, reason });
      setRequestSuccess('Request sent. Admin will contact you soon.');
      setRequestName('');
      setRequestEmail('');
      setRequestReason('');
    } catch (err) {
      setRequestError(err.message || 'Failed to send request');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Dashboard Access</h1>
        <p className="text-sm text-gray-600 mb-4">Enter admin key or access code to view dashboard, or request access.</p>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Key or Access Code</label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter admin key or access code"
            />
          </div>
          <button type="submit" className="w-full btn-primary">Continue</button>
          <Link to="/" className="block text-center text-sm text-gray-600 hover:text-gray-900">Back to Survey</Link>
        </form>

        <div className="my-6 border-t border-gray-200" />

        <h2 className="text-sm font-semibold text-gray-900 mb-2">Request Access</h2>

        {requestError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {requestError}
          </div>
        )}
        {requestSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {requestSuccess}
          </div>
        )}

        <form onSubmit={handleRequestAccess} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={requestEmail}
              onChange={(e) => setRequestEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Why do you need access?"
              rows={3}
            />
          </div>

          <button type="submit" className="w-full btn-secondary" disabled={isRequesting}>
            {isRequesting ? 'Sending...' : 'Request Access'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProtectedDashboard({ isAdmin }) {
  if (!isAdmin) return <Navigate to="/admin" replace />;
  return <Dashboard />;
}

function AppRoutes({ setEmailVerified, emailVerified, isAdmin, setIsAdmin }) {
  return (
    <Routes>
      <Route path="/" element={<SurveyForm setEmailVerified={setEmailVerified} emailVerified={emailVerified} />} />
      <Route path="/admin" element={<AdminLogin setIsAdmin={setIsAdmin} />} />
      <Route path="/dashboard" element={<ProtectedDashboard isAdmin={isAdmin} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [emailVerified, setEmailVerifiedState] = useState(false);
  const [isAdmin, setIsAdminState] = useState(false);

  useEffect(() => {
    const untilRaw = localStorage.getItem('emailVerifiedUntil');
    const until = untilRaw ? Number(untilRaw) : 0;
    const isVerifiedNow = Number.isFinite(until) && until > Date.now();
    setEmailVerifiedState(isVerifiedNow);

    if (!isVerifiedNow) {
      localStorage.removeItem('emailVerifiedUntil');
      localStorage.removeItem('emailVerified');
    }

    const storedAdmin = localStorage.getItem('adminAuthorized') === 'true';
    const adminKey = localStorage.getItem('adminKey');
    if (storedAdmin && adminKey) {
      verifyAdminKey()
        .then(() => {
          setIsAdminState(true);
        })
        .catch(() => {
          localStorage.removeItem('adminKey');
          localStorage.setItem('adminAuthorized', 'false');
          setIsAdminState(false);
        });
    } else {
      setIsAdminState(storedAdmin);
    }
  }, []);

  const setEmailVerified = (value) => {
    if (value) {
      const until = Date.now() + 15 * 60 * 1000;
      localStorage.setItem('emailVerifiedUntil', String(until));
      localStorage.removeItem('emailVerified');
      setEmailVerifiedState(true);
      return;
    }

    localStorage.removeItem('emailVerifiedUntil');
    localStorage.removeItem('emailVerified');
    setEmailVerifiedState(value);
  };

  useEffect(() => {
    if (!emailVerified) return;

    const untilRaw = localStorage.getItem('emailVerifiedUntil');
    const until = untilRaw ? Number(untilRaw) : 0;
    const remainingMs = until - Date.now();

    if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
      setEmailVerified(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setEmailVerified(false);
    }, remainingMs);

    return () => clearTimeout(timeoutId);
  }, [emailVerified]);

  // Periodic admin token validation (every 30 seconds)
  useEffect(() => {
    if (!isAdmin) return;

    const validateAdminToken = async () => {
      const adminKey = localStorage.getItem('adminKey');
      if (!adminKey) return;

      try {
        await verifyAdminKey();
      } catch (err) {
        localStorage.removeItem('adminKey');
        localStorage.setItem('adminAuthorized', 'false');
        setIsAdminState(false);
        window.location.href = '/admin';
      }
    };

    const interval = setInterval(validateAdminToken, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  const setIsAdmin = (value) => {
    localStorage.setItem('adminAuthorized', value ? 'true' : 'false');
    setIsAdminState(value);
  };

  const dashboardLink = useMemo(() => (isAdmin ? '/dashboard' : '/admin'), [isAdmin]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AdminSessionGuard isAdmin={isAdmin} setIsAdminState={setIsAdminState} />
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">PaySure</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Survey
                </Link>
                <Link
                  to={dashboardLink}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <AppRoutes
          setEmailVerified={setEmailVerified}
          emailVerified={emailVerified}
          isAdmin={isAdmin}
          setIsAdmin={setIsAdmin}
        />
        
        <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end items-center">
              <div className="flex items-center space-x-3">
                <p className="text-sm text-gray-600">© 2026 | Built by Sanskriti Gupta</p>
                <a
                  href="https://www.linkedin.com/in/sanskritigupta17/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                  aria-label="LinkedIn Profile"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
