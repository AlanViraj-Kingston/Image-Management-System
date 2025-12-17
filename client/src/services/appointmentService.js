import axios from 'axios';

const DIAGNOSIS_API_BASE_URL = import.meta.env.VITE_DIAGNOSIS_API_BASE_URL || 'http://localhost:8003';

const appointmentApi = axios.create({
  baseURL: DIAGNOSIS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
appointmentApi.interceptors.request.use(
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
appointmentApi.interceptors.response.use(
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

export const appointmentService = {
  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment creation data
   * @returns {Promise} Appointment response
   */
  async createAppointment(appointmentData) {
    try {
      const response = await appointmentApi.post('/api/v1/appointments/', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all appointments
   * @param {string} status - Optional status filter
   * @returns {Promise} List of appointments
   */
  async getAllAppointments(status = null) {
    try {
      const url = status 
        ? `/api/v1/appointments/?status=${status}`
        : '/api/v1/appointments/';
      const response = await appointmentApi.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get appointment by ID
   * @param {number} appointmentId - Appointment ID
   * @returns {Promise} Appointment data
   */
  async getAppointment(appointmentId) {
    try {
      const response = await appointmentApi.get(`/api/v1/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get appointments for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise} List of appointments
   */
  async getPatientAppointments(patientId) {
    try {
      const response = await appointmentApi.get(`/api/v1/appointments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get appointments for a doctor
   * @param {number} doctorId - Doctor ID
   * @returns {Promise} List of appointments
   */
  async getDoctorAppointments(doctorId) {
    try {
      const response = await appointmentApi.get(`/api/v1/appointments/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update an appointment
   * @param {number} appointmentId - Appointment ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Updated appointment
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const response = await appointmentApi.put(`/api/v1/appointments/${appointmentId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete an appointment
   * @param {number} appointmentId - Appointment ID
   * @returns {Promise} Delete response
   */
  async deleteAppointment(appointmentId) {
    try {
      const response = await appointmentApi.delete(`/api/v1/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Appointment status constants
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

