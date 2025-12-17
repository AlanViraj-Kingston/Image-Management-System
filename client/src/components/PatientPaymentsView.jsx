import { useState, useEffect } from 'react';
import { billingService, BILLING_STATUS } from '../services/billingService';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';

const PatientPaymentsView = ({ patientId, onBack }) => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientInfo, setPatientInfo] = useState(null);

  useEffect(() => {
    fetchPatientInfo();
  }, [patientId]);

  useEffect(() => {
    if (patientInfo?.patient_id) {
      fetchBillings();
    }
  }, [patientInfo?.patient_id]);

  const fetchPatientInfo = async () => {
    try {
      const data = await authService.getPatientByUserId(patientId);
      setPatientInfo(data);
    } catch (err) {
      console.error('Failed to load patient info:', err);
    }
  };

  const fetchBillings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await billingService.getPatientBillings(patientInfo.patient_id);
      setBillings(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load bills');
      toast.error(err.detail || err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case BILLING_STATUS.UNPAID:
        return 'bg-red-100 text-red-800';
      case BILLING_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case BILLING_STATUS.PAID:
        return 'bg-green-100 text-green-800';
      case BILLING_STATUS.OVERDUE:
        return 'bg-orange-100 text-orange-800';
      case BILLING_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800';
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

  const handleDownloadBill = async (billing) => {
    try {
      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header with blue background
      pdf.setFillColor(66, 126, 234);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HealthBridge', margin, 30);
      pdf.setFontSize(18);
      pdf.text('Medical Billing Statement', pageWidth - margin, 30, { align: 'right' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('123 Medical Center Drive, Healthcare City, HC 12345', margin, 42);
      pdf.text('Phone: (555) 123-4567 | Email: billing@healthbridge.com', pageWidth - margin, 42, { align: 'right' });

      // Reset text color
      pdf.setTextColor(0, 0, 0);
      yPos = 60;

      // Bill Information Box
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, 'FD');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BILL INFORMATION', margin + 5, yPos + 8);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const billDate = new Date(billing.created_at || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      pdf.text(`Bill ID: #${billing.billing_id}`, margin + 5, yPos + 18);
      pdf.text(`Date: ${billDate}`, pageWidth - margin - 5, yPos + 18, { align: 'right' });
      if (billing.appointment_id) {
        pdf.text(`Appointment ID: #${billing.appointment_id}`, margin + 5, yPos + 25);
      }
      yPos += 40;

      // Patient Information Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BILL TO', margin, yPos);
      yPos += 8;

      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, yPos, (pageWidth - 2 * margin) / 2, 40, 3, 3, 'FD');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let patientY = yPos + 8;
      if (patientInfo) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(patientInfo.name || 'N/A', margin + 5, patientY);
        patientY += 7;
        pdf.setFont('helvetica', 'normal');
        if (patientInfo.email) {
          pdf.text(patientInfo.email, margin + 5, patientY);
          patientY += 7;
        }
        if (patientInfo.phone) {
          pdf.text(`Phone: ${patientInfo.phone}`, margin + 5, patientY);
          patientY += 7;
        }
        if (patientInfo.address) {
          const addressLines = pdf.splitTextToSize(patientInfo.address, (pageWidth - 2 * margin) / 2 - 10);
          addressLines.forEach((line, index) => {
            pdf.text(line, margin + 5, patientY + (index * 7));
          });
        }
      } else {
        pdf.text(`Patient ID: ${billing.patient_id}`, margin + 5, patientY);
      }
      yPos += 50;

      // Billing Details Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BILLING DETAILS', margin, yPos);
      yPos += 10;

      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', margin + 5, yPos + 7);
      pdf.text('Amount', pageWidth - margin - 5, yPos + 7, { align: 'right' });
      yPos += 12;

      // Procedure details
      pdf.setFont('helvetica', 'normal');
      const procedureLines = pdf.splitTextToSize(billing.procedure, pageWidth - 2 * margin - 60);
      procedureLines.forEach((line, index) => {
        pdf.text(line, margin + 5, yPos + (index * 7));
      });
      pdf.setFont('helvetica', 'bold');
      pdf.text(`$${billing.base_cost.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += Math.max(procedureLines.length * 7, 10) + 5;

      // Total section
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL AMOUNT DUE:', pageWidth - margin - 60, yPos, { align: 'right' });
      pdf.setFontSize(16);
      pdf.text(`$${billing.base_cost.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 15;

      // Payment Status Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Status:', margin, yPos);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const statusText = billing.status.charAt(0).toUpperCase() + billing.status.slice(1);
      const statusColor = billing.status === BILLING_STATUS.PAID ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(statusText, margin + 50, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 20;

      // Payment Instructions
      if (billing.status !== BILLING_STATUS.PAID) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment Instructions:', margin, yPos);
        yPos += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Please make payment within 30 days of the bill date.', margin, yPos);
        yPos += 7;
        pdf.text('For payment inquiries, contact our billing department.', margin, yPos);
        yPos += 7;
        pdf.text('Email: billing@healthbridge.com | Phone: (555) 123-4567', margin, yPos);
        yPos += 15;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        'This is an official billing statement from HealthBridge Medical Center.',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
      pdf.text(
        'For inquiries, please contact HealthBridge support at billing@healthbridge.com',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      pdf.text(
        `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Download PDF
      pdf.save(`Bill_${billing.billing_id}_${new Date().getTime()}.pdf`);
      toast.success('Bill downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF bill');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Bills</h2>
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
                    Bill ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  billings.map((billing) => (
                    <tr key={billing.billing_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {billing.billing_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {billing.appointment_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {billing.procedure}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ${billing.base_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                            billing.status
                          )}`}
                        >
                          {billing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(billing.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDownloadBill(billing)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Download Bill
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
    </div>
  );
};

export default PatientPaymentsView;

