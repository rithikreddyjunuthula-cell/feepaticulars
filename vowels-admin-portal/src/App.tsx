/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { StudentTable } from "./components/StudentTable";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { FeesDashboard } from "./components/FeesDashboard";
import { auth, signInWithPopup, googleProvider, onAuthStateChanged, signOut, db } from "./lib/firebase";
import { doc, getDocFromServer } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#fff30f] flex items-center justify-center text-black">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fff30f] flex items-center justify-center text-white">
        <div className="bg-[#151619] p-8 rounded-2xl border border-[#2A2A2A] text-center max-w-sm w-full">
          <img src="/Vowels School Logo.png" alt="Logo" className="h-20 mx-auto mb-6 bg-white rounded-lg p-2" />
          <h1 className="text-2xl font-semibold mb-2">Admin Login</h1>
          <p className="text-[#8E9299] text-sm mb-6">Sign in to access the administration dashboard.</p>
          <button 
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fff30f] text-[#0A0A0A] font-sans selection:bg-orange-500/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} onSignOut={() => signOut(auth)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b border-[#2A2A2A] bg-[#0000ff] flex flex-row items-center justify-between px-8 text-xl font-medium tracking-tight text-white capitalize">
          <div>Administration / <span className="text-white ml-1">{activeTab}</span></div>
          <button onClick={() => signOut(auth)} className="text-sm border border-[#2A2A2A] rounded-md px-3 py-1 text-white hover:text-gray-200">Sign Out</button>
        </header>
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "students" && <StudentTable />}
        {activeTab === "fees" && <FeesDashboard />}
        {activeTab !== "dashboard" && activeTab !== "students" && activeTab !== "fees" && (
          <div className="flex-1 flex items-center justify-center text-[#8E9299]">
            <div className="text-center">
              <h2 className="text-xl mb-2 text-white capitalize">{activeTab}</h2>
              <p>This module is under construction.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
