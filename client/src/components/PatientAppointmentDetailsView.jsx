import { useState, useEffect } from 'react';
import { testService, TEST_STATUS } from '../services/testService';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';

const PatientAppointmentDetailsView = ({ appointment, patientInfo, doctorName, onBack }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState({});
  const [radiologistMap, setRadiologistMap] = useState({});

  useEffect(() => {
    if (patientInfo?.patient_id) {
      fetchTests();
      fetchRadiologists();
    }
  }, [patientInfo?.patient_id]);

  useEffect(() => {
    // Fetch reports for tests that have report_id
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

    if (tests.length > 0) {
      fetchReports();
    }
  }, [tests]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await testService.getAppointmentTests(appointment.appointment_id);
      setTests(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load tests');
      toast.error(err.detail || err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchRadiologists = async () => {
    try {
      const { authService } = await import('../services/authService');
      const allStaff = await authService.getAllStaff();
      const radiologists = allStaff.filter(s => {
        const role = s.role?.value || s.role || '';
        return role.toLowerCase() === 'radiologist';
      });
      const map = {};
      radiologists.forEach((rad) => {
        map[rad.staff_id] = rad.name;
      });
      setRadiologistMap(map);
    } catch (err) {
      console.error('Failed to load radiologists:', err);
    }
  };

  const getRadiologistName = (radiologistId) => {
    if (!radiologistId) return '—';
    return radiologistMap[radiologistId] || `ID: ${radiologistId}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case TEST_STATUS.SCAN_TO_BE_TAKEN:
        return 'bg-yellow-100 text-yellow-800';
      case TEST_STATUS.SCAN_IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TEST_STATUS.SCAN_DONE:
        return 'bg-green-100 text-green-800';
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

  const handleDownloadReport = async (test) => {
    const report = reports[test.test_id];
    if (!report) {
      toast.error('Report not available');
      return;
    }

    try {
      // Fetch patient details if not available
      let patient = patientInfo;
      if (!patient) {
        const { authService } = await import('../services/authService');
        patient = await authService.getPatientById(test.patient_id);
      }

      // Get doctor name
      const doctor = doctorName || `ID: ${test.doctor_id}`;

      // Get radiologist name
      const radiologistName = getRadiologistName(test.radiologist_id);

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header
      pdf.setFillColor(66, 126, 234);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HealthBridge', margin, 25);
      pdf.setFontSize(16);
      pdf.text('Diagnosis Report', pageWidth - margin, 25, { align: 'right' });

      pdf.setTextColor(0, 0, 0);
      yPos = 50;

      // Report Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Information', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const reportDate = new Date(report.updated_date || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Report ID: ${report.report_id}`, margin, yPos);
      pdf.text(`Date: ${reportDate}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;
      pdf.text(`Test ID: ${test.test_id}`, margin, yPos);
      yPos += 15;

      // Patient Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Patient Information', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      if (patient) {
        pdf.text(`Name: ${patient.name || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Email: ${patient.email || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Phone: ${patient.phone || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Address: ${patient.address || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Medical Conditions: ${patient.conditions || 'None recorded'}`, margin, yPos);
      } else {
        pdf.text(`Patient ID: ${test.patient_id}`, margin, yPos);
      }
      yPos += 15;

      // Medical Staff Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Medical Staff Information', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Doctor: ${doctor}`, margin, yPos);
      yPos += 7;
      pdf.text(`Radiologist: ${radiologistName}`, margin, yPos);
      yPos += 15;

      // Scan Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan Information', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Scan Type: ${test.test_type}`, margin, yPos);
      yPos += 7;
      pdf.text(`Status: ${test.status}`, margin, yPos);
      yPos += 15;

      // Findings Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Findings', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const findings = report.findings || 'No findings recorded.';
      const findingsLines = pdf.splitTextToSize(findings, pageWidth - 2 * margin);
      findingsLines.forEach((line) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(line, margin, yPos);
        yPos += 7;
      });
      yPos += 10;

      // Diagnosis Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text('Diagnosis', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const diagnosis = report.diagnosis || 'No diagnosis recorded.';
      const diagnosisLines = pdf.splitTextToSize(diagnosis, pageWidth - 2 * margin);
      diagnosisLines.forEach((line) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }
        pdf.text(line, margin, yPos);
        yPos += 7;
      });

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        pdf.text(
          'HealthBridge - Medical Diagnosis Report',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Download PDF
      pdf.save(`Diagnosis_Report_${report.report_id}_Test_${test.test_id}.pdf`);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Appointment ID: {appointment.appointment_id} | Doctor: {doctorName || `ID: ${appointment.doctor_id}`}
            </p>
          </div>
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
          <div>
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
                        Radiologist
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                test.status
                              )}`}
                            >
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getRadiologistName(test.radiologist_id)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(test.created_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {report ? (
                              <span className="text-green-600 font-medium">Available</span>
                            ) : (
                              <span className="text-gray-400">No report</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {report ? (
                              <button
                                onClick={() => handleDownloadReport(test)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Download Report
                              </button>
                            ) : (
                              <span className="text-gray-400">No report available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentDetailsView;

