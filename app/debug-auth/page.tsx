'use client';

import { useState, useEffect } from 'react';

export default function DebugAuthPage() {
  const [envCheck, setEnvCheck] = useState<any>(null);
  const [supabaseCheck, setSupabaseCheck] = useState<any>(null);
  const [apiCheck, setApiCheck] = useState<any>(null);

  useEffect(() => {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setEnvCheck({
      hasUrl: !!url,
      hasKey: !!key,
      urlLength: url?.length || 0,
      keyLength: key?.length || 0,
      urlPreview: url ? `${url.substring(0, 30)}...` : 'undefined',
      keyPreview: key ? `${key.substring(0, 30)}...` : 'undefined',
      allEnvKeys: Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')),
    });

    // Check Supabase client
    try {
      const { isSupabaseEnabled, getSupabaseClient } = require('@/lib/supabase/client');
      const enabled = isSupabaseEnabled();
      const client = getSupabaseClient();
      
      setSupabaseCheck({
        enabled,
        clientAvailable: !!client,
        error: null,
      });
    } catch (err: any) {
      setSupabaseCheck({
        enabled: false,
        clientAvailable: false,
        error: err.message,
        stack: err.stack,
      });
    }

    // Check API endpoint
    fetch('/api/test-supabase')
      .then(res => res.json())
      .then(data => setApiCheck({ success: true, data }))
      .catch(err => setApiCheck({ success: false, error: err.message }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] p-8 text-[#c9d1d9]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Information</h1>
        
        <div className="space-y-6">
          {/* Environment Variables */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Environment Variables</h2>
            <pre className="text-sm bg-[#0d1117] p-4 rounded overflow-auto">
              {JSON.stringify(envCheck, null, 2)}
            </pre>
          </div>

          {/* Supabase Client Check */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Supabase Client Check</h2>
            <pre className="text-sm bg-[#0d1117] p-4 rounded overflow-auto">
              {JSON.stringify(supabaseCheck, null, 2)}
            </pre>
          </div>

          {/* API Check */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">API Test Endpoint</h2>
            <pre className="text-sm bg-[#0d1117] p-4 rounded overflow-auto">
              {JSON.stringify(apiCheck, null, 2)}
            </pre>
          </div>

          {/* Instructions */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">What to Check</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[#8b949e]">
              <li>Environment Variables: Both hasUrl and hasKey should be true</li>
              <li>Supabase Client: enabled should be true, clientAvailable should be true</li>
              <li>API Test: success should be true, and data.enabled should be true</li>
              <li>If any are false, the environment variables aren't being read correctly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

