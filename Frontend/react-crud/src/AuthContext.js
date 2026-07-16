import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from './api/index';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Maps any axios error from an auth call to a specific, actionable message.
// Never falls through to a generic "Login failed" — every branch is explicit.
function describeAuthError(error) {
  // Axios timeout (ECONNABORTED) — request never got a response in time
  if (error.code === 'ECONNABORTED') {
    return { message: 'Server is not responding (timeout). It may be down or overloaded — try again shortly.', kind: 'timeout' };
  }

  // Request was sent, browser could not complete it at all — this is what a
  // CORS rejection *or* a fully unreachable host both look like from axios,
  // since the browser does not expose the real reason to JS for security.
  if (!error.response && error.request) {
    // navigator.onLine lets us distinguish "no internet" from "server refused/blocked us"
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { message: 'You appear to be offline. Check your internet connection.', kind: 'offline' };
    }
    return {
      message: 'Cannot connect to the backend server. Either the server is down, the API URL is wrong, or the request was blocked by CORS. Check the browser console (Network tab) for the exact reason.',
      kind: 'network_or_cors',
    };
  }

  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;

  switch (status) {
    case 400:
      return { message: serverMsg || 'Invalid request — check the email and password fields.', kind: 'bad_request' };
    case 401:
      return { message: serverMsg || 'Invalid email or password.', kind: 'invalid_credentials' };
    case 403:
      return { message: serverMsg || 'This account is disabled or restricted. Contact your administrator.', kind: 'account_disabled' };
    case 404:
      return { message: serverMsg || 'No account found with that email.', kind: 'not_found' };
    case 409:
      return { message: serverMsg || 'An account with this email already exists.', kind: 'conflict' };
    case 500:
    case 502:
    case 503:
      return { message: serverMsg || 'Internal server error. The backend hit an unexpected exception — check the server logs.', kind: 'server_error' };
    default:
      return { message: serverMsg || `Unexpected server response (HTTP ${status ?? 'unknown'}).`, kind: 'unknown' };
  }
}

function parseAuthResponse(data) {
  const token = data.token ?? data.Token;
  let decodedRole = data.role ?? data.Role;
  let decodedEmpId = data.empId ?? data.EmpId;
  let decodedSpaceId = data.spaceId ?? data.SpaceId;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Role — prefer MS schema, then plain "role"
    decodedRole = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      || payload.role
      || decodedRole;

    // EmpId — prefer the custom "EmpId" claim (always numeric), then nameidentifier
    const customEmpId = payload["EmpId"] ?? payload["empid"] ?? payload["empId"];
    const nameId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
      || payload.nameid;

    const rawId = customEmpId ?? nameId ?? decodedEmpId;
    decodedEmpId = rawId ? parseInt(rawId, 10) : decodedEmpId;

    // SpaceId
    const rawSpaceId = payload["SpaceId"] ?? payload["spaceid"];
    if (rawSpaceId !== undefined && rawSpaceId !== null && rawSpaceId !== '') {
      decodedSpaceId = parseInt(rawSpaceId, 10);
    }
  } catch (e) {
    // fallback to data
  }

  return {
    token,
    role: decodedRole,
    empId: decodedEmpId,
    spaceId: decodedSpaceId,
    name: data.name ?? data.Name ?? data.email ?? data.Email ?? 'User',
    email: data.email ?? data.Email,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      sessionStorage.clear();
    }
    setLoading(false);
  }, []);

  const persist = useCallback((userData) => {
    sessionStorage.setItem('token', userData.token);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const redirect = useCallback((role) => {
    if (role === 'SuperAdmin') navigate('/superadmin');
    else if (role === 'Admin') navigate('/admin');
    else if (role === 'HR') navigate('/hr');
    else navigate('/employee'); // TeamLead, Manager, Employee all use /employee
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      const userData = parseAuthResponse(res.data);
      persist(userData);
      redirect(userData.role);
      toast.success(`Welcome back, ${userData.name.split(' ')[0]}!`);
    } catch (error) {
      const { message, kind } = describeAuthError(error);
      console.error(`[Login] Failed [${kind}]:`, error);
      toast.error(message);
      throw error;
    }
  }, [persist, redirect]);

  const register = useCallback(async (formData) => {
    try {
      const res = await authApi.register(formData);
      const responseData = res.data;
      
      if (responseData.Status === 'Pending' || responseData.status === 'Pending') {
        toast.success('Registration successful! Please wait for admin approval.');
        navigate('/login');
        return;
      }
      
      const userData = parseAuthResponse(responseData);
      persist(userData);
      redirect(userData.role);
      toast.success('Account created successfully!');
    } catch (error) {
      const { message, kind } = describeAuthError(error);
      console.error(`[Register] Failed [${kind}]:`, error);
      toast.error(message);
      throw error;
    }
  }, [persist, redirect, navigate]);

  const logout = useCallback(() => {
    sessionStorage.clear();
    setUser(null);
    navigate('/login');
    toast('Logged out successfully.', { icon: '👋' });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
