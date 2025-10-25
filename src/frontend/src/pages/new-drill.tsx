import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  PlayCircle, 
  Settings, 
  Users, 
  Clock, 
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import PIIConsentModal from '../components/PIIConsentModal';

interface Participant {
  role: string;
  name?: string;
}

export default function NewDrillPage() {
  const router = useRouter();
  const [showPIIModal, setShowPIIModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  // Drill configuration
  const [mode, setMode] = useState<'team' | 'classroom' | 'client'>('team');
  const [scenarioPack, setScenarioPack] = useState<'ransomware' | 'wirefraud' | 'ddos' | 'insider' | 'cloudleak'>('ransomware');
  const [duration, setDuration] = useState<'30' | '60'>('60');
  const [participants, setParticipants] = useState<Participant[]>([
    { role: 'IR_LEAD', name: '' },
    { role: 'NETWORK_ADMIN', name: '' },
    { role: 'LEGAL_COUNSEL', name: '' }
  ]);

  const modeOptions = [
    { value: 'team', label: 'Team Readiness', description: 'Internal security team training' },
    { value: 'classroom', label: 'Classroom', description: 'Educational environment' },
    { value: 'client', label: 'Client Delivery', description: 'Consultant-led engagement' }
  ];

  const scenarioOptions = [
    { value: 'ransomware', label: 'Ransomware Attack', description: 'Data encryption and extortion' },
    { value: 'wirefraud', label: 'Wire Fraud', description: 'Financial fraud and BEC' },
    { value: 'ddos', label: 'DDoS Attack', description: 'Service disruption' },
    { value: 'insider', label: 'Insider Threat', description: 'Malicious internal actor' },
    { value: 'cloudleak', label: 'Cloud Data Leak', description: 'Misconfigured cloud storage' }
  ];

  const roleOptions = [
    { value: 'IR_LEAD', label: 'Incident Response Lead' },
    { value: 'NETWORK_ADMIN', label: 'Network Administrator' },
    { value: 'SECURITY_ANALYST', label: 'Security Analyst' },
    { value: 'LEGAL_COUNSEL', label: 'Legal Counsel' },
    { value: 'EXEC_SPONSOR', label: 'Executive Sponsor' },
    { value: 'PR_COMMS', label: 'PR/Communications' },
    { value: 'IT_MANAGER', label: 'IT Manager' },
    { value: 'COMPLIANCE', label: 'Compliance Officer' },
    { value: 'HR_DIRECTOR', label: 'HR Director' },
    { value: 'FINANCE_DIRECTOR', label: 'Finance Director' }
  ];

  const handleAddParticipant = () => {
    setParticipants([...participants, { role: 'IR_LEAD', name: '' }]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleStartDrill = async () => {
    setShowPIIModal(true);
  };

  const handlePIIAccepted = async () => {
    setIsStarting(true);
    
    try {
      // Create session with PII consent
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          scenarioId: scenarioPack,
          participants: participants.map(p => ({
            role: p.role,
            name: p.name || undefined
          })),
          settings: {
            mode,
            duration: parseInt(duration),
            difficulty: 'medium',
            scoringEnabled: true,
            allowManualInjects: true,
            enableBranching: true
          },
          piiConsent: true,
          piiConsentTimestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      
      // Redirect to session view
      router.push(`/session/${data.session.id}`);
      
    } catch (error) {
      console.error('Error starting drill:', error);
      alert('Failed to start drill. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleOpenFacilitatorConsole = async () => {
    setShowPIIModal(true);
  };

  const handleFacilitatorPIIAccepted = async () => {
    setIsStarting(true);
    
    try {
      // Create session for facilitator
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          scenarioId: scenarioPack,
          participants: participants.map(p => ({
            role: p.role,
            name: p.name || undefined
          })),
          settings: {
            mode,
            duration: parseInt(duration),
            difficulty: 'medium',
            scoringEnabled: true,
            allowManualInjects: true,
            enableBranching: true,
            facilitatorMode: true
          },
          piiConsent: true,
          piiConsentTimestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const data = await response.json();
      
      // Redirect to facilitator console
      router.push(`/facilitator/${data.session.id}`);
      
    } catch (error) {
      console.error('Error starting facilitator session:', error);
      alert('Failed to start facilitator session. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">ThreatRecon</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Start a New Drill</h1>
          <p className="text-slate-300">
            Configure your breach simulation and get your team ready for action.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Mode
              </h2>
              <div className="space-y-3">
                {modeOptions.map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="mt-1 h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-slate-400 text-sm">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Scenario Pack */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Scenario Pack</h2>
              <div className="space-y-3">
                {scenarioOptions.map((option) => (
                  <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="scenario"
                      value={option.value}
                      checked={scenarioPack === option.value}
                      onChange={(e) => setScenarioPack(e.target.value as any)}
                      className="mt-1 h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-slate-400 text-sm">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Duration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value="30"
                    checked={duration === '30'}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">30 minutes</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duration"
                    value="60"
                    checked={duration === '60'}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white">60 minutes</span>
                </label>
              </div>
            </div>
          </div>

          {/* Participants Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Participants
                </h2>
                <button
                  onClick={handleAddParticipant}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  + Add Role
                </button>
              </div>

              <div className="space-y-4">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <select
                      value={participant.role}
                      onChange={(e) => handleParticipantChange(index, 'role', e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={participant.name || ''}
                      onChange={(e) => handleParticipantChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400"
                    />
                    
                    {participants.length > 1 && (
                      <button
                        onClick={() => handleRemoveParticipant(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={handleStartDrill}
                disabled={isStarting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <PlayCircle className="h-5 w-5" />
                <span>{isStarting ? 'Starting...' : 'Start the Drill'}</span>
              </button>
              
              <button
                onClick={handleOpenFacilitatorConsole}
                disabled={isStarting}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-500 text-white px-6 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Open Facilitator Console</span>
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div className="text-blue-200">
                  <p className="font-medium">Facilitator Console</p>
                  <p className="text-sm mt-1">
                    The facilitator console gives you full control over the drill. You can pause, resume, 
                    escalate severity, send manual injects, and end the session at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PII Consent Modal */}
      <PIIConsentModal
        isOpen={showPIIModal}
        onAccept={() => {
          setShowPIIModal(false);
          // Determine which action to take based on context
          if (isStarting) {
            handlePIIAccepted();
          } else {
            handleFacilitatorPIIAccepted();
          }
        }}
        onCancel={() => setShowPIIModal(false)}
        retentionDays={7}
      />
    </div>
  );
}
