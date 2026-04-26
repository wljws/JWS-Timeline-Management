/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TimelineApp } from './TimelineApp';
import { Icons } from './icons';
import './index.css';

export default function App() {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('timeline_role'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userLower = username.toLowerCase();
    if ((userLower === 'admin' && password === 'password') || (userLower === 'jwsadmin' && password === 'wangadmin')) {
      setUserRole('admin');
      localStorage.setItem('timeline_role', 'admin');
      setError('');
    } else if (userLower === 'viewer' && password === 'viewer') {
      setUserRole('viewer');
      localStorage.setItem('timeline_role', 'viewer');
      setError('');
    } else {
      setError('Invalid credentials. Try admin/password or viewer/viewer');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('timeline_role');
    setUsername('');
    setPassword('');
  };

  if (userRole) {
    return <TimelineApp onLogout={handleLogout} userRole={userRole} />;
  }

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-slate-800 absolute inset-0 z-[100]">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timeline Manager</h1>
          <p className="text-slate-500 text-sm mt-2">Sign in to access your projects</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              placeholder="'admin' or 'viewer'"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              placeholder="Enter password..."
            />
          </div>
          {error && <p className="text-red-500 text-xs font-medium text-center bg-red-50 py-2 rounded border border-red-100">{error}</p>}
          <div className="flex flex-col gap-3 mt-2">
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg flex justify-center items-center gap-2"
            >
              Login <Icons.ChevronRight />
            </button>
            <button 
              type="button"
              onClick={() => { setUserRole('viewer'); localStorage.setItem('timeline_role', 'viewer'); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-lg transition-colors border border-slate-200 flex justify-center items-center gap-2"
            >
              Enter as Guest (View Only)
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-center space-y-1">
            <p className="text-xs text-slate-500"><strong>Admin Access:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">admin</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">password</code></p>
            <p className="text-xs text-slate-500"><strong>View Only:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded">viewer</code> / <code className="bg-slate-100 px-1 py-0.5 rounded">viewer</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}
