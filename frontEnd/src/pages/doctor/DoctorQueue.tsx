import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { DataTable, Column } from '@/components/common/DataTable';
import { INITIAL_LIVE_QUEUE } from '@/mock/mockData';
import { Token } from '@/types/queue';
import { queueApi } from '@/api/queueApi';
import { Link } from 'react-router-dom';
import {
  Ticket,
  BellRing,
  SkipForward,
  UserX,
  ExternalLink,
  RefreshCw,
  Clock,
  UserCheck,
} from 'lucide-react';

export const DoctorQueue: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>(INITIAL_LIVE_QUEUE.tokens);
  const [currentToken, setCurrentToken] = useState<string>(
    INITIAL_LIVE_QUEUE.currentTokenNumber
  );
  const [isCalling, setIsCalling] = useState(false);

  const fetchLiveQueue = async () => {
    try {
      const res = await queueApi.getLiveQueue('fac_civil_01');
      if (res.data) {
        setTokens(res.data.tokens || []);
        if (res.data.currentTokenNumber) {
          setCurrentToken(res.data.currentTokenNumber);
        }
      }
    } catch (err) {
      console.warn('Live queue fetch failed, using fallback:', err);
    }
  };

  useEffect(() => {
    fetchLiveQueue();
  }, []);

  const handleCallNext = async () => {
    setIsCalling(true);
    try {
      const res = await queueApi.callNext('fac_civil_01', 'dep_med');
      if (res.data.calledToken) {
        setCurrentToken(res.data.calledToken.tokenNumber);
        setTokens(res.data.queue.tokens);
      }
    } finally {
      setIsCalling(false);
    }
  };

  const handleSkip = async (tokenId: string) => {
    await queueApi.skip('queue_civil_01', tokenId);
    setTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId ? { ...t, status: 'SKIPPED' } : t
      )
    );
  };

  const handleNoShow = async (tokenId: string) => {
    await queueApi.noShow('queue_civil_01', tokenId);
    setTokens((prev) =>
      prev.map((t) =>
        t.id === tokenId ? { ...t, status: 'NO_SHOW' } : t
      )
    );
  };

  const columns: Column<Token>[] = [
    {
      key: 'tokenNumber',
      header: 'Token',
      render: (t) => (
        <span className="font-mono font-black text-sm text-teal-800 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200">
          {t.tokenNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Details',
      render: (t) => (
        <div>
          <span className="font-bold text-slate-900 block text-sm">
            {t.patientName}
          </span>
          <span className="text-xs text-slate-500">
            {t.patientAge}Y • {t.patientGender} • Phone: {t.patientPhone}
          </span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <PriorityBadge priority={t.priority} />,
    },
    {
      key: 'estimatedWaitMinutes',
      header: 'Wait Time',
      render: (t) => (
        <span className="text-xs font-semibold text-slate-600">
          {t.status === 'CALLED'
            ? 'Now inside'
            : `${t.estimatedWaitMinutes} mins`}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (t) => (
        <div className="flex items-center gap-1.5">
          <Link to={`/doctor/patients/${t.patientId}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
            >
              Open Chart
            </Button>
          </Link>

          {t.status === 'WAITING' && (
            <>
              <Button
                onClick={() => handleSkip(t.id)}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-slate-500 hover:text-slate-700"
                title="Skip to next"
              >
                Skip
              </Button>

              <Button
                onClick={() => handleNoShow(t.id)}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50"
                title="Mark No Show"
              >
                No-Show
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div className="[&_h1]:text-xl [&_h1]:sm:text-2xl [&_p]:text-xs [&_p]:sm:text-sm">
        <PageHeader
          title="Live OPD Queue"
          subtitle="Manage waiting patients and call them to the consultation room."
          breadcrumbs={[
            { label: 'Doctor Dashboard', to: '/doctor' },
            { label: 'OPD Queue' },
          ]}
          actions={
            <Button
              onClick={handleCallNext}
              variant="primary"
              size="md"
              className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold"
              isLoading={isCalling}
            >
              <BellRing className="h-4 w-4" />
              <span>Call Next Patient</span>
            </Button>
          }
        />
      </div>


      {/* Queue Status Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">

        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">
            Current Calling Token
          </span>

          <p className="text-3xl font-black text-teal-800 mt-0.5">
            {currentToken}
          </p>

          <span className="text-xs text-slate-500">
            In Room 4
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">
            Total Waiting
          </span>

          <p className="text-3xl font-black text-slate-900 mt-0.5">
            {tokens.filter((t) => t.status === 'WAITING').length}
          </p>

          <span className="text-xs text-slate-500">
            In waiting hall
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold uppercase text-slate-400">
            Average Consult Time
          </span>

          <p className="text-3xl font-black text-slate-900 mt-0.5">
            8 min
          </p>

          <span className="text-xs text-slate-500">
            Within optimal SLA
          </span>
        </div>

      </div>


      {/* Interactive Responsive Table with Mobile Card Fallback */}
      <DataTable
        columns={columns}
        data={tokens}
        keyExtractor={(t) => t.id}
        renderMobileCard={(t) => (
          <Card className="p-4 space-y-3">

            <div className="flex items-center justify-between">
              <span className="font-mono font-black text-base text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                {t.tokenNumber}
              </span>

              <PriorityBadge priority={t.priority} />
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {t.patientName}
              </h3>

              <p className="text-xs text-slate-500">
                {t.patientAge}Y • {t.patientGender} • Wait:{' '}
                {t.estimatedWaitMinutes}m
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">

              <StatusBadge status={t.status} />

              <Link to={`/doctor/patients/${t.patientId}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs bg-teal-700 hover:bg-teal-800"
                >
                  Open Chart
                </Button>
              </Link>

            </div>

          </Card>
        )}
      />

    </div>
  );
};