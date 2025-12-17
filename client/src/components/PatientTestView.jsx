import { useState, useEffect } from 'react';
import { testService, SCAN_TYPES, TEST_STATUS } from '../services/testService';
import { authService } from '../services/authService';
import { imageService } from '../services/imageService';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';

const PatientTestView = ({ patient, doctorId, onBack }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [radiologists, setRadiologists] = useState([]);
  const [radiologistMap, setRadiologistMap] = useState({});
  const [loadingRadiologists, setLoadingRadiologists] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [imageUrls, setImageUrls] = useState({});
  const [reports, setReports] = useState({});
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportingTest, setReportingTest] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [reportFormData, setReportFormData] = useState({
    findings: '',
    diagnosis: '',
  });
  const [formData, setFormData] = useState({
    test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
    radiologist_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    test_type: '',
    radiologist_id: '',
    status: '',
  });

  useEffect(() => {
    fetchTests();
    fetchRadiologists();
    fetchPatientDetails();
    fetchDoctorName();
  }, [patient.patient_id, doctorId]);

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

  useEffect(() => {
    // Fetch image URLs for tests that have images
    const fetchImageUrls = async () => {
      const urls = {};
      for (const test of tests) {
        if (test.image_id) {
          try {
            const urlData = await imageService.getImageUrl(test.image_id);
            urls[test.test_id] = urlData.presigned_url;
          } catch (err) {
            console.error(`Failed to get image URL for test ${test.test_id}:`, err);
          }
        }
      }
      setImageUrls(urls);
    };

    if (tests.length > 0) {
      fetchImageUrls();
    }
  }, [tests]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await testService.getPatientTests(patient.patient_id);
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
      setLoadingRadiologists(true);
      const data = await authService.getRadiologists();
      setRadiologists(data || []);
      // Create a map for quick lookup
      const map = {};
      (data || []).forEach((rad) => {
        map[rad.staff_id] = rad.name;
      });
      setRadiologistMap(map);
    } catch (err) {
      console.error('Failed to load radiologists:', err);
    } finally {
      setLoadingRadiologists(false);
    }
  };

  const fetchPatientDetails = async () => {
    try {
      const data = await authService.getPatientById(patient.patient_id);
      setPatientDetails(data);
    } catch (err) {
      console.error('Failed to load patient details:', err);
    }
  };

  const fetchDoctorName = async () => {
    try {
      // Get doctor info by user_id
      const staffInfo = await authService.getStaffByUserId(doctorId);
      if (staffInfo) {
        // Get all staff to find the doctor by staff_id
        const allStaff = await authService.getAllStaff();
        const doctor = allStaff.find(s => s.staff_id === staffInfo.staff_id);
        if (doctor) {
          setDoctorName(doctor.name);
        } else {
          // Fallback: use staffInfo name if available
          setDoctorName(staffInfo.name || `ID: ${staffInfo.staff_id}`);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor name:', err);
    }
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const testData = {
        patient_id: patient.patient_id,
        doctor_id: doctorId,
        test_type: formData.test_type,
        radiologist_id: formData.radiologist_id ? parseInt(formData.radiologist_id) : null,
        status: TEST_STATUS.SCAN_TO_BE_TAKEN,
      };

      await testService.createTest(testData);
      toast.success('Test created successfully!');
      setShowCreateForm(false);
      setFormData({
        test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
        radiologist_id: '',
      });
      fetchTests();
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to create test';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateReport = (test) => {
    setReportingTest(test);
    setReportFormData({
      findings: '',
      diagnosis: '',
    });
    setShowReportForm(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingTest) return;

    setGeneratingReport(true);
    try {
      await testService.generateReport(reportingTest.test_id, {
        findings: reportFormData.findings,
        diagnosis: reportFormData.diagnosis,
      });
      toast.success('Report generated successfully!');
      setShowReportForm(false);
      setReportingTest(null);
      setReportFormData({ findings: '', diagnosis: '' });
      fetchTests();
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (test) => {
    const report = reports[test.test_id];
    if (!report) return;

    try {
      // Fetch patient details if not already loaded
      let patientInfo = patientDetails;
      if (!patientInfo) {
        patientInfo = await authService.getPatientById(test.patient_id);
      }

      // Get doctor name if not loaded
      let doctor = doctorName;
      if (!doctor) {
        const staffInfo = await authService.getStaffByUserId(doctorId);
        if (staffInfo) {
          const allStaff = await authService.getAllStaff();
          const doctorStaff = allStaff.find(s => s.staff_id === staffInfo.staff_id);
          if (doctorStaff) {
            doctor = doctorStaff.name;
          }
        }
      }

      // Get radiologist name
      const radiologistName = test.radiologist_id 
        ? (radiologistMap[test.radiologist_id] || `ID: ${test.radiologist_id}`)
        : 'Not assigned';

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header
      pdf.setFillColor(66, 126, 234); // Blue color
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HealthBridge', margin, 25);
      pdf.setFontSize(16);
      pdf.text('Diagnosis Report', pageWidth - margin, 25, { align: 'right' });

      // Reset text color
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
      if (patientInfo) {
        pdf.text(`Name: ${patientInfo.name || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Email: ${patientInfo.email || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Phone: ${patientInfo.phone || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Address: ${patientInfo.address || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Medical Conditions: ${patientInfo.conditions || 'None recorded'}`, margin, yPos);
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
      pdf.text(`Doctor: ${doctor || `ID: ${report.staff_id}`}`, margin, yPos);
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

  const handleEditTest = (test) => {
    setEditingTest(test);
    setEditFormData({
      test_type: test.test_type,
      radiologist_id: test.radiologist_id ? test.radiologist_id.toString() : '',
      status: test.status,
    });
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    setError('');
    setUpdating(true);

    try {
      const updateData = {
        test_type: editFormData.test_type,
        radiologist_id: editFormData.radiologist_id ? parseInt(editFormData.radiologist_id) : null,
        status: editFormData.status,
      };

      await testService.updateTest(editingTest.test_id, updateData);
      toast.success('Test updated successfully!');
      setEditingTest(null);
      setEditFormData({
        test_type: '',
        radiologist_id: '',
        status: '',
      });
      fetchTests();
    } catch (err) {
      const errorMsg = err.detail || err.message || 'Failed to update test';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
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

  return (
    <div className="card max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Tests</h2>
          <p className="text-sm text-gray-600 mt-1">
            {patient.name} (ID: {patient.patient_id})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Test
          </button>
          <button onClick={onBack} className="btn-secondary">
            Back
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Test</h3>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scan Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.test_type}
                onChange={(e) => setFormData({ ...formData, test_type: e.target.value })}
                className="input-field"
                required
                disabled={creating}
              >
                {Object.values(SCAN_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Radiologist
              </label>
              {loadingRadiologists ? (
                <p className="text-sm text-gray-500">Loading radiologists...</p>
              ) : (
                <select
                  value={formData.radiologist_id}
                  onChange={(e) => setFormData({ ...formData, radiologist_id: e.target.value })}
                  className="input-field"
                  disabled={creating}
                >
                  <option value="">Select a radiologist (optional)</option>
                  {radiologists.map((radiologist) => (
                    <option key={radiologist.staff_id} value={radiologist.staff_id}>
                      {radiologist.name} (ID: {radiologist.staff_id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Test'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    test_type: SCAN_TYPES.ABDOMINAL_ULTRASOUND,
                    radiologist_id: '',
                  });
                }}
                className="btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
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
          <span className="ml-3 text-gray-600">Loading tests...</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
          No tests found for this patient.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Radiologist
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((test) => (
                <tr key={test.test_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {test.test_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{test.test_type}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        test.status
                      )}`}
                    >
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {getRadiologistName(test.radiologist_id)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {test.report_id || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {test.image_id && imageUrls[test.test_id] ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={imageUrls[test.test_id]}
                          alt="Scan image"
                          className="w-20 h-20 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(imageUrls[test.test_id], '_blank')}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'block';
                            }
                          }}
                        />
                        <span className="text-gray-600 text-xs" style={{ display: 'none' }}>
                          Image {test.image_id}
                        </span>
                      </div>
                    ) : test.image_id ? (
                      <span className="text-gray-600">Image ID: {test.image_id}</span>
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {test.created_date
                      ? new Date(test.created_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditTest(test)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-left"
                      >
                        Edit
                      </button>
                      {!test.report_id && test.image_id && (
                        <button
                          onClick={() => handleGenerateReport(test)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-left"
                        >
                          Generate Report
                        </button>
                      )}
                      {test.report_id && (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              const report = reports[test.test_id];
                              if (report) {
                                setReportingTest(test);
                                setReportFormData({
                                  findings: report.findings || '',
                                  diagnosis: report.diagnosis || '',
                                });
                                setShowReportForm(true);
                              }
                            }}
                            className="text-green-600 hover:text-green-800 font-medium text-left"
                          >
                            View Report
                          </button>
                          <button
                            onClick={() => handleDownloadReport(test)}
                            className="text-purple-600 hover:text-purple-800 font-medium text-left text-xs"
                          >
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Test</h3>
            <form onSubmit={handleUpdateTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scan Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.test_type}
                  onChange={(e) => setEditFormData({ ...editFormData, test_type: e.target.value })}
                  className="input-field"
                  required
                  disabled={updating}
                >
                  {Object.values(SCAN_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Radiologist
                </label>
                <select
                  value={editFormData.radiologist_id}
                  onChange={(e) => setEditFormData({ ...editFormData, radiologist_id: e.target.value })}
                  className="input-field"
                  disabled={updating}
                >
                  <option value="">Select a radiologist (optional)</option>
                  {radiologists.map((radiologist) => (
                    <option key={radiologist.staff_id} value={radiologist.staff_id}>
                      {radiologist.name} (ID: {radiologist.staff_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="input-field"
                  required
                  disabled={updating}
                >
                  {Object.values(TEST_STATUS).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Test'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTest(null);
                    setEditFormData({
                      test_type: '',
                      radiologist_id: '',
                      status: '',
                    });
                  }}
                  className="btn-secondary flex-1"
                  disabled={updating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Generation Modal */}
      {showReportForm && reportingTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {reportingTest.report_id ? 'View/Update Report' : 'Generate Diagnosis Report'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Test ID: {reportingTest.test_id} | Scan Type: {reportingTest.test_type}
            </p>
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Findings <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportFormData.findings}
                  onChange={(e) => setReportFormData({ ...reportFormData, findings: e.target.value })}
                  className="input-field"
                  rows={6}
                  placeholder="Enter findings from the scan..."
                  required
                  disabled={generatingReport}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportFormData.diagnosis}
                  onChange={(e) => setReportFormData({ ...reportFormData, diagnosis: e.target.value })}
                  className="input-field"
                  rows={6}
                  placeholder="Enter diagnosis based on the scan..."
                  required
                  disabled={generatingReport}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={generatingReport}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {generatingReport
                    ? 'Generating...'
                    : reportingTest.report_id
                    ? 'Update Report'
                    : 'Generate Report'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm(false);
                    setReportingTest(null);
                    setReportFormData({ findings: '', diagnosis: '' });
                  }}
                  className="btn-secondary flex-1"
                  disabled={generatingReport}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientTestView;

