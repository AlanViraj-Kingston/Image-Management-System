import { useState, useEffect } from 'react';
import { workflowLogService } from '../../services/workflowLogService';
import { authService } from '../../services/authService';
import { toast } from 'react-toastify';

const AdminWorkflowLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userMap, setUserMap] = useState({});
  const [filterUserId, setFilterUserId] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    fetchLogs();
    fetchUsers();
  }, [filterUserId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const userId = filterUserId ? parseInt(filterUserId) : null;
      const data = await workflowLogService.getAllLogs(userId, 500);
      setLogs(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load workflow logs');
      toast.error(err.detail || err.message || 'Failed to load workflow logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [allPatients, allStaff] = await Promise.all([
        authService.getAllPatients(),
        authService.getAllStaff(),
      ]);

      const userMapData = {};
      
      // Map patients
      (allPatients || []).forEach(patient => {
        userMapData[patient.user_id] = {
          name: patient.name,
          type: 'Patient',
          id: patient.patient_id,
        };
      });

      // Map staff
      (allStaff || []).forEach(staff => {
        userMapData[staff.user_id] = {
          name: staff.name,
          type: staff.role?.value || staff.role || 'Staff',
          id: staff.staff_id,
        };
      });

      setUserMap(userMapData);

      // Create combined list for filter dropdown
      const combinedUsers = [
        ...(allPatients || []).map(p => ({ user_id: p.user_id, name: p.name, type: 'Patient' })),
        ...(allStaff || []).map(s => ({ 
          user_id: s.user_id, 
          name: s.name, 
          type: s.role?.value || s.role || 'Staff' 
        })),
      ];
      setAllUsers(combinedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const getUserName = (userId) => {
    const user = userMap[userId];
    if (user) {
      return `${user.name} (${user.type})`;
    }
    return `User ID: ${userId}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Workflow Logs</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Filter by User:</label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {allUsers.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} ({user.type})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
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
                  Log ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No workflow logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.log_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUserName(log.user_id)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(log.timestamp)}
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

export default AdminWorkflowLogsView;

