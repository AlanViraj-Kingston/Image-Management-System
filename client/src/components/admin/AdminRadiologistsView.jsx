import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

const AdminRadiologistsView = () => {
  const [radiologists, setRadiologists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRadiologists();
  }, []);

  const fetchRadiologists = async () => {
    try {
      setLoading(true);
      setError('');
      const allStaff = await authService.getAllStaff();
      const radiologistsData = allStaff.filter(staff => {
        const role = staff.role?.value || staff.role || '';
        return role.toLowerCase() === 'radiologist';
      });
      setRadiologists(radiologistsData || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load radiologists');
      toast.error(err.detail || err.message || 'Failed to load radiologists');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await authService.activateUser(userId);
      toast.success('Radiologist activated successfully');
      fetchRadiologists(); // Refresh the list
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to activate radiologist');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await authService.deactivateUser(userId);
      toast.success('Radiologist deactivated successfully');
      fetchRadiologists(); // Refresh the list
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to deactivate radiologist');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Radiologists</h2>

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
                  Staff ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
              {radiologists.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No radiologists found
                  </td>
                </tr>
              ) : (
                radiologists.map((radiologist) => (
                  <tr key={radiologist.staff_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {radiologist.staff_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {radiologist.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {radiologist.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {radiologist.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {radiologist.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          radiologist.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {radiologist.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {radiologist.is_active ? (
                        <button
                          onClick={() => handleDeactivate(radiologist.user_id)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(radiologist.user_id)}
                          className="text-green-600 hover:text-green-900 font-semibold"
                        >
                          Activate
                        </button>
                      )}
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

export default AdminRadiologistsView;

