
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import { EmergencyButton } from '@/components/emergency/EmergencyButton';
import { StatusIndicator } from '@/components/common/StatusIndicator';

import {
  HeartPulse,
  Building2,
  Ticket,
  GitBranch,
  FileText,
  WifiOff,
  BrainCircuit,
  ShieldCheck,
  Stethoscope,
  Users,
  Activity,
  Search,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased">

      {/* 1. Global Public Topbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <HeartPulse className="h-6 w-6" />
            </div>

            <div>
              <span className="block text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                SANJEEVANI-CONNECT
              </span>

              <span className="block text-[11px] font-semibold text-teal-800 leading-none">
                National Public Health Access & Care Continuity Grid
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <StatusIndicator />

            <EmergencyButton compact />

            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-slate-50 to-white py-16 sm:py-24 border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">

          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/80 px-3.5 py-1 text-xs font-bold text-teal-900 border border-teal-200 mb-6">
            <ShieldCheck className="h-4 w-4 text-teal-700" />

            <span>
              Smart India Hackathon 2024–2026 Platform • SIH26133
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Connected healthcare.
            <br />

            <span className="text-teal-700">
              From first contact to complete care.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unifying hospital discovery, live digital queues, closed-loop
            referrals, offline frontline ASHA workflows, and predictive
            resource intelligence into an integrated government healthcare
            ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

            <Link to="/login">
              <Button
                size="lg"
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold gap-2 px-6"
              >
                <Search className="h-5 w-5" />
                Find Healthcare Facilities
              </Button>
            </Link>

            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="px-6 font-semibold"
              >
                Authorized Personnel Login
              </Button>
            </Link>

          </div>

          {/* Static Role Information */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-teal-200 bg-white p-5 sm:p-6 shadow-xl shadow-teal-900/5 text-left">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Platform Roles
                </span>

                <h2 className="text-lg font-bold text-slate-900">
                  Healthcare Ecosystem Users
                </h2>
              </div>

              <span className="text-xs text-slate-500">
                Six integrated roles supporting the complete healthcare journey
              </span>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">

              {/* 1. Citizen / Patient */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-left group cursor-default">

                <Users className="h-5 w-5 text-teal-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  1. Citizen / Patient
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  Tokens, EHR & Maps
                </span>

              </div>

              {/* 2. ASHA / ANM */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group cursor-default">

                <Activity className="h-5 w-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  2. ASHA / ANM
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  Offline IndexedDB Sync
                </span>

              </div>

              {/* 3. Doctor */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group cursor-default">

                <Stethoscope className="h-5 w-5 text-sky-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  3. Doctor Specialist
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  OPD Queue & Referral
                </span>

              </div>

              {/* 4. Facility Staff */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left group cursor-default">

                <Building2 className="h-5 w-5 text-amber-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  4. Facility Staff
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  Pharmacy, Lab, Beds
                </span>

              </div>

              {/* 5. District Admin */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group cursor-default">

                <BrainCircuit className="h-5 w-5 text-indigo-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  5. District Admin
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  Command GIS & Outbreaks
                </span>

              </div>

              {/* 6. Super Admin */}
              <div className="flex flex-col p-3 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 transition-all text-left group cursor-default">

                <ShieldCheck className="h-5 w-5 text-rose-700 mb-2 group-hover:scale-110 transition-transform" />

                <span className="text-xs font-bold text-slate-900">
                  6. Super Admin
                </span>

                <span className="text-[11px] text-slate-500 mt-0.5">
                  Models, Audit, Health
                </span>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3. How it Works */}
      <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="text-center max-w-3xl mx-auto mb-12">

            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Continuity of Care
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Complete Closed-Loop Patient Journey
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Ensuring zero drop-offs between frontline health workers,
              primary health centres, and tertiary medical colleges.
            </p>

          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'Find nearby hospitals with live bed & specialist availability.',
              },
              {
                step: '02',
                title: 'Assess',
                desc: 'Frontline ASHA screening & vitals recording in the field.',
              },
              {
                step: '03',
                title: 'Queue',
                desc: 'Real-time digital token tracker with live ETA & calling alerts.',
              },
              {
                step: '04',
                title: 'Consult',
                desc: 'Integrated clinical encounter with digital prescriptions.',
              },
              {
                step: '05',
                title: 'Refer',
                desc: 'Algorithmic clinical suitability matching with SLA timers.',
              },
              {
                step: '06',
                title: 'Follow-up',
                desc: 'Closed-loop post-discharge monitoring & home visits.',
              },
            ].map((s) => (

              <div
                key={s.step}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs"
              >

                <span className="text-xl font-black text-teal-700">
                  {s.step}
                </span>

                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {s.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {s.desc}
                </p>

              </div>

            ))}

          </div>
        </div>
      </section>

      {/* 4. Core Feature Pillars */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="text-center max-w-2xl mx-auto mb-12">

            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Platform Features
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Engineered for Public Health Scale
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 mb-2">
                  <Building2 className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Facility Discovery & GIS
                </CardTitle>

                <CardDescription>
                  Verified government health facilities with live open/closed
                  indicators, available bed quotas, diagnostic equipment
                  readiness, and interactive maps.
                </CardDescription>

              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 mb-2">
                  <Ticket className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Smart Token & Live Queue
                </CardTitle>

                <CardDescription>
                  Live Socket.IO driven OPD waiting queue with ETA prediction,
                  counter allocation, room call vibration alerts, and
                  transparent positioning.
                </CardDescription>

              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-2">
                  <GitBranch className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Closed-Loop Referrals
                </CardTitle>

                <CardDescription>
                  Intelligent multi-criteria facility matching ranking tertiary
                  hospitals by specialist availability, equipment, vacant
                  beds, and distance with SLA tracking.
                </CardDescription>

              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
                  <FileText className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Longitudinal Health Record
                </CardTitle>

                <CardDescription>
                  Comprehensive ABHA-linked timeline encompassing encounters,
                  vital signs, digital pharmacy prescriptions, diagnostic test
                  reports, and referrals.
                </CardDescription>

              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-2">
                  <WifiOff className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Offline ASHA Engine
                </CardTitle>

                <CardDescription>
                  IndexedDB local-first architecture empowering frontline
                  workers in zero-connectivity rural hamlets with automatic
                  sync and conflict resolution.
                </CardDescription>

              </CardHeader>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mb-2">
                  <Activity className="h-5 w-5" />
                </div>

                <CardTitle className="text-lg font-bold">
                  Resource Intelligence
                </CardTitle>

                <CardDescription>
                  Real-time visibility into ICU beds, all 8 blood groups
                  inventory, GPS ambulance fleet tracking, medicine stockout
                  warnings, and medical equipment health.
                </CardDescription>

              </CardHeader>
            </Card>

          </div>
        </div>
      </section>

      {/* 5. AI Healthcare Demand Intelligence */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full bg-teal-900/80 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-700">

                <BrainCircuit className="h-4 w-4" />

                <span>
                  Predictive Public Health Decision Support
                </span>

              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">
                Healthcare Demand Intelligence
              </h2>

              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                Advanced time-series forecasting and anomaly surveillance
                designed to prevent healthcare system bottlenecks before they
                occur.
              </p>

            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 text-xs text-slate-300 max-w-md">

              <span className="font-bold text-amber-400 block mb-1">
                Clinical & Administrative Safety Principle:
              </span>

              AI insights provide demand forecasts and early anomaly
              warnings. All individual clinical diagnoses and administrative
              mobilizations require human clinician verification.

            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5 space-y-2">

              <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                Disease Surge
              </span>

              <p className="text-2xl font-bold">
                Vector Surge Alert
              </p>

              <p className="text-xs text-slate-400">
                LSTM models detect +24.5% deviation in suspected Dengue
                clusters 3 weeks in advance.
              </p>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5 space-y-2">

              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Specialist Gap
              </span>

              <p className="text-2xl font-bold">
                +42 Consult Deficit
              </p>

              <p className="text-xs text-slate-400">
                Cardiology shortage identified in Sub-District Hospital;
                automated tele-consult recommendations triggered.
              </p>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5 space-y-2">

              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Bed Occupancy
              </span>

              <p className="text-2xl font-bold">
                92% ICU Peak
              </p>

              <p className="text-xs text-slate-400">
                Prophet model projects critical care capacity exhaustion
                within 72 hours.
              </p>

            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-5 space-y-2">

              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Blood Bank
              </span>

              <p className="text-2xl font-bold">
                AB- & O- Critical
              </p>

              <p className="text-xs text-slate-400">
                Automated alerts dispatched to neighboring civil blood banks
                for inter-district replenishment.
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* 6. Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <HeartPulse className="h-5 w-5 text-teal-700" />

            <span className="font-bold text-slate-800">
              SANJEEVANI-CONNECT
            </span>

            <span>
              • SIH26133 Integrated Healthcare Platform
            </span>

          </div>

          <div className="flex items-center gap-6">

            <span>
              Emergency Services: 108 / 102
            </span>

            <span>
              National Health Mission
            </span>

            <span>
              Ministry of Health & Family Welfare
            </span>

          </div>

        </div>
      </footer>

    </div>
  );
};
