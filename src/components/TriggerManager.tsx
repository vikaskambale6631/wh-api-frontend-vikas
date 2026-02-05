import React, { useState, useEffect } from 'react';
import { googleSheetsService, GoogleSheet, GoogleSheetTrigger } from '@/services/googleSheetsService';

interface TriggerManagerProps {
  sheet: GoogleSheet;
  onBack: () => void;
}

const TriggerManager: React.FC<TriggerManagerProps> = ({ sheet, onBack }) => {
  const [triggers, setTriggers] = useState<GoogleSheetTrigger[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<GoogleSheetTrigger | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTriggers();
    fetchDevices();
  }, [sheet.sheet_id]);

  const fetchTriggers = async () => {
    try {
      setLoading(true);
      const data = await googleSheetsService.getTriggers(sheet.sheet_id);
      setTriggers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch triggers');
      console.error('Error fetching triggers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      // TODO: Replace with actual device service call
      const mockDevices = [
        { device_id: '1', device_name: 'WhatsApp Device 1' },
        { device_id: '2', device_name: 'WhatsApp Device 2' },
      ];
      setDevices(mockDevices);
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  const handleCreateTrigger = () => {
    setEditingTrigger(null);
    setShowCreateModal(true);
  };

  const handleEditTrigger = (trigger: GoogleSheetTrigger) => {
    setEditingTrigger(trigger);
    setShowCreateModal(true);
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!confirm('Are you sure you want to delete this trigger?')) {
      return;
    }

    try {
      await googleSheetsService.deleteTrigger(triggerId);
      fetchTriggers();
    } catch (err) {
      setError('Failed to delete trigger');
      console.error('Error deleting trigger:', err);
    }
  };

  const handleToggleTrigger = async (trigger: GoogleSheetTrigger) => {
    try {
      await googleSheetsService.updateTrigger(trigger.trigger_id, {
        is_enabled: !trigger.is_enabled,
      });
      fetchTriggers();
    } catch (err) {
      setError('Failed to update trigger');
      console.error('Error updating trigger:', err);
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'new_row':
        return 'New Row';
      case 'update_row':
        return 'Update Row';
      case 'time':
        return 'Time-based';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (showCreateModal) {
    return (
      <CreateEditTriggerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        sheet={sheet}
        devices={devices}
        trigger={editingTrigger}
        onSaved={() => {
          setShowCreateModal(false);
          fetchTriggers();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sheets
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            Triggers - {sheet.sheet_name}
          </h2>
        </div>
        <button
          onClick={handleCreateTrigger}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Trigger
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : triggers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No triggers configured yet</div>
          <button
            onClick={handleCreateTrigger}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Your First Trigger
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => (
            <div
              key={trigger.trigger_id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTriggerTypeLabel(trigger.trigger_type)} Trigger
                    </h3>
                    <p className="text-sm text-gray-600">
                      Device: {trigger.device_name || 'Unknown Device'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleTrigger(trigger)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        trigger.is_enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {trigger.is_enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleEditTrigger(trigger)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(trigger.trigger_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Message Template:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-800">
                      {trigger.message_template}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Phone Column:</span>
                      <span className="ml-2 text-gray-600">{trigger.phone_column}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Polling Interval:</span>
                      <span className="ml-2 text-gray-600">{trigger.polling_interval} minutes</span>
                    </div>
                  </div>

                  {trigger.trigger_column && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Trigger Condition:</span>
                      <span className="ml-2 text-gray-600">
                        {trigger.trigger_column} = {trigger.trigger_value}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="ml-2">{formatDate(trigger.created_at)}</span>
                    </div>
                    {trigger.last_triggered_at && (
                      <div>
                        <span className="font-medium text-gray-700">Last Triggered:</span>
                        <span className="ml-2">{formatDate(trigger.last_triggered_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Create/Edit Trigger Modal Component
interface CreateEditTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: GoogleSheet;
  devices: any[];
  trigger?: GoogleSheetTrigger | null;
  onSaved: () => void;
}

const CreateEditTriggerModal: React.FC<CreateEditTriggerModalProps> = ({
  isOpen,
  onClose,
  sheet,
  devices,
  trigger,
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    device_id: trigger?.device_id || '',
    trigger_type: trigger?.trigger_type || 'new_row' as 'new_row' | 'update_row' | 'time',
    message_template: trigger?.message_template || 'Hello {name}, this is an automated message.',
    phone_column: trigger?.phone_column || 'A',
    trigger_column: trigger?.trigger_column || '',
    trigger_value: trigger?.trigger_value || '',
    polling_interval: trigger?.polling_interval || 5,
    is_enabled: trigger?.is_enabled ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      if (trigger) {
        await googleSheetsService.updateTrigger(trigger.trigger_id, formData);
      } else {
        await googleSheetsService.createTrigger(sheet.sheet_id, formData);
      }
      
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save trigger');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {trigger ? 'Edit Trigger' : 'Create Trigger'}
          </h2>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device
              </label>
              <select
                name="device_id"
                value={formData.device_id}
                onChange={handleInputChange}
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
                Trigger Type
              </label>
              <select
                name="trigger_type"
                value={formData.trigger_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="new_row">New Row</option>
                <option value="update_row">Update Row</option>
                <option value="time">Time-based</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Template
            </label>
            <textarea
              name="message_template"
              value={formData.message_template}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Hello {name}, your order {order_id} is ready!"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use {'{column_name}'} placeholders to insert data from your sheet
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Column
              </label>
              <input
                type="text"
                name="phone_column"
                value={formData.phone_column}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Polling Interval (minutes)
              </label>
              <input
                type="number"
                name="polling_interval"
                value={formData.polling_interval}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
          </div>

          {formData.trigger_type === 'update_row' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Column (optional)
                </label>
                <input
                  type="text"
                  name="trigger_column"
                  value={formData.trigger_column}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Value (optional)
                </label>
                <input
                  type="text"
                  name="trigger_value"
                  value={formData.trigger_value}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="active"
                />
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_enabled"
                checked={formData.is_enabled}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Enable trigger</span>
            </label>
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
              {loading ? 'Saving...' : (trigger ? 'Update Trigger' : 'Create Trigger')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TriggerManager;
