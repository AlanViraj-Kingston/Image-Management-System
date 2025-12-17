import axios from 'axios';

const DIAGNOSIS_API_BASE_URL = import.meta.env.VITE_DIAGNOSIS_API_BASE_URL || 'http://localhost:8003';

const testApi = axios.create({
  baseURL: DIAGNOSIS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
testApi.interceptors.request.use(
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
testApi.interceptors.response.use(
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

export const testService = {
  /**
   * Create a new medical test
   * @param {Object} testData - Test creation data
   * @returns {Promise} Test response
   */
  async createTest(testData) {
    try {
      const response = await testApi.post('/api/v1/tests/', testData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all tests for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise} List of tests
   */
  async getPatientTests(patientId) {
    try {
      const response = await testApi.get(`/api/v1/tests/patient/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all tests for a doctor
   * @param {number} doctorId - Doctor ID
   * @returns {Promise} List of tests
   */
  async getDoctorTests(doctorId) {
    try {
      const response = await testApi.get(`/api/v1/tests/doctor/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all tests for an appointment
   * @param {number} appointmentId - Appointment ID
   * @returns {Promise} List of tests
   */
  async getAppointmentTests(appointmentId) {
    try {
      const response = await testApi.get(`/api/v1/tests/appointment/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all tests assigned to a radiologist
   * @param {number} radiologistId - Radiologist ID
   * @returns {Promise} List of tests
   */
  async getRadiologistTests(radiologistId) {
    try {
      const response = await testApi.get(`/api/v1/tests/radiologist/${radiologistId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update a test
   * @param {number} testId - Test ID
   * @param {Object} updateData - Update data
   * @returns {Promise} Updated test
   */
  async updateTest(testId, updateData) {
    try {
      const response = await testApi.put(`/api/v1/tests/${testId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Generate report for a test
   * @param {number} testId - Test ID
   * @param {Object} reportData - Report data with findings and diagnosis
   * @returns {Promise} Test with report ID
   */
  async generateReport(testId, reportData = {}) {
    try {
      const response = await testApi.post(`/api/v1/tests/${testId}/generate-report`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get a diagnosis report by ID
   * @param {number} reportId - Report ID
   * @returns {Promise} Report data
   */
  async getReport(reportId) {
    try {
      const response = await testApi.get(`/api/v1/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Scan type constants
export const SCAN_TYPES = {
  ABDOMINAL_ULTRASOUND: 'Abdominal Ultra Sound Scan',
  CT_SCAN: 'CT Scan',
  MRI_SCAN: 'MRI Scan',
  PET_SCAN: 'PET Scan',
};

// Test status constants
export const TEST_STATUS = {
  SCAN_TO_BE_TAKEN: 'Scan to be taken',
  SCAN_IN_PROGRESS: 'Scan in progress',
  SCAN_DONE: 'Scan Done',
};

