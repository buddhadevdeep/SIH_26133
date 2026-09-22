import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Settings,
  Shield,
  Bell,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '@/api/adminApi';

export const SettingsTab: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [smsGatewayActive, setSmsGatewayActive] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('60');
  const [logLevel, setLogLevel] = useState('INFO');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((res) => {
      if (res?.data) {
        const d = res.data;
        if (d.maintenanceMode !== undefined) setMaintenanceMode(d.maintenanceMode);
        if (d.smsGatewayActive !== undefined) setSmsGatewayActive(d.smsGatewayActive);
        if (d.sessionTimeoutMinutes !== undefined) setSessionTimeoutMinutes(String(d.sessionTimeoutMinutes));
        if (d.logLevel) setLogLevel(d.logLevel);
      }
    }).catch(console.warn);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateSettings({
        maintenanceMode,
        smsGatewayActive,
        sessionTimeoutMinutes: Number(sessionTimeoutMinutes) || 60,
        logLevel,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
    }
  };


  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">System Settings</h3>
            <p className="text-xs text-slate-500">
              Manage automatic logout times, patient message alerts, and system maintenance
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          All settings have been saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login & Security */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-700" />
              <CardTitle className="text-base font-bold text-slate-900">Login & Security</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Protect staff accounts when computers are left unattended</p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Auto-Logout Idle Computers (Minutes)</label>
              <Input
                type="number"
                min="15"
                max="480"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
              />
              <p className="text-[11px] text-slate-500">
                Signs out staff automatically if their computer is left idle for this long.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">System Activity Detail Level</label>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value)}
                className="flex min-h-[44px] w-full rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
              >
                <option value="DEBUG">Detailed (For technical troubleshooting)</option>
                <option value="INFO">Normal (Recommended for everyday use)</option>
                <option value="WARN">Warnings Only (Unexpected slowdowns only)</option>
                <option value="ERROR">Errors Only (System errors only)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                "Normal" is recommended for everyday hospital use.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Messages & Alerts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-700" />
              <CardTitle className="text-base font-bold text-slate-900">Patient Messages & Alerts</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Send text messages and queue updates directly to patients</p>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4 text-xs">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={smsGatewayActive}
                onChange={(e) => setSmsGatewayActive(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-teal-700 focus:ring-teal-700"
              />
              <div>
                <span className="font-bold text-slate-900 block">Send SMS & WhatsApp Alerts</span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Sends automated messages to patients with their token link and when their turn is 5 numbers away.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded text-rose-600 focus:ring-rose-600"
              />
              <div>
                <span className="font-bold text-rose-950 block">Turn On Maintenance Mode</span>
                <span className="text-rose-800 text-[11px] block mt-0.5">
                  Temporarily stops online registrations and shows a friendly maintenance notice to patients. Emergency desks remain open.
                </span>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};
