import React, { useState } from 'react';
import Header from '../../components/admin/Header';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Database, 
  Mail, 
  Key, 
  CheckCircle2, 
  Save, 
  RefreshCw,
  Globe,
  Sliders
} from 'lucide-react';

export default function PlatformSettings({ onBack, onToggleSidebar }) {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    academicYear: '2024-2025',
    portalName: 'AlumniConnect Engagement Portal',
    allowStudentDirectMessaging: true,
    requireApprovalForReferrals: true,
    autoVerifyInstitutionalEmails: true,
    emailNotificationDigest: 'daily',
    enableEndowmentDrives: true
  });

  const handleToggle = (key) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 min-w-0 bg-[#EBF3FA] pb-16 min-h-screen">
      <Header
        title="Platform & Governance Settings"
        onBack={onBack}
        onToggleSidebar={onToggleSidebar}
      />

      <main className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#0F4C81]" />
              Governance Controls
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Configure system rules, communication policies, and role permissions.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] hover:bg-[#0d3d68] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>Save Changes</span>
          </button>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Platform configuration updated successfully.
          </div>
        )}

        {/* Settings Grid */}
        <div className="space-y-6">
          {/* Academic Calendar & Branding */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0F4C81]" />
              Institution & Academic Year
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Active Academic Year</label>
                <input 
                  type="text" 
                  value={config.academicYear} 
                  onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 shadow-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Portal Display Name</label>
                <input 
                  type="text" 
                  value={config.portalName} 
                  onChange={(e) => setConfig({ ...config, portalName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Access Policies & Governance */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0F4C81]" />
              Access Policies & Moderation
            </h3>
            
            <div className="space-y-4 divide-y divide-slate-100">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Direct Student-Alumni Messaging</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Allow students to message alumni without requiring admin pre-approval</p>
                </div>
                <button 
                  onClick={() => handleToggle('allowStudentDirectMessaging')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    config.allowStudentDirectMessaging ? 'bg-[#0F4C81]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    config.allowStudentDirectMessaging ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Moderate Job Referrals</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Require platform admin review before alumni job referrals appear on public board</p>
                </div>
                <button 
                  onClick={() => handleToggle('requireApprovalForReferrals')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    config.requireApprovalForReferrals ? 'bg-[#0F4C81]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    config.requireApprovalForReferrals ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Auto-Verify Institutional Email Domains</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Instant activation for sign-ups using approved @alumniconnect.edu domain</p>
                </div>
                <button 
                  onClick={() => handleToggle('autoVerifyInstitutionalEmails')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    config.autoVerifyInstitutionalEmails ? 'bg-[#0F4C81]' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    config.autoVerifyInstitutionalEmails ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
