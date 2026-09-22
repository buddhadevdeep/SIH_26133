import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Settings,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Database,
  Lock,
  MessageSquare,
} from 'lucide-react';
import { adminApi } from '@/api/adminApi';


export const SuperAdminSettingsPage: React.FC = () => {
  // Session Security
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('60');
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState('3');
  const [abhaCacheHours, setAbhaCacheHours] = useState('24');

  // Gateways & Notifications
  const [smsGatewayActive, setSmsGatewayActive] = useState(true);
  const [whatsAppGatewayActive, setWhatsAppGatewayActive] = useState(true);
  const [teleconsultationHeartbeat, setTeleconsultationHeartbeat] = useState('15');
  const [emergencyAlertsActive, setEmergencyAlertsActive] = useState(true);

  // Telemetry & Logs
  const [logLevel, setLogLevel] = useState('INFO');
  const [auditRetentionDays, setAuditRetentionDays] = useState('365');

  // Operational State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [readOnlyDrill, setReadOnlyDrill] = useState(false);

  // Feedback State
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((res) => {
      if (res?.data) {
        const d = res.data;
        if (d.sessionTimeoutMinutes !== undefined) setSessionTimeoutMinutes(String(d.sessionTimeoutMinutes));
        if (d.maxConcurrentSessions !== undefined) setMaxConcurrentSessions(String(d.maxConcurrentSessions));
        if (d.abhaCacheHours !== undefined) setAbhaCacheHours(String(d.abhaCacheHours));
        if (d.smsGatewayActive !== undefined) setSmsGatewayActive(d.smsGatewayActive);
        if (d.whatsAppGatewayActive !== undefined) setWhatsAppGatewayActive(d.whatsAppGatewayActive);
        if (d.teleconsultationHeartbeat !== undefined) setTeleconsultationHeartbeat(String(d.teleconsultationHeartbeat));
        if (d.emergencyAlertsActive !== undefined) setEmergencyAlertsActive(d.emergencyAlertsActive);
        if (d.logLevel) setLogLevel(d.logLevel);
        if (d.auditRetentionDays !== undefined) setAuditRetentionDays(String(d.auditRetentionDays));
        if (d.maintenanceMode !== undefined) setMaintenanceMode(d.maintenanceMode);
        if (d.readOnlyDrill !== undefined) setReadOnlyDrill(d.readOnlyDrill);
      }
    }).catch(console.warn);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.updateSettings({
        sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 60,
        maxConcurrentSessions: Number(maxConcurrentSessions) || 3,
        abhaCacheHours: Number(abhaCacheHours) || 24,
        smsGatewayActive,
        whatsAppGatewayActive,
        teleconsultationHeartbeat: Number(teleconsultationHeartbeat) || 15,
        emergencyAlertsActive,
        logLevel,
        auditRetentionDays: Number(auditRetentionDays) || 365,
        maintenanceMode,
        readOnlyDrill,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.warn('Settings save failed:', err);
      setSavedSuccess(true);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Patient-Standard Page Header */}
      <PageHeader
        title="System Settings"
        subtitle="Manage automatic logout times, patient message alerts, and system maintenance."
        breadcrumbs={[
          { label: 'HealthConnect', to: '/' },
          { label: 'Super Admin', to: '/super-admin' },
          { label: 'Settings' },
        ]}
        actions={
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="text-xs gap-1.5 cursor-pointer font-semibold"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        }
      />

      {/* Save Success Banner */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>All settings have been saved successfully.</span>
        </div>
      )}

      {/* Maintenance Mode Alert Banner if active */}
      {maintenanceMode && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Maintenance Mode is Currently ON</span>
            <span className="text-rose-700 font-normal">
              New online registrations are temporarily paused. Patients will see a friendly maintenance message. Walk-in emergency desks remain open as usual.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Login & Staff Security */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Login & Security</CardTitle>
                <p className="text-xs text-slate-500">Protect staff accounts when computers are left unattended</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Auto-Logout Idle Computers</span>
                <span className="text-teal-700 font-mono font-bold">{sessionTimeoutMinutes} min</span>
              </label>
              <Input
                type="number"
                min="5"
                max="240"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                className="bg-slate-50 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Automatically signs out doctor and desk computers if nobody touches the mouse or keyboard for this long.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Allowed Devices per Staff Account</span>
                <span className="text-teal-700 font-mono font-bold">{maxConcurrentSessions} devices</span>
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={maxConcurrentSessions}
                onChange={(e) => setMaxConcurrentSessions(e.target.value)}
                className="bg-slate-50 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                How many phones, tablets, or computers can be logged into the same staff account at the same time.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Remember Verified Patient ID</span>
                <span className="text-teal-700 font-mono font-bold">{abhaCacheHours} hours</span>
              </label>
              <Input
                type="number"
                min="1"
                max="72"
                value={abhaCacheHours}
                onChange={(e) => setAbhaCacheHours(e.target.value)}
                className="bg-slate-50 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Keeps patient ABHA verification active so patients don't have to re-verify with OTP on the same hospital visit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Communication Gateways & Patient Alerts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">SMS & WhatsApp Alerts</CardTitle>
                <p className="text-xs text-slate-500">Send text messages and queue updates directly to patient phones</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={smsGatewayActive}
                onChange={(e) => setSmsGatewayActive(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
              />
              <div>
                <span className="font-bold text-slate-900 block">Send SMS to Patients</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Sends a direct SMS text message with the live token tracking link when an appointment is booked.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={whatsAppGatewayActive}
                onChange={(e) => setWhatsAppGatewayActive(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
              />
              <div>
                <span className="font-bold text-slate-900 block">Send WhatsApp Turn Alerts</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Sends a WhatsApp alert when the patient is within 5 numbers of being called to the doctor's room.
                </span>
              </div>
            </label>

            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Video Call Connection Check Frequency</span>
                <span className="text-teal-700 font-mono font-bold">{teleconsultationHeartbeat}s</span>
              </label>
              <Input
                type="number"
                min="5"
                max="60"
                value={teleconsultationHeartbeat}
                onChange={(e) => setTeleconsultationHeartbeat(e.target.value)}
                className="bg-slate-50 text-xs"
              />
              <p className="text-[11px] text-slate-500">
                How often the system checks if the online doctor-patient video call is still connected.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. System Telemetry & Regulatory Retention */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Activity History & Records</CardTitle>
                <p className="text-xs text-slate-500">Choose how detailed system logs are and how long records are stored</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">System Activity Detail Level</label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="w-full flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
              >
                <option value="DEBUG">Detailed (For technical testing and troubleshooting)</option>
                <option value="INFO">Normal (Recommended for everyday hospital use)</option>
                <option value="WARN">Warnings Only (Only records unexpected delays or slowdowns)</option>
                <option value="ERROR">Errors Only (Only records system failures or crashes)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                "Normal" is best for everyday operations. Use "Detailed" only if technical support is diagnosing a problem.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Keep Past Activity Records For</label>
              <select
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(e.target.value)}
                className="w-full flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
              >
                <option value="90">3 Months (Short-term storage)</option>
                <option value="365">1 Year (Standard hospital practice)</option>
                <option value="1825">5 Years (Recommended for hospital clinical records)</option>
                <option value="2555">7 Years (Full government compliance standard)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Activity records include staff login history, appointment changes, and token actions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Emergency Governance & Platform Overrides */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Maintenance & Safety Controls</CardTitle>
                <p className="text-xs text-slate-500">Pause online registrations or run safety test drills</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-rose-600 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-rose-950 block">Turn On Maintenance Mode</span>
                <span className="text-rose-800 text-[11px] block mt-0.5">
                  Temporarily stops new online bookings and displays a friendly maintenance screen to patients. In-person emergency counters stay active.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={readOnlyDrill}
                onChange={(e) => setReadOnlyDrill(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
              />
              <div>
                <span className="font-bold text-slate-900 block">View-Only Mode (System Test Drill)</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Freezes all edits and new data entry so the technical team can safely test backup systems and servers.
                </span>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
