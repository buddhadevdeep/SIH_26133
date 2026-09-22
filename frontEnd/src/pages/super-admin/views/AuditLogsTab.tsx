import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuditLog } from '@/types/admin';
import {
  ShieldCheck,
  Search,
  Download,
  Clock,
} from 'lucide-react';

interface AuditLogsTabProps {
  logs: AuditLog[];
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Distinct action types
  const actionTypes = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set);
  }, [logs]);

  // Filter logs
  const filtered = useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.resourceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.details?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        l.ipAddress?.includes(searchQuery);
      const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, selectedAction]);

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by actor, action, IP, or resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 text-xs"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="flex min-h-[44px] rounded-lg border border-slate-300 bg-white shadow-2xs px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          Export Audit Trail
        </Button>
      </div>

      {/* Logs List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No audit entries found"
          description="No security logs matched your search or action filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedAction('ALL');
          }}
        />
      ) : (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 text-xs">
            {filtered.map((log) => (
              <div key={log.id} className="p-4 space-y-2 hover:bg-slate-50/70 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-800 text-xs bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200/60">
                      {log.action}
                    </span>
                    <span className="text-slate-500 font-medium">
                      Resource: <strong className="text-slate-800">{log.resourceType}</strong> ({log.resourceId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="h-3 w-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
                  <p className="text-slate-800">
                    Actor: <strong>{log.actorName}</strong> • Role: <span className="text-slate-500">{log.actorRole}</span>
                  </p>
                  <span className="font-mono text-slate-400 text-[11px]">
                    IP: {log.ipAddress || '10.91.242.1'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-mono">
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
