import React, { useState, useEffect } from 'react';
import { googleSheetsService, GoogleSheet, ManualSendResult } from '@/services/googleSheetsService';
import { deviceService } from '@/services/deviceService';

interface ManualSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: GoogleSheet;
}

const ManualSendModal: React.FC<ManualSendModalProps> = ({ isOpen, onClose, sheet }) => {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('Hello {name}, this is a test message.');
  const [phoneColumn, setPhoneColumn] = useState('A');
  const [sendAll, setSendAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ManualSendResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen]);

  const fetchDevices = async () => {
    try {
      // Fetch real devices from backend
      if (sheet.user_id) {
        const data = await deviceService.getDevices(sheet.user_id);
        setDevices(data);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      // Fallback to empty array
      setDevices([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await googleSheetsService.sendManualMessages(sheet.id, {
        device_id: selectedDevice,
        message_template: messageTemplate,
        phone_column: phoneColumn,
        send_all: sendAll,
      });
      
      // Handle the new response format
      if (response.errors && response.errors.length > 0) {
        setError(`Partial success: ${response.sent} sent, ${response.failed} failed`);
      }
      
      // Convert response to results format for display
      const results = [
        ...Array(response.sent || 0).fill({ status: 'sent', message: 'Message sent successfully' }),
        ...Array(response.failed || 0).fill({ status: 'failed', message: 'Message failed to send' })
      ];
      
      setResults(results);
      setShowResults(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send messages');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDevice('');
    setMessageTemplate('Hello {name}, this is a test message.');
    setPhoneColumn('A');
    setSendAll(true);
    setResults([]);
    setShowResults(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Send Messages - {sheet.sheet_name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showResults ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Device
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Template
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Hello {name}, your order {order_id} is ready!"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Use {'{column_name}'} placeholders to insert data from your sheet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Column
              </label>
              <input
                type="text"
                value={phoneColumn}
                onChange={(e) => setPhoneColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Column letter or name that contains phone numbers
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sendAll}
                  onChange={(e) => setSendAll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Send to all rows</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Messages'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="text-green-800 font-medium mb-2">Send Complete!</h3>
              <div className="text-green-700 text-sm">
                Success: {results.filter(r => r.status === 'sent').length} | 
                Failed: {results.filter(r => r.status === 'failed').length}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              <h4 className="font-medium text-gray-900 mb-2">Results:</h4>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border ${
                      result.status === 'sent'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="text-sm">
                        <span className="font-medium">Row {result.row_number}:</span>
                        {result.phone && <span className="ml-2">{result.phone}</span>}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          result.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                    {result.error && (
                      <div className="text-red-700 text-xs mt-1">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowResults(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Send More
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualSendModal;
