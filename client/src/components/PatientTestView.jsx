import { useState, useEffect } from 'react';
import { testService, SCAN_TYPES, TEST_STATUS } from '../services/testService';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const PatientTestView = ({ patient, doctorId, onBack }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [radiologists, setRadiologists] = useState([]);
  const [radiologistMap, setRadiologistMap] = useState({});
  const [loadingRadiologists, setLoadingRadiologists] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
    radiologist_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    test_type: '',
    radiologist_id: '',
    status: '',
  });

  useEffect(() => {
    fetchTests();
    fetchRadiologists();
  }, [patient.patient_id]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await testService.getPatientTests(patient.patient_id);
      setTests(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load tests');
      toast.error(err.detail || err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRadiologists = async () => {
    try {
      setLoadingRadiologists(true);
      const data = await authService.getRadiologists();
      setRadiologists(data || []);
      // Create a map for quick lookup
      const map = {};
      (data || []).forEach((rad) => {
        map[rad.staff_id] = rad.name;
      });
      setRadiologistMap(map);
    } catch (err) {
      console.error('Failed to load radiologists:', err);
    } finally {
      setLoadingRadiologists(false);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const testData = {
        patient_id: patient.patient_id,
        doctor_id: doctorId,
        test_type: formData.test_type,
        radiologist_id: formData.radiologist_id ? parseInt(formData.radiologist_id) : null,
        status: TEST_STATUS.SCAN_TO_BE_TAKEN,
      };

      await testService.createTest(testData);
      toast.success('Test created successfully!');
      setShowCreateForm(false);
      setFormData({
        test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
        radiologist_id: '',
      });
      fetchTests();
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to create test';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateReport = async (testId) => {
    try {
      await testService.generateReport(testId);
      toast.success('Report generated successfully!');
      fetchTests();
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to generate report');
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setEditFormData({
      test_type: test.test_type,
      radiologist_id: test.radiologist_id ? test.radiologist_id.toString() : '',
      status: test.status,
    });
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    setError('');
    setUpdating(true);

    try {
      const updateData = {
        test_type: editFormData.test_type,
        radiologist_id: editFormData.radiologist_id ? parseInt(editFormData.radiologist_id) : null,
        status: editFormData.status,
      };

      await testService.updateTest(editingTest.test_id, updateData);
      toast.success('Test updated successfully!');
      setEditingTest(null);
      setEditFormData({
        test_type: '',
        radiologist_id: '',
        status: '',
      });
      fetchTests();
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to update test';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const getRadiologistName = (radiologistId) => {
    if (!radiologistId) return '—';
    return radiologistMap[radiologistId] || `ID: ${radiologistId}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case TEST_STATUS.SCAN_TO_BE_TAKEN:
        return 'bg-yellow-100 text-yellow-800';
      case TEST_STATUS.SCAN_IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TEST_STATUS.SCAN_DONE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Tests</h2>
          <p className="text-sm text-gray-600 mt-1">
            {patient.name} (ID: {patient.patient_id})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Test
          </button>
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Test</h3>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                className="input-field"
                required
                disabled={creating}
              >
                {Object.values(SCAN_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Radiologist
              </label>
              {loadingRadiologists ? (
                <p className="text-sm text-gray-500">Loading radiologists...</p>
              ) : (
                <select
                  value={formData.radiologist_id}
                  onChange={(e) => setFormData({ ...formData, radiologist_id: e.target.value })}
                  className="input-field"
                  disabled={creating}
                >
                  <option value="">Select a radiologist (optional)</option>
                  {radiologists.map((radiologist) => (
                    <option key={radiologist.staff_id} value={radiologist.staff_id}>
                      {radiologist.name} (ID: {radiologist.staff_id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Test'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
                    radiologist_id: '',
                  });
                }}
                className="btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
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
          <span className="ml-3 text-gray-600">Loading tests...</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
          No tests found for this patient.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Radiologist
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.test_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {test.test_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{test.test_type}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        test.status
                      )}`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {getRadiologistName(test.radiologist_id)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {test.report_id || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {test.image_id || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {test.created_date
                      ? new Date(test.created_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditTest(test)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-left"
                      >
                        Edit
                      </button>
                      {!test.report_id && (
                        <button
                          onClick={() => handleGenerateReport(test.test_id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-left"
                        >
                          Generate Report
                        </button>
                      )}
                      {test.report_id && (
                        <span className="text-green-600 font-medium">Report: {test.report_id}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Test</h3>
            <form onSubmit={handleUpdateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.test_type}
                  onChange={(e) => setEditFormData({ ...editFormData, test_type: e.target.value })}
                  className="input-field"
                  required
                  disabled={updating}
                >
                  {Object.values(SCAN_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Radiologist
                </label>
                <select
                  value={editFormData.radiologist_id}
                  onChange={(e) => setEditFormData({ ...editFormData, radiologist_id: e.target.value })}
                  className="input-field"
                  disabled={updating}
                >
                  <option value="">Select a radiologist (optional)</option>
                  {radiologists.map((radiologist) => (
                    <option key={radiologist.staff_id} value={radiologist.staff_id}>
                      {radiologist.name} (ID: {radiologist.staff_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="input-field"
                  required
                  disabled={updating}
                >
                  {Object.values(TEST_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Test'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTest(null);
                    setEditFormData({
                      test_type: '',
                      radiologist_id: '',
                      status: '',
                    });
                  }}
                  className="btn-secondary flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTestView;

