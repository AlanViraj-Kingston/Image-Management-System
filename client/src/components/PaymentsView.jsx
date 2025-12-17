import { useState, useEffect } from 'react';
import { billingService, BILLING_STATUS } from '../services/billingService';
import { appointmentService } from '../services/appointmentService';
import { testService } from '../services/testService';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

const PaymentsView = ({ clerkId, onBack }) => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tests, setTests] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);
  const [patientMap, setPatientMap] = useState({});
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    procedure: '',
    base_cost: '',
  });

  useEffect(() => {
    fetchBillings();
    fetchOptions();
  }, []);

  useEffect(() => {
    // Fetch patient details for all billings
    const fetchPatients = async () => {
      const map = {};
      for (const billing of billings) {
        if (!map[billing.patient_id]) {
          try {
            const patient = await authService.getPatientById(billing.patient_id);
            map[billing.patient_id] = patient;
          } catch (err) {
            console.error(`Failed to fetch patient ${billing.patient_id}:`, err);
          }
        }
      }
      setPatientMap(map);
    };

    if (billings.length > 0) {
      fetchPatients();
    }
  }, [billings]);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billingService.getAllBillings();
      setBillings(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load billings');
      toast.error(err.detail || err.message || 'Failed to load billings');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      // Fetch all patients
      const patientsData = await authService.getAllPatients();
      setPatients(patientsData || []);
    } catch (err) {
      console.error('Failed to load options:', err);
      toast.error('Failed to load patients');
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchAppointmentsForPatient = async (patientId) => {
    if (!patientId) {
      setAppointments([]);
      setTests([]);
      setFormData(prev => ({ ...prev, appointment_id: '', procedure: '' }));
      return;
    }
    try {
      const data = await appointmentService.getPatientAppointments(patientId);
      setAppointments(data || []);
      setFormData(prev => ({ ...prev, appointment_id: '', procedure: '' }));
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Failed to load appointments');
    }
  };

  const fetchTestsForAppointment = async (appointmentId) => {
    if (!appointmentId) {
      setTests([]);
      setFormData(prev => ({ ...prev, procedure: '' }));
      return;
    }
    try {
      const data = await testService.getAppointmentTests(appointmentId);
      setTests(data || []);
      // Auto-populate procedure field with scan names
      const scanNames = data.map(test => test.test_type).join(', ');
      setFormData(prev => ({ ...prev, procedure: scanNames }));
    } catch (err) {
      console.error('Failed to load tests:', err);
      toast.error('Failed to load tests');
      setTests([]);
    }
  };

  const handlePatientChange = (e) => {
    const patientId = e.target.value;
    setFormData(prev => ({ ...prev, patient_id: patientId, appointment_id: '', procedure: '' }));
    fetchAppointmentsForPatient(patientId);
  };

  const handleAppointmentChange = (e) => {
    const appointmentId = e.target.value;
    setFormData(prev => ({ ...prev, appointment_id: appointmentId }));
    fetchTestsForAppointment(appointmentId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.appointment_id || !formData.procedure || !formData.base_cost) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await billingService.createBilling({
        patient_id: parseInt(formData.patient_id),
        appointment_id: parseInt(formData.appointment_id),
        procedure: formData.procedure,
        base_cost: parseFloat(formData.base_cost),
        status: BILLING_STATUS.UNPAID,
      });
      
      toast.success('Bill created successfully!');
      setShowCreateForm(false);
      setFormData({
        patient_id: '',
        appointment_id: '',
        procedure: '',
        base_cost: '',
      });
      setAppointments([]);
      setTests([]);
      fetchBillings();
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to create bill');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusUpdate = async (billingId, newStatus) => {
    setUpdating(true);
    try {
      await billingService.updateBilling(billingId, { status: newStatus });
      toast.success('Payment status updated successfully!');
      fetchBillings();
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case BILLING_STATUS.UNPAID:
        return 'bg-red-100 text-red-800';
      case BILLING_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BILLING_STATUS.PAID:
        return 'bg-green-100 text-green-800';
      case BILLING_STATUS.OVERDUE:
        return 'bg-orange-100 text-orange-800';
      case BILLING_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payments & Billing</h2>
          <div className="flex gap-3">
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Bill
              </button>
            )}
            <button
              onClick={onBack}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Bill</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.patient_id}
                    onChange={handlePatientChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={loadingOptions}
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.patient_id} value={patient.patient_id}>
                        {patient.name} (ID: {patient.patient_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointment <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.appointment_id || ''}
                    onChange={handleAppointmentChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={!formData.patient_id || loadingOptions}
                  >
                    <option value="">Select Appointment</option>
                    {appointments.map((appointment) => (
                      <option key={appointment.appointment_id} value={String(appointment.appointment_id)}>
                        Appointment #{appointment.appointment_id} - {new Date(appointment.appointment_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Procedure (Scan Names) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.procedure}
                    onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Scan names will be auto-filled from appointment tests"
                  />
                  {tests.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      Tests found: {tests.map(t => t.test_type).join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Cost (Grand Total) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_cost}
                    onChange={(e) => setFormData({ ...formData, base_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Bill'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      patient_id: '',
                      appointment_id: '',
                      procedure: '',
                      base_cost: '',
                    });
                    setAppointments([]);
                    setTests([]);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  billings.map((billing) => {
                    const patient = patientMap[billing.patient_id];
                    return (
                      <tr key={billing.billing_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {billing.billing_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient ? patient.name : `ID: ${billing.patient_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {billing.appointment_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {billing.procedure}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${billing.base_cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              billing.status
                            )}`}
                          >
                            {billing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(billing.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {billing.status !== BILLING_STATUS.PAID && (
                            <button
                              onClick={() => handleStatusUpdate(billing.billing_id, BILLING_STATUS.PAID)}
                              disabled={updating}
                              className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                            >
                              Mark as Paid
                            </button>
                          )}
                          {billing.status === BILLING_STATUS.PAID && (
                            <span className="text-gray-400">Paid</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsView;

