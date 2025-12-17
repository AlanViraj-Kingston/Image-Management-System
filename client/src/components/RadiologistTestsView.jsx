import { useState, useEffect } from 'react';
import { testService, TEST_STATUS } from '../services/testService';
import { imageService, SCAN_TO_IMAGE_TYPE } from '../services/imageService';
import { toast } from 'react-toastify';

const RadiologistTestsView = ({ radiologistId, onBack }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    fetchTests();
  }, [radiologistId]);

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
      const data = await testService.getRadiologistTests(radiologistId);
      setTests(data || []);
    } catch (err) {
      setError(err.detail || err.message || 'Failed to load tests');
      toast.error(err.detail || err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
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

  if (selectedTest) {
    return (
      <TestImageUpload
        test={selectedTest}
        radiologistId={radiologistId}
        onBack={() => {
          setSelectedTest(null);
          fetchTests();
        }}
      />
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assigned Tests</h2>
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-red-700">{error}</p>
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
          No tests assigned to you.
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
                  Patient ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
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
                  <td className="px-6 py-4 text-sm text-gray-700">{test.patient_id}</td>
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
                  <td className="px-6 py-4 text-sm">
                    {test.image_id && imageUrls[test.test_id] ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={imageUrls[test.test_id]}
                          alt="Scan image"
                          className="w-16 h-16 object-cover rounded border border-gray-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
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
                    <button
                      onClick={() => setSelectedTest(test)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View/Upload
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TestImageUpload = ({ test, radiologistId, onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (test.image_id) {
      fetchImageData();
    }
  }, [test.image_id]);

  const fetchImageData = async () => {
    try {
      const data = await imageService.getImage(test.image_id);
      setImageData(data);
      const urlData = await imageService.getImageUrl(test.image_id);
      setImageUrl(urlData.presigned_url);
    } catch (err) {
      console.error('Failed to fetch image:', err);
      toast.error('Failed to load image');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, BMP)');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Delete existing image if any
      if (test.image_id) {
        try {
          await imageService.deleteImage(test.image_id);
        } catch (err) {
          console.error('Failed to delete old image:', err);
        }
      }

      // Map scan type to image type
      const imageType = SCAN_TO_IMAGE_TYPE[test.test_type] || 'other';

      // Upload new image
      const uploadResponse = await imageService.uploadImage(
        test.patient_id,
        imageType,
        radiologistId,
        selectedFile
      );

      // Update test with new image_id
      await testService.updateTest(test.test_id, {
        image_id: uploadResponse.image_id,
        status: TEST_STATUS.SCAN_IN_PROGRESS,
      });

      toast.success('Image uploaded successfully!');
      setSelectedFile(null);
      // Refresh image data
      setImageData({
        image_id: uploadResponse.image_id,
        img_url: uploadResponse.img_url,
      });
      setImageUrl(uploadResponse.presigned_url);
      // Update local test object
      test.image_id = uploadResponse.image_id;
      test.status = TEST_STATUS.SCAN_IN_PROGRESS;
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!test.image_id) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeleting(true);
    try {
      await imageService.deleteImage(test.image_id);
      await testService.updateTest(test.test_id, {
        image_id: null,
      });

      toast.success('Image deleted successfully!');
      setImageData(null);
      setImageUrl(null);
      test.image_id = null;
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await testService.updateTest(test.test_id, {
        status: newStatus,
      });
      toast.success('Status updated successfully!');
      test.status = newStatus;
    } catch (err) {
      toast.error(err.detail || err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Test Details</h2>
          <p className="text-sm text-gray-600 mt-1">
            Test ID: {test.test_id} | Patient ID: {test.patient_id} | Type: {test.test_type}
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary">
          Back
        </button>
      </div>

      <div className="space-y-6">
        {/* Current Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <p className="text-lg font-semibold text-gray-900">{test.status}</p>
            </div>
            {test.status !== TEST_STATUS.SCAN_DONE && (
              <button
                onClick={() => handleStatusChange(TEST_STATUS.SCAN_DONE)}
                disabled={updatingStatus}
                className="btn-primary disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Mark as Scan Done'}
              </button>
            )}
          </div>
        </div>

        {/* Current Image */}
        {imageData && imageUrl && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Image</h3>
              <button
                onClick={handleDeleteImage}
                disabled={deleting}
                className="btn-secondary text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Image'}
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt="Scan image"
                className="max-w-full max-h-96 object-contain rounded border border-gray-300"
                onError={() => {
                  toast.error('Failed to load image');
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Image ID: {imageData.image_id} | File: {imageData.file_name}
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {test.image_id ? 'Replace Image' : 'Upload Image'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image File
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp"
                onChange={handleFileChange}
                className="input-field"
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: JPEG, PNG, GIF, BMP (Max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-700">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn-primary disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : test.image_id ? 'Replace Image' : 'Upload Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologistTestsView;

