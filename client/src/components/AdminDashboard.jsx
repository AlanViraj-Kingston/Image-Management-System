import { useState } from 'react';
import AdminDashboardView from './admin/AdminDashboardView';
import AdminDoctorsView from './admin/AdminDoctorsView';
import AdminRadiologistsView from './admin/AdminRadiologistsView';
import AdminClerksView from './admin/AdminClerksView';
import AdminPatientsView from './admin/AdminPatientsView';
import AdminAppointmentsView from './admin/AdminAppointmentsView';
import AdminPaymentsView from './admin/AdminPaymentsView';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'doctors', label: 'Doctors', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'radiologists', label: 'Radiologists', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'clerks', label: 'Clerks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'patients', label: 'Patients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'payments', label: 'Payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboardView />;
      case 'doctors':
        return <AdminDoctorsView />;
      case 'radiologists':
        return <AdminRadiologistsView />;
      case 'clerks':
        return <AdminClerksView />;
      case 'patients':
        return <AdminPatientsView />;
      case 'appointments':
        return <AdminAppointmentsView />;
      case 'payments':
        return <AdminPaymentsView />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="flex flex-1 bg-gray-50" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 shadow-lg">
        <div className="p-4 sticky top-0">
          <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={item.icon}
                  />
                </svg>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

