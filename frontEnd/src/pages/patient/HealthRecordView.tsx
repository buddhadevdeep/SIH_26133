import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

import {
  INITIAL_HEALTH_RECORD,
  INITIAL_PRESCRIPTIONS,
  INITIAL_DIAGNOSTIC_ORDERS,
} from '@/mock/mockData';

import { formatDate } from '@/lib/formatters';

import {
  FileText,
  Activity,
  Pill,
  FlaskConical,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  User,
  Droplet,
  AlertCircle,
} from 'lucide-react';

import { clinicalApi } from '@/api/clinicalApi';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prescription, DiagnosticOrder } from '@/types/clinical';

export const HealthRecordView: React.FC = () => {
  const { t } = useTranslation();
  const { activeMember } = useFamily();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'TIMELINE' | 'PRESCRIPTIONS' | 'DIAGNOSTICS'
  >('TIMELINE');

  const [expandedId, setExpandedId] = useState<string | null>('tl_01');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [diagnostics, setDiagnostics] = useState<DiagnosticOrder[]>(INITIAL_DIAGNOSTIC_ORDERS);
  const [record, setRecord] = useState(INITIAL_HEALTH_RECORD);

  useEffect(() => {
    const patientId = activeMember?.id || user?.id || 'usr_pat_01';
    
    clinicalApi.getPatientHealthRecord(patientId).then((res) => {
      if (res.data) setRecord(res.data);
    }).catch(console.warn);

    clinicalApi.getPrescriptions(patientId).then((res) => {
      if (res.data && res.data.length > 0) setPrescriptions(res.data);
    }).catch(console.warn);

    clinicalApi.getDiagnosticOrders(patientId).then((res) => {
      if (res.data && res.data.length > 0) setDiagnostics(res.data);
    }).catch(console.warn);
  }, [activeMember?.id, user?.id]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-5">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title={t('records.title')}
        subtitle={t('records.subtitle')}
        breadcrumbs={[
          { label: t('nav.dashboard', 'Dashboard'), to: '/patient' },
          { label: t('records.title') },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Download className="h-4 w-4" />
            {t('records.downloadAll')}
          </Button>
        }
      />


      {/* =====================================================
          PATIENT INFORMATION
      ====================================================== */}

      <Card className="border-slate-200 bg-white shadow-sm">

        <CardContent className="p-4">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            {/* Patient */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50">
                <User className="h-5 w-5 text-teal-700" />
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-base font-bold text-slate-900">
                    {record.name}
                  </h2>

                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                    ABHA: {record.abhaId}
                  </span>

                </div>

                <p className="mt-1 text-[11px] text-slate-500">
                  Age: {record.age} years
                  <span className="mx-1.5">•</span>
                  {record.gender}
                  <span className="mx-1.5">•</span>
                  Blood Group: <strong>{record.bloodGroup}</strong>
                </p>

              </div>

            </div>


            {/* Health Information */}

            <div className="flex flex-wrap gap-2">

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">

                <div className="flex items-center gap-1.5">

                  <Activity className="h-3.5 w-3.5 text-teal-600" />

                  <span className="text-[10px] font-semibold text-slate-500">
                    Health Problems
                  </span>

                </div>

                <p className="mt-0.5 text-xs font-semibold text-slate-800">
                  {record.chronicConditions?.length
                    ? record.chronicConditions.join(', ')
                    : 'None'}
                </p>

              </div>


              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">

                <div className="flex items-center gap-1.5">

                  <AlertCircle className="h-3.5 w-3.5 text-rose-600" />

                  <span className="text-[10px] font-semibold text-rose-600">
                    Allergies
                  </span>

                </div>

                <p className="mt-0.5 text-xs font-semibold text-rose-800">
                  {record.allergies?.length
                    ? record.allergies.join(', ')
                    : 'None'}
                </p>

              </div>

            </div>

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          TABS
      ====================================================== */}

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as 'TIMELINE' | 'PRESCRIPTIONS' | 'DIAGNOSTICS'
          )
        }
      >

        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">

          <TabsTrigger
            value="TIMELINE"
            icon={<Activity className="h-4 w-4" />}
          >
            {t('records.tabTimeline')}
          </TabsTrigger>

          <TabsTrigger
            value="PRESCRIPTIONS"
            icon={<Pill className="h-4 w-4" />}
          >
            {t('records.tabPrescriptions')}
          </TabsTrigger>

          <TabsTrigger
            value="DIAGNOSTICS"
            icon={<FlaskConical className="h-4 w-4" />}
          >
            {t('records.tabDiagnostics')}
          </TabsTrigger>

        </TabsList>


        {/* =====================================================
            MEDICAL HISTORY
        ====================================================== */}

        <TabsContent
          value="TIMELINE"
          className="space-y-2.5 pt-3"
        >

          {record.timeline.map((event) => {

            const isExpanded = expandedId === event.id;

            return (

              <Card
                key={event.id}
                className="border-slate-200 bg-white shadow-sm hover:border-teal-200 transition"
              >

                <CardContent className="p-3.5">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-start gap-3 min-w-0">

                      {/* Date Icon */}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">

                        <CalendarDays className="h-4 w-4 text-teal-700" />

                      </div>


                      {/* Main Information */}

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700">
                            {event.eventType}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {formatDate(event.date)}
                          </span>

                        </div>

                        <h3 className="mt-1 text-sm font-bold text-slate-900">
                          {event.title}
                        </h3>

                        <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                          {event.facilityName}
                          {event.doctorName
                            ? ` • ${event.doctorName}`
                            : ''}
                        </p>

                      </div>

                    </div>


                    {/* Expand Button */}

                    <button
                      type="button"
                      onClick={() => toggleExpand(event.id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={
                        isExpanded
                          ? 'Hide details'
                          : 'Show details'
                      }
                    >

                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}

                    </button>

                  </div>


                  {/* Details */}

                  {isExpanded && (

                    <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">

                      <p className="text-[11px] leading-relaxed text-slate-700">
                        {event.summary}
                      </p>

                    </div>

                  )}

                </CardContent>

              </Card>

            );
          })}

        </TabsContent>


        {/* =====================================================
            MEDICINES
        ====================================================== */}

        <TabsContent
          value="PRESCRIPTIONS"
          className="space-y-3 pt-3"
        >

          {prescriptions.length === 0 ? (
            <Card className="border-slate-200 bg-white p-8 text-center">
              <Pill className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No Prescriptions on File</p>
              <p className="text-xs text-slate-400 mt-1">Prescriptions issued by doctors will appear here automatically.</p>
            </Card>
          ) : (
            prescriptions.map((rx) => (

            <Card
              key={rx.id}
              className="border-slate-200 bg-white shadow-sm"
            >

              <CardContent className="p-4">

                {/* Prescription Header */}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">

                        <Pill className="h-4 w-4 text-blue-600" />

                      </div>

                      <h3 className="text-sm font-bold text-slate-900">
                        {rx.diagnosisSummary}
                      </h3>

                      <StatusBadge status={rx.status} />

                    </div>

                    <p className="mt-1.5 text-[10px] text-slate-500">

                      Doctor: {rx.doctorName}

                      <span className="mx-1.5">•</span>

                      {rx.facilityName}

                      <span className="mx-1.5">•</span>

                      {formatDate(rx.issuedAt)}

                    </p>

                  </div>


                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-[10px] shrink-0"
                  >

                    <Download className="h-3.5 w-3.5" />

                    Download

                  </Button>

                </div>


                {/* Medicine List */}

                <div className="mt-3 space-y-1.5">

                  {(rx.items || []).map((item, idx) => (

                    <div
                      key={item.id || idx}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >

                      <div className="sm:col-span-1">

                        <p className="text-[9px] text-slate-400 uppercase font-semibold">
                          Medicine
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-slate-900">
                          {item.medicineName}
                        </p>

                      </div>


                      <div>

                        <p className="text-[9px] text-slate-400 uppercase font-semibold">
                          How Much
                        </p>

                        <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                          {item.dosage}
                        </p>

                      </div>


                      <div>

                        <p className="text-[9px] text-slate-400 uppercase font-semibold">
                          How Often
                        </p>

                        <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                          {item.frequency}
                        </p>

                      </div>


                      <div>

                        <p className="text-[9px] text-slate-400 uppercase font-semibold">
                          For How Long
                        </p>

                        <div className="mt-0.5 flex items-center justify-between gap-2">

                          <span className="text-[11px] font-semibold text-slate-700">
                            {item.duration}
                          </span>

                          <StatusBadge
                            status={item.dispensedStatus || 'PENDING'}
                          />

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              </CardContent>

            </Card>

          )))}

        </TabsContent>


        {/* =====================================================
            TEST REPORTS
        ====================================================== */}

        <TabsContent
          value="DIAGNOSTICS"
          className="space-y-2.5 pt-3"
        >

          {diagnostics.length === 0 ? (
            <Card className="border-slate-200 bg-white p-8 text-center">
              <FlaskConical className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">No Diagnostic Reports on File</p>
              <p className="text-xs text-slate-400 mt-1">Laboratory and diagnostic test results will appear here.</p>
            </Card>
          ) : (
            diagnostics.map((order) => (

            <Card
              key={order.id}
              className="border-slate-200 bg-white shadow-sm"
            >

              <CardContent className="p-3.5">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div className="flex items-start gap-3 min-w-0">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50">

                      <FlaskConical className="h-4 w-4 text-purple-600" />

                    </div>


                    <div className="min-w-0">

                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        {order.testCategory}
                      </span>

                      <h3 className="mt-0.5 text-sm font-bold text-slate-900">
                        {order.testName}
                      </h3>

                      <p className="mt-0.5 text-[10px] text-slate-500">

                        Ordered by {order.orderedBy}

                        <span className="mx-1.5">•</span>

                        {formatDate(order.orderedAt)}

                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-2 shrink-0">

                    <StatusBadge status={order.status} />

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-[10px]"
                    >

                      <Download className="h-3.5 w-3.5" />

                      Report

                    </Button>

                  </div>

                </div>


                {/* Result */}

                {order.resultSummary && (

                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">

                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                    <div>

                      <p className="text-[9px] font-bold uppercase text-emerald-700">
                        Test Result
                      </p>

                      <p className="mt-0.5 text-xs font-semibold text-emerald-900">
                        {order.resultSummary}
                      </p>

                    </div>

                  </div>

                )}

              </CardContent>

            </Card>

          )))}

        </TabsContent>

      </Tabs>


      {/* =====================================================
          SIMPLE HELP
      ====================================================== */}

      <div className="flex items-start gap-2.5 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">

        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />

        <div>

          <p className="text-xs font-semibold text-teal-900">
            Keep your health records safe
          </p>

          <p className="mt-0.5 text-[10px] text-teal-700">
            You can show these records to your doctor during your next visit.
          </p>

        </div>

      </div>

    </div>
  );
};