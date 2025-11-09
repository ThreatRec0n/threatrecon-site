'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Check for token in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const storedToken = localStorage.getItem('analytics_token');
    const initialToken = urlToken || storedToken || '';
    
    if (initialToken) {
      setToken(initialToken);
      fetchAnalytics(initialToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?token=${authToken}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid access token');
        } else {
          setError('Failed to load analytics');
        }
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setAnalytics(data);
      localStorage.setItem('analytics_token', authToken);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics(token);
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all analytics data? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/analytics/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      if (response.ok) {
        alert('Analytics data reset successfully');
        fetchAnalytics(token);
      } else {
        alert('Failed to reset analytics');
      }
    } catch (err) {
      alert('Error resetting analytics');
    }
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
          <p className="text-[#8b949e]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics && !loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h1 className="text-2xl font-bold text-[#c9d1d9] mb-4">Analytics Access</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/40 rounded text-red-400 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                placeholder="Enter access token"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors"
            >
              Access Analytics
            </button>
          </form>
          <button
            onClick={() => router.push('/simulation')}
            className="mt-4 w-full px-4 py-2 text-sm text-[#8b949e] hover:text-[#c9d1d9]"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Analytics Dashboard</h1>
            <p className="text-[#8b949e]">Access monitoring and security analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded border border-red-800/40 text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Reset Data
            </button>
            <button
              onClick={() => router.push('/simulation')}
              className="px-4 py-2 text-sm rounded border border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22] transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Admin Page Visits</div>
            <div className="text-3xl font-bold text-[#58a6ff]">
              {analytics?.admin_visits || 0}
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Failed Attempts</div>
            <div className="text-3xl font-bold text-orange-400">
              {analytics?.admin_attempts || 0}
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Successful Compromises</div>
            <div className="text-3xl font-bold text-red-400">
              {analytics?.admin_successes || 0}
            </div>
          </div>
          
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="text-sm text-[#8b949e] mb-1">Unique IPs</div>
            <div className="text-3xl font-bold text-green-400">
              {analytics?.unique_ips?.length || 0}
            </div>
          </div>
        </div>

        {/* Top IPs Leaderboard */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#c9d1d9] mb-4">Top 5 IPs by Attempts</h2>
          {analytics?.top_ips && analytics.top_ips.length > 0 ? (
            <div className="space-y-2">
              {analytics.top_ips.map((item: any, index: number) => (
                <div
                  key={item.ip}
                  className="flex items-center justify-between p-3 bg-[#0d1117] rounded border border-[#30363d]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#58a6ff]/20 flex items-center justify-center text-[#58a6ff] font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-[#c9d1d9]">{item.ip}</div>
                      <div className="text-xs text-[#8b949e]">{item.count} attempt{item.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8b949e] text-center py-8">No attempts recorded yet</p>
          )}
        </div>

        {/* Recent Events */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#c9d1d9] mb-4">Recent Events</h2>
          {analytics?.events && analytics.events.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analytics.events.slice(-20).reverse().map((event: any, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-[#0d1117] rounded border border-[#30363d] text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold ${
                      event.event === 'admin_compromise' ? 'text-red-400' :
                      event.event === 'admin_failed_attempt' ? 'text-orange-400' :
                      'text-[#58a6ff]'
                    }`}>
                      {event.event.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-[#8b949e]">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-[#8b949e] font-mono">
                    IP: {event.ip || 'unknown'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8b949e] text-center py-8">No events recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

