'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function PhoenixPage() {
  const router = useRouter();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/OPERATION_PHOENIX_BLUEPRINT.md')
      .then(res => {
        if (!res.ok) {
          return fetch('/OPERATION_PHOENIX_BLUEPRINT.md', { cache: 'no-cache' });
        }
        return res;
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load documentation');
        return res.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto"></div>
          <p className="text-[#8b949e]">Loading Operation Phoenix Blueprint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-2xl mx-auto p-6">
          <p className="text-red-400">Error loading documentation: {error}</p>
          <button
            onClick={() => router.push('/simulation')}
            className="px-4 py-2 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#c9d1d9]">Operation Phoenix Blueprint</h1>
            <p className="text-sm text-[#8b949e] mt-1">Threat Hunting Lab Design & Platform Alignment</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/docs')}
              className="px-3 py-1.5 rounded border text-sm transition-colors bg-[#161b22] text-[#c9d1d9] border-[#30363d] hover:border-[#58a6ff] hover:text-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              aria-label="View Lab Plan Documentation"
            >
              📚 Lab Plan
            </button>
            <button
              onClick={() => router.push('/simulation')}
              className="px-4 py-2 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
              aria-label="Return to Simulation Dashboard"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="prose prose-invert prose-blue max-w-none">
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold text-[#c9d1d9] mb-4 mt-8 border-b border-[#30363d] pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold text-[#c9d1d9] mb-3 mt-6 border-b border-[#30363d] pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-[#c9d1d9] mb-2 mt-4">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold text-[#c9d1d9] mb-2 mt-3">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-[#c9d1d9] mb-4 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside text-[#c9d1d9] mb-4 space-y-2 ml-4">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-[#c9d1d9]">
                    {children}
                  </li>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-[#161b22] text-[#58a6ff] px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-[#161b22] text-[#c9d1d9] p-4 rounded border border-[#30363d] overflow-x-auto mb-4">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-[#161b22] text-[#c9d1d9] p-4 rounded border border-[#30363d] overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[#c9d1d9]">
                    {children}
                  </strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#58a6ff] hover:text-[#79c0ff] underline"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#58a6ff] pl-4 italic text-[#8b949e] my-4">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-[#30363d]">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-[#30363d] bg-[#161b22] px-4 py-2 text-left font-semibold text-[#c9d1d9]">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-[#30363d] px-4 py-2 text-[#c9d1d9]">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}

