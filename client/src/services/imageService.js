import axios from 'axios';

const IMAGING_API_BASE_URL = import.meta.env.VITE_IMAGING_API_BASE_URL || 'http://localhost:8002';

const imageApi = axios.create({
  baseURL: IMAGING_API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor to add auth token
imageApi.interceptors.request.use(
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
imageApi.interceptors.response.use(
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

export const imageService = {
  /**
   * Upload a medical image
   * @param {number} patientId - Patient ID
   * @param {string} imageType - Type of image (xray, mri, ct, ultrasound, other)
   * @param {number} uploadedBy - Staff ID of person uploading
   * @param {File} file - Image file
   * @returns {Promise} Upload response with image_id
   */
  async uploadImage(patientId, imageType, uploadedBy, file) {
    try {
      const formData = new FormData();
      formData.append('patient_id', patientId);
      formData.append('image_type', imageType);
      formData.append('uploaded_by', uploadedBy);
      formData.append('file', file);

      const response = await imageApi.post('/api/v1/images/upload', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get image by ID
   * @param {number} imageId - Image ID
   * @returns {Promise} Image data
   */
  async getImage(imageId) {
    try {
      const response = await imageApi.get(`/api/v1/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get presigned URL for image
   * @param {number} imageId - Image ID
   * @param {number} expiresIn - Expiration time in seconds (default: 3600)
   * @returns {Promise} Presigned URL
   */
  async getImageUrl(imageId, expiresIn = 3600) {
    try {
      const response = await imageApi.get(`/api/v1/images/${imageId}/url?expires_in=${expiresIn}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete an image
   * @param {number} imageId - Image ID
   * @returns {Promise} Delete response
   */
  async deleteImage(imageId) {
    try {
      const response = await imageApi.delete(`/api/v1/images/${imageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Image type mapping from scan type to image type
export const SCAN_TO_IMAGE_TYPE = {
  'Abdominal Ultra Sound Scan': 'ultrasound',
  'CT Scan': 'ct',
  'MRI Scan': 'mri',
  'PET Scan': 'other', // PET scans can be mapped to 'other' or we can add it
};

