import { useState } from 'react';
import { Link } from 'react-router-dom';
import PatientRegistrationForm from '../components/PatientRegistrationForm';
import StaffRegistrationForm from '../components/StaffRegistrationForm';

const RegisterPage = () => {
  const [userType, setUserType] = useState('patient');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-medical-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-100 p-4 rounded-full">
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-600 text-lg">
            Register as a patient or medical staff member
          </p>
        </div>

        {/* Registration Card */}
        <div className="card">
          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am registering as:
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Patient Option */}
              <label
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  userType === 'patient'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  value="patient"
                  checked={userType === 'patient'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    userType === 'patient'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
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
                <span
                  className={`font-semibold ${
                    userType === 'patient'
                      ? 'text-primary-700'
                      : 'text-gray-700'
                  }`}
                >
                  Patient
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Register as a patient
                </span>
              </label>

              {/* Medical Staff Option */}
              <label
                className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  userType === 'staff'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  value="staff"
                  checked={userType === 'staff'}
                  onChange={(e) => setUserType(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    userType === 'staff'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span
                  className={`font-semibold ${
                    userType === 'staff'
                      ? 'text-primary-700'
                      : 'text-gray-700'
                  }`}
                >
                  Medical Staff
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Doctor, Radiologist, Clerk, etc.
                </span>
              </label>
            </div>
          </div>

          {/* Registration Form */}
          <div className="border-t border-gray-200 pt-6">
            {userType === 'patient' ? (
              <PatientRegistrationForm />
            ) : (
              <StaffRegistrationForm />
            )}
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

