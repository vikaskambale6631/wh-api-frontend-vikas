import React, { useState } from 'react';
import GoogleSheetsList from './GoogleSheetsList';
import ConnectSheetModal from './ConnectSheetModal';
import ManualSendModal from './ManualSendModal';
import SheetDetailView from './SheetDetailView';
import TriggerManager from './TriggerManager';
import { GoogleSheet } from '@/services/googleSheetsService';

type View = 'list' | 'detail' | 'triggers';

const GoogleSheetsIntegration: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showManualSendModal, setShowManualSendModal] = useState(false);

  const handleSheetSelect = (sheet: GoogleSheet) => {
    setSelectedSheet(sheet);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setSelectedSheet(null);
    setCurrentView('list');
  };

  const handleConnectNew = () => {
    setShowConnectModal(true);
  };

  const handleSheetConnected = () => {
    // Refresh the list by triggering a re-render
    // In a real app, you'd want to refetch the data
    setShowConnectModal(false);
  };

  const handleManualSend = () => {
    setShowManualSendModal(true);
  };

  const handleManageTriggers = () => {
    setCurrentView('triggers');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <GoogleSheetsList
            onSheetSelect={handleSheetSelect}
            onConnectNew={handleConnectNew}
          />
        );
      
      case 'detail':
        return selectedSheet ? (
          <SheetDetailView
            sheet={selectedSheet}
            onBack={handleBackToList}
            onManualSend={handleManualSend}
            onManageTriggers={handleManageTriggers}
          />
        ) : null;
      
      case 'triggers':
        return selectedSheet ? (
          <TriggerManager
            sheet={selectedSheet}
            onBack={handleBackToList}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Google Sheets Integration
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect your Google Sheets and automate WhatsApp messaging
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-6 sm:px-0">
          {renderCurrentView()}
        </div>

        {/* Modals */}
        <ConnectSheetModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onSheetConnected={handleSheetConnected}
        />

        {selectedSheet && (
          <ManualSendModal
            isOpen={showManualSendModal}
            onClose={() => setShowManualSendModal(false)}
            sheet={selectedSheet}
          />
        )}
      </div>
    </div>
  );
};

export default GoogleSheetsIntegration;
