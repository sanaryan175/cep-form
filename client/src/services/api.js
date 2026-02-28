import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAdminHeaders = () => {
  const adminKey = localStorage.getItem('adminKey');
  return adminKey ? { 'x-admin-key': adminKey } : {};
};

// Survey API calls
export const submitSurvey = async (surveyData) => {
  try {
    const response = await api.post('/survey', surveyData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    console.error('Survey submission error:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getSurveyStats = async () => {
  try {
    const response = await api.get('/survey/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getAllSurveys = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/survey?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const exportSurveysToExcel = async () => {
  try {
    const response = await api.get('/survey/export', {
      headers: getAdminHeaders(),
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Analytics API calls
export const getDashboardData = async () => {
  try {
    const response = await api.get('/analytics/dashboard', {
      headers: getAdminHeaders()
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

export const getSectionAnalytics = async (section) => {
  try {
    const response = await api.get(`/analytics/section/${section}`, {
      headers: getAdminHeaders()
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    throw new Error(msg);
  }
};

// Admin API calls
export const verifyAdminKey = async () => {
  try {
    const response = await api.post('/admin/verify', {}, {
      headers: getAdminHeaders()
    });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    throw new Error(errorMessage);
  }
};

export const requestDashboardAccess = async ({ name, email, reason }) => {
  try {
    const response = await api.post('/admin/request-access', { name, email, reason });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    throw new Error(errorMessage);
  }
};

// Email verification API calls
export const sendVerificationEmail = async (email) => {
  try {
    const response = await api.post('/email/send', { email });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    console.error('Send verification email error:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const verifyEmailCode = async (email, otp) => {
  try {
    const response = await api.post('/email/verify', { email, otp });
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
    console.error('Verify email code error:', errorMessage);
    throw new Error(errorMessage);
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export default api;
