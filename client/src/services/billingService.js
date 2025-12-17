import axios from 'axios';

const FINANCIAL_API_BASE_URL = import.meta.env.VITE_FINANCIAL_API_BASE_URL || 'http://localhost:8004';

const billingApi = axios.create({
  baseURL: FINANCIAL_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
billingApi.interceptors.request.use(
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
billingApi.interceptors.response.use(
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

export const billingService = {
  /**
   * Create a new billing record
   * @param {Object} billingData - Billing creation data
   * @returns {Promise} Billing response
   */
  async createBilling(billingData) {
    try {
      const response = await billingApi.post('/api/v1/billing/', billingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all billing records
   * @param {string} status - Optional status filter
   * @returns {Promise} List of billing records
   */
  async getAllBillings(status = null) {
    try {
      const url = status 
        ? `/api/v1/billing/?status=${status}`
        : '/api/v1/billing/';
      const response = await billingApi.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get billing by ID
   * @param {number} billingId - Billing ID
   * @returns {Promise} Billing data
   */
  async getBilling(billingId) {
    try {
      const response = await billingApi.get(`/api/v1/billing/${billingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get billings for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise} List of billing records
   */
  async getPatientBillings(patientId) {
    try {
      const response = await billingApi.get(`/api/v1/billing/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update a billing record
   * @param {number} billingId - Billing ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Updated billing
   */
  async updateBilling(billingId, updateData) {
    try {
      const response = await billingApi.put(`/api/v1/billing/${billingId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Mark billing as paid
   * @param {number} billingId - Billing ID
   * @returns {Promise} Response
   */
  async markAsPaid(billingId) {
    try {
      const response = await billingApi.put(`/api/v1/billing/${billingId}/pay`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a billing record
   * @param {number} billingId - Billing ID
   * @returns {Promise} Delete response
   */
  async deleteBilling(billingId) {
    try {
      const response = await billingApi.delete(`/api/v1/billing/${billingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Billing status constants
export const BILLING_STATUS = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

