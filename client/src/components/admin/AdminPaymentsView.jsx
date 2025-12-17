import { useState, useEffect } from 'react';
import { billingService, BILLING_STATUS } from '../../services/billingService';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

const AdminPaymentsView = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientMap, setPatientMap] = useState({});

  useEffect(() => {
    fetchBillings();
  }, []);

  useEffect(() => {
    fetchPatientNames();
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

  const fetchPatientNames = async () => {
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payments & Billing</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsView;

