import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const PatientDetails = ({ userId, onBack }) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    conditions: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatientDetails();
  }, [userId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const patientData = await authService.getPatientByUserId(userId);
      setPatient(patientData);
      setFormData({
        name: patientData.name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
        address: patientData.address || '',
        date_of_birth: patientData.date_of_birth || '',
        conditions: patientData.conditions || '',
      });
    } catch (err) {
      setError(
        err.detail || err.message || 'Failed to load patient details'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        const errorMsg = 'Name is required';
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      if (!formData.date_of_birth) {
        const errorMsg = 'Date of birth is required';
        setError(errorMsg);
        toast.error(errorMsg);
        setSaving(false);
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        date_of_birth: formData.date_of_birth,
        conditions: formData.conditions.trim() || null,
      };

      const updatedPatient = await authService.updatePatient(
        patient.patient_id,
        updateData
      );
      setPatient(updatedPatient);
      setIsEditing(false);
      toast.success('Your details have been updated successfully!');
      
      // Update stored user data
      const storedUser = authService.getStoredUser();
      if (storedUser) {
        const updatedUser = {
          ...storedUser,
          name: updatedPatient.name,
          phone: updatedPatient.phone,
          address: updatedPatient.address,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to update patient details';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        date_of_birth: patient.date_of_birth || '',
        conditions: patient.conditions || '',
      });
    }
    setIsEditing(false);
    setError('');
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <svg
            className="animate-spin h-8 w-8 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-3 text-gray-600">Loading patient details...</span>
        </div>
      </div>
    );
  }

  if (error && !patient) {
    return (
      <div className="card">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
              <button onClick={onBack} className="btn-secondary">
                Back
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input-field bg-gray-100"
                value={formData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label
                htmlFor="date_of_birth"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                required
                className="input-field"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={saving}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input-field"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              className="input-field resize-none"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          {/* Medical Conditions */}
          <div>
            <label
              htmlFor="conditions"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Medical Conditions
            </label>
            <textarea
              id="conditions"
              name="conditions"
              rows="3"
              className="input-field resize-none"
              placeholder="Enter any existing medical conditions (comma-separated)"
              value={formData.conditions}
              onChange={handleChange}
              disabled={saving}
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple conditions with commas
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">
                {patient?.name || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Email</p>
              <p className="text-lg font-semibold text-gray-900">
                {patient?.email || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Phone</p>
              <p className="text-lg font-semibold text-gray-900">
                {patient?.phone || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
              <p className="text-lg font-semibold text-gray-900">
                {patient?.date_of_birth
                  ? new Date(patient.date_of_birth).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="text-lg font-semibold text-gray-900">
                {patient?.address || 'N/A'}
              </p>
            </div>
            {patient?.conditions && (
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Medical Conditions</p>
                <p className="text-lg font-semibold text-gray-900">
                  {patient.conditions}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetails;

