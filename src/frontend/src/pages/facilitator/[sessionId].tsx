import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  PlayCircle, 
  PauseCircle, 
  AlertTriangle, 
  Square, 
  Trash2,
  Clock,
  Users,
  Activity,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';

interface FacilitatorDashboard {
  session: {
    id: string;
    status: string;
    startedAt: string;
    elapsedTime: number;
    participants: Array<{
      role: string;
      name?: string;
      joinedAt: string;
      lastActivity: string;
    }>;
    scores: any;
  };
  recentDecisions: Array<{
    id: string;
    role: string;
    action: string;
    timestamp: string;
    rationale: string;
  }>;
  auditTrail: Array<{
    id: string;
    type: string;
    timestamp: string;
    facilitatorRole?: string;
    actionType: string;
    metadata: any;
  }>;
  queuedInjects: Array<{
    id: string;
    time_offset_minutes: number;
    type: string;
    content: string;
    severity: string;
  }>;
}

interface FacilitatorOnboardingProps {
  onEnterFacilitatorMode: () => void;
  onViewScoringModel: () => void;
}

function FacilitatorOnboarding({ onEnterFacilitatorMode, onViewScoringModel }: FacilitatorOnboardingProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 rounded-t-lg p-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">You are the Facilitator</h2>
              <p className="text-blue-100">You control the drill and guide your team through the simulation</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Power Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Control Panel</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <PauseCircle className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">Pause & Resume</span>
                </div>
                <p className="text-slate-300 text-sm">Control the simulation clock and give your team time to think</p>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Send className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">Manual Injects</span>
                </div>
                <p className="text-slate-300 text-sm">Send custom events to any participant at any time</p>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-white font-medium">Escalate Severity</span>
                </div>
                <p className="text-slate-300 text-sm">Increase pressure and urgency when needed</p>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Square className="h-5 w-5 text-purple-400" />
                  <span className="text-white font-medium">End Session</span>
                </div>
                <p className="text-slate-300 text-sm">Conclude the drill and generate the After Action Report</p>
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Everything is Logged</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                <div className="text-slate-300">
                  <p className="font-medium">Immutable Audit Trail</p>
                  <p className="text-sm mt-1">
                    Every action you take is recorded with timestamps and included in the signed AAR. 
                    This creates an unalterable record of what happened during the drill.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pressure Control */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">You Control the Stress Level</h3>
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Settings className="h-5 w-5 text-orange-400 mt-1 flex-shrink-0" />
                <div className="text-slate-300">
                  <p className="font-medium">Adaptive Facilitation</p>
                  <p className="text-sm mt-1">
                    Adjust the intensity based on your team's experience level. New teams get more guidance, 
                    experienced teams get more pressure. You're the conductor of this orchestra.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onEnterFacilitatorMode}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <PlayCircle className="h-4 w-4" />
              <span>Enter Facilitator Mode</span>
            </button>
            <button
              onClick={onViewScoringModel}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Scoring Model</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FacilitatorConsole() {
  const router = useRouter();
  const { sessionId } = router.query;
  
  const [dashboard, setDashboard] = useState<FacilitatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showScoringModel, setShowScoringModel] = useState(false);
  
  // Manual inject form
  const [manualInject, setManualInject] = useState({
    type: 'text',
    content: '',
    target_roles: [] as string[],
    severity: 'info'
  });

  // Escalation form
  const [escalation, setEscalation] = useState({
    level: 'warning',
    message: ''
  });

  useEffect(() => {
    if (sessionId) {
      // Check if this is the first time accessing this session
      const hasSeenOnboarding = localStorage.getItem(`facilitator-onboarding-${sessionId}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
      
      loadDashboard();
      // Refresh dashboard every 5 seconds
      const interval = setInterval(loadDashboard, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const loadDashboard = async () => {
    try {
      const response = await fetch(`/api/facilitator/${sessionId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load facilitator dashboard');
      }

      const data = await response.json();
      setDashboard(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: string, data?: any) => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/session/${sessionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} session`);
      }

      // Reload dashboard after action
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} session`);
    } finally {
      setActionLoading(null);
    }
  };

  const sendManualInject = async () => {
    if (!manualInject.content.trim() || manualInject.target_roles.length === 0) {
      setError('Please provide content and select target roles');
      return;
    }

    await executeAction('inject', manualInject);
    
    // Reset form
    setManualInject({
      type: 'text',
      content: '',
      target_roles: [],
      severity: 'info'
    });
  };

  const escalateSession = async () => {
    await executeAction('escalate', escalation);
    
    // Reset form
    setEscalation({
      level: 'warning',
      message: ''
    });
  };

  const handleEnterFacilitatorMode = () => {
    setShowOnboarding(false);
    localStorage.setItem(`facilitator-onboarding-${sessionId}`, 'seen');
  };

  const handleViewScoringModel = () => {
    setShowScoringModel(true);
  };

  const formatElapsedTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'paused': return 'text-yellow-500';
      case 'completed': return 'text-blue-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading facilitator console...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Session not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Onboarding Overlay */}
      {showOnboarding && (
        <FacilitatorOnboarding
          onEnterFacilitatorMode={handleEnterFacilitatorMode}
          onViewScoringModel={handleViewScoringModel}
        />
      )}

      {/* Scoring Model Modal */}
      {showScoringModel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Readiness Scoring Model</h2>
                <button
                  onClick={() => setShowScoringModel(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Technical Response (40%)</h3>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• Incident detection and analysis</li>
                      <li>• Containment and eradication</li>
                      <li>• System recovery procedures</li>
                      <li>• Technical documentation</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Legal & Compliance (25%)</h3>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• Regulatory notification timing</li>
                      <li>• Legal privilege protection</li>
                      <li>• Evidence preservation</li>
                      <li>• Compliance reporting</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Executive Communication (20%)</h3>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• Board notification protocols</li>
                      <li>• Stakeholder communication</li>
                      <li>• Business impact assessment</li>
                      <li>• Decision-making processes</li>
                    </ul>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-400 mb-2">Business Continuity (15%)</h3>
                    <ul className="text-slate-300 text-sm space-y-1">
                      <li>• Service continuity planning</li>
                      <li>• Customer communication</li>
                      <li>• Vendor coordination</li>
                      <li>• Recovery time objectives</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="text-blue-200">
                    <p className="font-medium">How Scoring Works</p>
                    <p className="text-sm mt-1">
                      Each decision is evaluated against industry best practices and frameworks like NIST 800-61, 
                      SOC2, and ISO 27035. The final score helps identify training gaps and demonstrates 
                      compliance readiness to auditors and executives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Facilitator Console</h1>
            <p className="text-slate-300">Session: {sessionId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dashboard.session.status)}`}>
              {dashboard.session.status.toUpperCase()}
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="h-4 w-4" />
              <span>{formatElapsedTime(dashboard.session.elapsedTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session Controls */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Session Controls</h2>
              
              <div className="space-y-3">
                {dashboard.session.status === 'active' && (
                  <button
                    onClick={() => executeAction('pause')}
                    disabled={actionLoading === 'pause'}
                    className="w-full flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 px-4 py-2 rounded-md"
                  >
                    <PauseCircle className="h-4 w-4" />
                    <span>{actionLoading === 'pause' ? 'Pausing...' : 'Pause Session'}</span>
                  </button>
                )}

                {dashboard.session.status === 'paused' && (
                  <button
                    onClick={() => executeAction('resume')}
                    disabled={actionLoading === 'resume'}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-md"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>{actionLoading === 'resume' ? 'Resuming...' : 'Resume Session'}</span>
                  </button>
                )}

                <button
                  onClick={() => executeAction('end', { reason: 'Ended by facilitator' })}
                  disabled={actionLoading === 'end' || dashboard.session.status === 'completed'}
                  className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-2 rounded-md"
                >
                  <Square className="h-4 w-4" />
                  <span>{actionLoading === 'end' ? 'Ending...' : 'End Session'}</span>
                </button>

                <button
                  onClick={() => executeAction('delete')}
                  disabled={actionLoading === 'delete'}
                  className="w-full flex items-center justify-center space-x-2 bg-red-800 hover:bg-red-900 disabled:opacity-50 px-4 py-2 rounded-md"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{actionLoading === 'delete' ? 'Deleting...' : 'Delete Session'}</span>
                </button>
              </div>
            </div>

            {/* Manual Inject */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Manual Inject</h2>
              
              <div className="space-y-3">
                <select
                  value={manualInject.type}
                  onChange={(e) => setManualInject({ ...manualInject, type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="text">Text Message</option>
                  <option value="email">Email</option>
                  <option value="sim_log">Log Entry</option>
                  <option value="siem">SIEM Alert</option>
                </select>

                <textarea
                  value={manualInject.content}
                  onChange={(e) => setManualInject({ ...manualInject, content: e.target.value })}
                  placeholder="Enter inject content..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white h-20"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Target Roles</label>
                  <div className="space-y-2">
                    {dashboard.session.participants.map((participant) => (
                      <label key={participant.role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={manualInject.target_roles.includes(participant.role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualInject({
                                ...manualInject,
                                target_roles: [...manualInject.target_roles, participant.role]
                              });
                            } else {
                              setManualInject({
                                ...manualInject,
                                target_roles: manualInject.target_roles.filter(r => r !== participant.role)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span>{participant.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <select
                  value={manualInject.severity}
                  onChange={(e) => setManualInject({ ...manualInject, severity: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>

                <button
                  onClick={sendManualInject}
                  disabled={actionLoading === 'inject'}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-md"
                >
                  <Send className="h-4 w-4" />
                  <span>{actionLoading === 'inject' ? 'Sending...' : 'Send Inject'}</span>
                </button>
              </div>
            </div>

            {/* Escalation */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Escalate Severity</h2>
              
              <div className="space-y-3">
                <select
                  value={escalation.level}
                  onChange={(e) => setEscalation({ ...escalation, level: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>

                <textarea
                  value={escalation.message}
                  onChange={(e) => setEscalation({ ...escalation, message: e.target.value })}
                  placeholder="Escalation message..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white h-16"
                />

                <button
                  onClick={escalateSession}
                  disabled={actionLoading === 'escalate'}
                  className="w-full flex items-center justify-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-4 py-2 rounded-md"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{actionLoading === 'escalate' ? 'Escalating...' : 'Escalate'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Participants */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participants ({dashboard.session.participants.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.session.participants.map((participant) => (
                  <div key={participant.role} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{participant.role}</h3>
                        {participant.name && (
                          <p className="text-sm text-slate-300">{participant.name}</p>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        Joined: {new Date(participant.joinedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Decisions */}
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Decisions ({dashboard.recentDecisions.length})
              </h2>
              
              <div className="space-y-3">
                {dashboard.recentDecisions.slice(0, 5).map((decision) => (
                  <div key={decision.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{decision.role}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-blue-400">{decision.action}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {decision.rationale && (
                      <p className="text-sm text-slate-300">{decision.rationale}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Queued Injects */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Queued Injects ({dashboard.queuedInjects.length})
              </h2>
              
              <div className="space-y-3">
                {dashboard.queuedInjects.map((inject) => (
                  <div key={inject.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(inject.severity)}`}>
                          {inject.severity.toUpperCase()}
                        </span>
                        <span className="text-slate-300">{inject.type}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        +{inject.time_offset_minutes} min
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{inject.content.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}