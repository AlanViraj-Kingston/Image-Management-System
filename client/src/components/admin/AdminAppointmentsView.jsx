import { useState, useEffect } from 'react';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { testService } from '../../services/testService';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

const AdminAppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [tests, setTests] = useState([]);
  const [reports, setReports] = useState({});
  const [patientMap, setPatientMap] = useState({});
  const [doctorMap, setDoctorMap] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointment) {
      fetchTestsForAppointment();
    }
  }, [selectedAppointment]);

  useEffect(() => {
    fetchPatientAndDoctorNames();
  }, [appointments]);

  useEffect(() => {
    fetchReports();
  }, [tests]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentService.getAllAppointments();
      setAppointments(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load appointments');
      toast.error(err.detail || err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAndDoctorNames = async () => {
    const patientMap = {};
    const doctorMap = {};
    
    for (const appointment of appointments) {
      if (!patientMap[appointment.patient_id]) {
        try {
          const patient = await authService.getPatientById(appointment.patient_id);
          patientMap[appointment.patient_id] = patient;
        } catch (err) {
          console.error(`Failed to fetch patient ${appointment.patient_id}:`, err);
        }
      }
      
      if (!doctorMap[appointment.doctor_id]) {
        try {
          const allStaff = await authService.getAllStaff();
          const doctor = allStaff.find(s => s.staff_id === appointment.doctor_id);
          if (doctor) {
            doctorMap[appointment.doctor_id] = doctor.name;
          }
        } catch (err) {
          console.error(`Failed to fetch doctor ${appointment.doctor_id}:`, err);
        }
      }
    }
    
    setPatientMap(patientMap);
    setDoctorMap(doctorMap);
  };

  const fetchTestsForAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      const data = await testService.getAppointmentTests(selectedAppointment.appointment_id);
      setTests(data || []);
    } catch (err) {
      console.error('Failed to load tests:', err);
      toast.error('Failed to load tests');
    }
  };

  const fetchReports = async () => {
    const reportMap = {};
    for (const test of tests) {
      if (test.report_id) {
        try {
          const reportData = await testService.getReport(test.report_id);
          reportMap[test.test_id] = reportData;
        } catch (err) {
          console.error(`Failed to get report for test ${test.test_id}:`, err);
        }
      }
    }
    setReports(reportMap);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case APPOINTMENT_STATUS.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case APPOINTMENT_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case APPOINTMENT_STATUS.CANCELLED:
        return 'bg-red-100 text-red-800';
      case APPOINTMENT_STATUS.NO_SHOW:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (selectedAppointment) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Appointment ID: {selectedAppointment.appointment_id} | 
              Patient: {patientMap[selectedAppointment.patient_id]?.name || `ID: ${selectedAppointment.patient_id}`} | 
              Doctor: {doctorMap[selectedAppointment.doctor_id] || `ID: ${selectedAppointment.doctor_id}`}
            </p>
          </div>
          <button
            onClick={() => setSelectedAppointment(null)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tests & Reports</h3>
          {tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tests found for this appointment
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scan Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Findings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => {
                    const report = reports[test.test_id];
                    return (
                      <tr key={test.test_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.test_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.test_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {test.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {test.report_id || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {report?.findings || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {report?.diagnosis || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>

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
                  Appointment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.appointment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.appointment_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patientMap[appointment.patient_id]?.name || `ID: ${appointment.patient_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doctorMap[appointment.doctor_id] || `ID: ${appointment.doctor_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(appointment.appointment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Tests & Reports
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentsView;

