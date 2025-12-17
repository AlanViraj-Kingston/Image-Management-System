import { useState, useEffect } from 'react';
import { appointmentService, APPOINTMENT_STATUS } from '../services/appointmentService';
import { authService } from '../services/authService';
import PatientTestView from './PatientTestView';
import { toast } from 'react-toastify';

const DoctorAppointmentsView = ({ doctorId, staffId, onBack }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientMap, setPatientMap] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [staffId]);

  useEffect(() => {
    // Fetch patient details for all appointments
    const fetchPatients = async () => {
      const map = {};
      for (const appointment of appointments) {
        if (!map[appointment.patient_id]) {
          try {
            const patient = await authService.getPatientById(appointment.patient_id);
            map[appointment.patient_id] = patient;
          } catch (err) {
            console.error(`Failed to fetch patient ${appointment.patient_id}:`, err);
          }
        }
      }
      setPatientMap(map);
    };

    if (appointments.length > 0) {
      fetchPatients();
    }
  }, [appointments]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await appointmentService.getDoctorAppointments(staffId);
      setAppointments(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load appointments');
      toast.error(err.detail || err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
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

  const handleAppointmentClick = (appointment) => {
    const patient = patientMap[appointment.patient_id];
    if (patient) {
      setSelectedAppointment({ ...appointment, patient });
    } else {
      toast.error('Patient information not available');
    }
  };

  if (selectedAppointment) {
    return (
      <PatientTestView
        patient={selectedAppointment.patient}
        doctorId={doctorId}
        onBack={() => setSelectedAppointment(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
        </div>

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
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
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
                  appointments.map((appointment) => {
                    const patient = patientMap[appointment.patient_id];
                    return (
                      <tr key={appointment.appointment_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {appointment.appointment_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient ? patient.name : `ID: ${appointment.patient_id}`}
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {appointment.notes || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleAppointmentClick(appointment)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View Patient Tests
                          </button>
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

export default DoctorAppointmentsView;

