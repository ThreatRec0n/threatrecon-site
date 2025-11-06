'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const menuItems = [
  { href: '/', label: 'Log Analysis', icon: '📊' },
  { href: '/scenarios', label: 'Scenarios', icon: '🎯' },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
      <div className="p-6 border-b border-[#30363d]">
        <h1 className="text-xl font-semibold text-[#c9d1d9] flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <span>Threat Hunt</span>
        </h1>
        <p className="text-xs text-[#8b949e] mt-1">SIEM Training Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-[#30363d]">
        <div className="text-xs text-[#8b949e] space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]"></div>
            <span>System Operational</span>
          </div>
          <div className="text-[#484f58] mt-2">
            v1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
}

