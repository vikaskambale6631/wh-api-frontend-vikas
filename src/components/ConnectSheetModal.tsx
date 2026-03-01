import React, { useState } from 'react';
import { googleSheetService } from '@/services/googleSheetService';

interface ConnectSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSheetConnected: () => void;
}

const ConnectSheetModal: React.FC<ConnectSheetModalProps> = ({
  isOpen,
  onClose,
  onSheetConnected,
}) => {
  const [formData, setFormData] = useState({
    sheet_name: '',
    spreadsheet_id: '',
    worksheet_name: '', // Optional
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sheet_name || !formData.spreadsheet_id) {
      setError('Please fill in required fields (Sheet Name & Spreadsheet ID)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await googleSheetService.connectSheet(formData);

      // Reset form
      setFormData({ sheet_name: '', spreadsheet_id: '', worksheet_name: '' });

      // Notify parent
      onSheetConnected();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Connect Google Sheet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-800 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sheet_name" className="block text-sm font-medium text-gray-700 mb-1">
              Sheet Name
            </label>
            <input
              type="text"
              id="sheet_name"
              name="sheet_name"
              value={formData.sheet_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Customer Contacts"
              required
            />
          </div>

          <div>
            <label htmlFor="spreadsheet_id" className="block text-sm font-medium text-gray-700 mb-1">
              Spreadsheet ID
            </label>
            <input
              type="text"
              id="spreadsheet_id"
              name="spreadsheet_id"
              value={formData.spreadsheet_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Found in your Google Sheets URL:
              https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
            </p>
          </div>

          <div>
            <label htmlFor="worksheet_name" className="block text-sm font-medium text-gray-700 mb-1">
              Worksheet Name
            </label>
            <input
              type="text"
              id="worksheet_name"
              name="worksheet_name"
              value={formData.worksheet_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Sheet1 (Optional, auto-detects first sheet)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to automatically connect to the first available worksheet in your spreadsheet.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
              {loading ? 'Connecting...' : 'Connect Sheet'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-blue-800 text-sm">
            <strong>Note:</strong> Make sure your Google Sheet is publicly accessible or
            shared with the service account. You'll need to set up OAuth credentials
            for production use.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectSheetModal;
