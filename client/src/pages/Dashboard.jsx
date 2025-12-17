import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PatientDetails from '../components/PatientDetails';
import PatientTestView from '../components/PatientTestView';
import RadiologistTestsView from '../components/RadiologistTestsView';
import { authService } from '../services/authService';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');
  const [staffInfo, setStaffInfo] = useState(null);
  const [loadingStaffInfo, setLoadingStaffInfo] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPatient = user?.user_type === 'patient';
  const isStaff = user?.user_type === 'staff';
  // Handle role as enum or string, convert to lowercase for comparison
  const staffRoleRaw = staffInfo?.role;
  const staffRole = staffRoleRaw?.value?.toLowerCase() 
    || (typeof staffRoleRaw === 'string' ? staffRoleRaw.toLowerCase() : String(staffRoleRaw || '').toLowerCase());
  const isRadiologist = staffRole === 'radiologist';
  const isDoctor = staffRole === 'doctor';
  
  // Debug logging
  if (isStaff && staffInfo) {
    console.log('Role check - staffRole:', staffRole, 'isRadiologist:', isRadiologist, 'isDoctor:', isDoctor);
  }

  const handleCardClick = (view) => {
    setActiveView(view);
  };

  const handleBack = () => {
    setActiveView(null);
  };

  useEffect(() => {
    const fetchStaffInfo = async () => {
      if (isStaff && user?.user_id && !staffInfo && !loadingStaffInfo) {
        setLoadingStaffInfo(true);
        try {
          const data = await authService.getStaffByUserId(user.user_id);
          console.log('Fetched staff info:', data);
          console.log('Staff role:', data?.role, 'Type:', typeof data?.role);
          setStaffInfo(data);
        } catch (err) {
          console.error('Failed to fetch staff info:', err);
          // If fetch fails, still set loading to false so UI doesn't hang
        } finally {
          setLoadingStaffInfo(false);
        }
      }
    };

    fetchStaffInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, user?.user_id]);

  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsError('');
      setPatientsLoading(true);
      try {
        const data = await authService.getAllPatients();
        setPatients(data || []);
      } catch (err) {
        setPatientsError(
          err.detail || err.message || 'Failed to load patients list'
        );
      } finally {
        setPatientsLoading(false);
      }
    };

    if (isDoctor && activeView === 'patients' && patients.length === 0 && !patientsLoading) {
      fetchPatients();
    }
  }, [activeView, isDoctor, patients.length, patientsLoading]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-primary-100 p-2 rounded-lg mr-3">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                HealthBridge
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {isPatient && activeView === 'details' ? (
          <PatientDetails userId={user.user_id} onBack={handleBack} />
        ) : isRadiologist && activeView === 'tests' ? (
          <RadiologistTestsView
            radiologistId={staffInfo?.staff_id}
            onBack={handleBack}
          />
        ) : isDoctor && selectedPatient ? (
          <PatientTestView
            patient={selectedPatient}
            doctorId={user.user_id}
            onBack={() => setSelectedPatient(null)}
          />
        ) : isDoctor && activeView === 'patients' ? (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
              <button onClick={handleBack} className="btn-secondary">
                Back
              </button>
            </div>

            {patientsError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
                <p className="text-sm text-red-700">{patientsError}</p>
              </div>
            )}

            {patientsLoading ? (
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
                <span className="ml-3 text-gray-600">Loading patients...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
                No patients found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conditions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr
                        key={patient.patient_id || patient.user_id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {patient.patient_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {patient.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {patient.email || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {patient.date_of_birth
                            ? new Date(patient.date_of_birth).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {patient.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={patient.address || ''}>
                          {patient.address || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                          <div className="truncate" title={patient.conditions || ''}>
                            {patient.conditions || '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              patient.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {patient.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Welcome, {user.name}!
              </h2>
              
              {isPatient ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Your Details Card */}
                  <button
                    onClick={() => handleCardClick('details')}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Your Details
                    </h3>
                    <p className="text-gray-600 text-sm">
                      View and edit your personal information and medical details
                    </p>
                  </button>

                  {/* Reports Card */}
                  <button
                    onClick={() => handleCardClick('reports')}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Reports
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Access your medical reports and diagnostic results
                    </p>
                  </button>

                  {/* Payments Card */}
                  <button
                    onClick={() => handleCardClick('payments')}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-purple-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <svg
                          className="w-8 h-8 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Payments
                    </h3>
                    <p className="text-gray-600 text-sm">
                      View your billing history and payment information
                    </p>
                  </button>
                </div>
              ) : isStaff && loadingStaffInfo ? (
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
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : isRadiologist ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => handleCardClick('tests')}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      View Tests
                    </h3>
                    <p className="text-gray-600 text-sm">
                      View and manage assigned scan tests
                    </p>
                  </button>
                </div>
              ) : isDoctor ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button
                    onClick={() => handleCardClick('patients')}
                    className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer text-left group"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Patients
                    </h3>
                    <p className="text-gray-600 text-sm">
                      View all patients and their medical details
                    </p>
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Dashboard Content
                  </h3>
                  <p className="text-gray-600">
                    This is a placeholder for the main dashboard content.
                    Additional features and modules will be added here based on
                    user roles and permissions.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact HealthBridge</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>+1 (555) 234-5678</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>support@healthbridge.com</span>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 mr-3 mt-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>456 Healthcare Boulevard, Medical District, MD 12345</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About HealthBridge
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Medical Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Patient Portal
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help & Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Operating Hours */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Service Hours</h3>
              <div className="space-y-2 text-gray-300">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>7:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>8:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>9:00 AM - 2:00 PM</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm">
                    <span className="font-semibold">Emergency Services:</span> 24/7
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Support Hotline:</span> Available 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p className="mb-2">
              &copy; {new Date().getFullYear()} HealthBridge. All rights reserved.
            </p>
            <p className="text-xs">
              Connecting healthcare professionals and patients through innovative technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;


