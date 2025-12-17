import { authService } from './authService';
import { appointmentService } from './appointmentService';
import { billingService } from './billingService';

export const dashboardService = {
  /**
   * Get all dashboard statistics
   * @returns {Promise} Dashboard statistics
   */
  async getDashboardStatistics() {
    try {
      // Fetch all data in parallel
      const [allStaff, allPatients, allAppointments, billingStats] = await Promise.all([
        authService.getAllStaff(),
        authService.getAllPatients(),
        appointmentService.getAllAppointments(),
        billingService.getBillingStatistics(),
      ]);

      // Count doctors
      const doctors = allStaff.filter(staff => {
        const role = staff.role?.value || staff.role || '';
        return role.toLowerCase() === 'doctor';
      });

      return {
        totalDoctors: doctors.length,
        totalPatients: allPatients.length,
        totalAppointments: allAppointments.length,
        totalPaid: billingStats.total_paid || 0,
        totalUnpaid: billingStats.total_unpaid || 0,
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get monthly revenue data
   * @param {number} year - Optional year
   * @returns {Promise} Monthly revenue data
   */
  async getMonthlyRevenue(year = null) {
    try {
      return await billingService.getMonthlyRevenue(year);
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

