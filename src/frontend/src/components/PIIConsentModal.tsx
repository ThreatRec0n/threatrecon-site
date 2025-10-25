import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, Eye } from 'lucide-react';

interface PIIConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  retentionDays?: number;
}

export default function PIIConsentModal({ 
  isOpen, 
  onAccept, 
  onCancel, 
  retentionDays = 7 
}: PIIConsentModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const consentText = `This hosted version is for simulation only. Do NOT enter real personal data, customer names, production credentials, PHI, or regulated information. Use role titles and generic system labels only. For sensitive scenarios or real names, deploy the self-hosted version.

By proceeding, you acknowledge that:
- You will NOT enter real personal information
- You will NOT use real customer names or data  
- You will NOT include production credentials or secrets
- You will use role titles (e.g., "CFO", "SOC Analyst") instead of real names
- You understand that session data may be automatically deleted after ${retentionDays} days
- You understand this is a simulation platform, not a real incident response system`;

  const handleAccept = () => {
    if (acknowledged) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-600 rounded-t-lg p-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Data Safety Acknowledgment Required</h2>
              <p className="text-red-100">Please read and acknowledge before starting your drill</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icons */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-700">
            <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div className="text-red-200">
              <p className="font-medium">Important: This is a simulation platform</p>
              <p className="text-sm">Do not enter real personal data or production information</p>
            </div>
          </div>

          {/* Consent Text */}
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <Eye className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Data Safety Rules</h3>
                <div className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                  {consentText}
                </div>
              </div>
            </div>
          </div>

          {/* Data Retention Notice */}
          <div className="bg-yellow-900 bg-opacity-30 rounded-lg p-4 mb-6 border border-yellow-700">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div className="text-yellow-200">
                <p className="font-medium">Data Retention Policy</p>
                <p className="text-sm">
                  Session data, including logs, decisions, and AAR exports, will be automatically 
                  deleted after {retentionDays} days in the public SaaS environment. This includes 
                  all audit trails and participant information.
                </p>
              </div>
            </div>
          </div>

          {/* Self-Hosted Option */}
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 mb-6 border border-blue-700">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
              <div className="text-blue-200">
                <p className="font-medium">Need to use real names or sensitive data?</p>
                <p className="text-sm">
                  Deploy the self-hosted version for full control over your data. 
                  Self-hosted deployments support real organizational data and custom retention policies.
                </p>
                <a 
                  href="/docs/deployment" 
                  className="text-blue-300 hover:text-blue-200 underline text-sm mt-1 inline-block"
                >
                  Learn about self-hosted deployment →
                </a>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="text-slate-300">
                <p className="font-medium">I acknowledge and agree to the data safety rules above</p>
                <p className="text-sm text-slate-400">
                  I understand that I will not enter real personal data and that session data 
                  may be automatically deleted after {retentionDays} days.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!acknowledged}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>I Acknowledge & Proceed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PIIConsentBannerProps {
  onAccept: () => void;
  retentionDays?: number;
}

export function PIIConsentBanner({ onAccept, retentionDays = 7 }: PIIConsentBannerProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5" />
            <div>
              <p className="font-medium">Data Safety Acknowledgment Required</p>
              <p className="text-sm text-red-100">
                You must acknowledge data safety rules before starting a drill
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Acknowledge Rules
          </button>
        </div>
      </div>

      <PIIConsentModal
        isOpen={showModal}
        onAccept={() => {
          setShowModal(false);
          onAccept();
        }}
        onCancel={() => setShowModal(false)}
        retentionDays={retentionDays}
      />
    </>
  );
}
