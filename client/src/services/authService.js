import api from './api';

export const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response with token and user data
   */
  async login(email, password) {
    try {
      const response = await api.post('/api/v1/users/login', {
        email: email,
        password: password,
      });
      
      // Store token and user data
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Register a new patient
   * @param {Object} patientData - Patient registration data
   * @returns {Promise} Patient response
   */
  async registerPatient(patientData) {
    try {
      const response = await api.post('/api/v1/patients/', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Register a new medical staff member
   * @param {Object} staffData - Staff registration data
   * @returns {Promise} Staff response
   */
  async registerStaff(staffData) {
    try {
      const response = await api.post('/api/v1/staff/', staffData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get patient information by user_id
   * @param {number} userId - User ID
   * @returns {Promise} Patient data
   */
  async getPatientByUserId(userId) {
    try {
      const response = await api.get(`/api/v1/patients/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get patient information by patient_id
   * @param {number} patientId - Patient ID
   * @returns {Promise} Patient data
   */
  async getPatientById(patientId) {
    try {
      const response = await api.get(`/api/v1/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update patient information
   * @param {number} patientId - Patient ID
   * @param {Object} patientData - Patient update data (name, phone, address, date_of_birth, conditions)
   * @returns {Promise} Updated patient data
   */
  async updatePatient(patientId, patientData) {
    try {
      const response = await api.put(`/api/v1/patients/${patientId}`, patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all patients (staff/doctor view)
   * @returns {Promise} Patient list
   */
  async getAllPatients() {
    try {
      const response = await api.get('/api/v1/patients/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all medical staff
   * @returns {Promise} Staff list
   */
  async getAllStaff() {
    try {
      const response = await api.get('/api/v1/staff/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all radiologists
   * @returns {Promise} Radiologist list
   */
  async getRadiologists() {
    try {
      const response = await api.get('/api/v1/staff/');
      const allStaff = response.data;
      // Filter for radiologists
      return allStaff.filter(staff => staff.role === 'radiologist');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get staff information by user_id
   * @param {number} userId - User ID
   * @returns {Promise} Staff data
   */
  async getStaffByUserId(userId) {
    try {
      const response = await api.get(`/api/v1/staff/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Activate a user account
   * @param {number} userId - User ID
   * @returns {Promise} Activation response
   */
  async activateUser(userId) {
    try {
      const response = await api.put(`/api/v1/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Deactivate a user account
   * @param {number} userId - User ID
   * @returns {Promise} Deactivation response
   */
  async deactivateUser(userId) {
    try {
      const response = await api.put(`/api/v1/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

