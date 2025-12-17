import axios from 'axios';

const DIAGNOSIS_API_BASE_URL = import.meta.env.VITE_DIAGNOSIS_API_BASE_URL || 'http://localhost:8003';

const workflowLogApi = axios.create({
  baseURL: DIAGNOSIS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
workflowLogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
workflowLogApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const workflowLogService = {
  /**
   * Get all workflow logs
   * @param {number} userId - Optional user ID to filter logs
   * @param {number} limit - Maximum number of logs to return (default: 100)
   * @returns {Promise} List of workflow logs
   */
  async getAllLogs(userId = null, limit = 100) {
    try {
      const url = userId 
        ? `/api/v1/logs/?user_id=${userId}&limit=${limit}`
        : `/api/v1/logs/?limit=${limit}`;
      const response = await workflowLogApi.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get logs for a specific user
   * @param {number} userId - User ID
   * @param {number} limit - Maximum number of logs to return (default: 100)
   * @returns {Promise} List of workflow logs
   */
  async getUserLogs(userId, limit = 100) {
    try {
      const response = await workflowLogApi.get(`/api/v1/logs/user/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get a specific log by ID
   * @param {number} logId - Log ID
   * @returns {Promise} Log data
   */
  async getLog(logId) {
    try {
      const response = await workflowLogApi.get(`/api/v1/logs/${logId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

