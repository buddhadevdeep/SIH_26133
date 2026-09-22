import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PermissionMatrixItem } from '@/types/admin';
import {
  Download,
  Search,
  Info,
} from 'lucide-react';

interface RolesTabProps {
  permissions: PermissionMatrixItem[];
}

export const RolesTab: React.FC<RolesTabProps> = ({ permissions }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = permissions.filter((p) =>
    p.module.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCaps = (caps?: { read?: boolean; write?: boolean; create?: boolean; delete?: boolean; manage?: boolean } | boolean) => {
    if (caps === true) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-teal-800 text-[11px] bg-teal-50 px-2 py-0.5 rounded">
          Full Access
        </span>
      );
    }
    if (!caps || typeof caps !== 'object') {
      return <span className="text-slate-300 text-xs">—</span>;
    }

    const tags: React.ReactNode[] = [];
    if (caps.read) tags.push(<span key="r" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold" title="Read">Read</span>);
    if (caps.write) tags.push(<span key="w" className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold" title="Write / Edit">Write</span>);
    if (caps.create) tags.push(<span key="c" className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold" title="Create">Create</span>);
    if (caps.delete) tags.push(<span key="d" className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold" title="Delete">Delete</span>);

    if (tags.length === 0) return <span className="text-slate-300 text-xs">—</span>;

    return <div className="flex flex-wrap items-center justify-center gap-1">{tags}</div>;
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(permissions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `healthconnect-permissions-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search module (e.g. Prescriptions, Queue)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export Permissions
          </Button>
        </div>
      </div>

      {/* Permissions Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <span className="font-bold text-slate-700 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-teal-700" />
          Capability Legend:
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">Read</span> View records
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">Write</span> Modify existing
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">Create</span> Author new
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[10px]">Delete</span> Revoke / soft-delete
        </span>
      </div>

      {/* Permissions Table (Desktop) & Cards (Mobile) */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-slate-500">
              <tr>
                <th className="p-3.5">Healthcare Module</th>
                <th className="p-3.5 text-center">Patient</th>
                <th className="p-3.5 text-center">ASHA</th>
                <th className="p-3.5 text-center">Doctor</th>
                <th className="p-3.5 text-center">Staff</th>
                <th className="p-3.5 text-center">District Admin</th>
                <th className="p-3.5 text-center">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((perm) => (
                <tr key={perm.module} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{perm.module}</td>
                  <td className="p-3.5 text-center">{renderCaps(perm.patient)}</td>
                  <td className="p-3.5 text-center">{renderCaps(perm.asha)}</td>
                  <td className="p-3.5 text-center">{renderCaps(perm.doctor)}</td>
                  <td className="p-3.5 text-center">{renderCaps(perm.staff)}</td>
                  <td className="p-3.5 text-center">{renderCaps(perm.districtAdmin)}</td>
                  <td className="p-3.5 text-center">
                    <span className="rounded bg-teal-50 px-2 py-0.5 font-bold text-teal-800 text-[11px]">
                      Full Admin
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Card Stack */}
        <div className="md:hidden divide-y divide-slate-100">
          {filtered.map((perm) => (
            <div key={perm.module} className="p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-900">{perm.module}</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
                  <div className="mt-1">{renderCaps(perm.patient)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ASHA</span>
                  <div className="mt-1">{renderCaps(perm.asha)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Doctor</span>
                  <div className="mt-1">{renderCaps(perm.doctor)}</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Staff</span>
                  <div className="mt-1">{renderCaps(perm.staff)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
