import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  Ticket,
  Calendar,
  CalendarCheck2,
  FileText,
  GitBranch,
  Video,
  UserPlus,
  Activity,
  ClipboardList,
  AlertOctagon,
  RefreshCw,
  Users,
  Pill,
  FlaskConical,
  Bed,
  Ambulance,
  Droplet,
  Wrench,
  Map,
  TrendingUp,
  BrainCircuit,
  Server,
  KeyRound,
  ShieldCheck,
  Clock,
  Package,
  History,
  QrCode,
  FileCheck,
  Home,
  ListTodo,
  Stethoscope,
  Settings,
  Radar,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
  section?: string;
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, staffSubType } = useAuth();
  const { pendingSyncCount, networkState } = useConnection();
  const { t } = useTranslation();

  // --------------------------------------------------
  // NAVIGATION ITEMS
  // --------------------------------------------------
  const getNavItems = (): NavItem[] => {
    switch (role) {
      // ==================================================
      // CITIZEN / PATIENT
      // ==================================================
      case 'PATIENT':
        return [
          {
            to: '/patient',
            label: 'Home',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            to: '/patient/facilities',
            label: 'Nearby Hospitals',
            icon: Building2,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            to: '/patient/medical-stores',
            label: 'Medical Stores',
            icon: Pill,
            color: 'text-teal-600 bg-teal-50',
          },
          {
            to: '/patient/tokens',
            label: 'My Token',
            icon: Ticket,
            color: 'text-orange-600 bg-orange-50',
          },
          {
            to: '/patient/appointments',
            label: 'My Appointments',
            icon: Calendar,
            color: 'text-pink-600 bg-pink-50',
          },
          {
            to: '/patient/records',
            label: 'My Health Records',
            icon: FileText,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            to: '/patient/referrals',
            label: 'Referral',
            icon: GitBranch,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            to: '/patient/consultations',
            label: 'Talk to Doctor',
            icon: Video,
            color: 'text-cyan-600 bg-cyan-50',
          },
          {
            to: '/patient/profile',
            label: 'Family & Profile',
            icon: Users,
            color: 'text-violet-600 bg-violet-50',
          },
        ];

      // ==================================================
      // DOCTOR
      // ==================================================
      case 'DOCTOR':
        return [
          {
            to: '/doctor',
            label: 'Home',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            to: '/doctor/patients',
            label: 'Patients & Treatment',
            icon: Activity,
            color: 'text-red-600 bg-red-50',
          },
          {
            to: '/doctor/patients/history',
            label: 'Old & Recent Records',
            icon: History,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            to: '/doctor/referrals',
            label: 'Referrals',
            icon: GitBranch,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            to: '/doctor/teleconsultations',
            label: 'Online Doctor',
            icon: Video,
            color: 'text-cyan-600 bg-cyan-50',
          },
          {
            to: '/doctor/roster',
            label: 'Schedule/Leaves',
            icon: CalendarCheck2,
            color: 'text-emerald-600 bg-emerald-50',
          },
        ];

      // ==================================================
      // HOSPITAL / FACILITY STAFF
      // ==================================================
      case 'FACILITY_STAFF': {
        // Pharmacist
        if (staffSubType === 'PHARMACIST') {
          return [
            {
              to: '/pharmacist',
              label: 'Today / Hub',
              icon: LayoutDashboard,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              to: '/pharmacist/prescriptions',
              label: 'Prescription Queue',
              icon: Clock,
              color: 'text-orange-600 bg-orange-50',
            },
            {
              to: '/pharmacist/stock',
              label: 'Stock & Inventory',
              icon: Package,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              to: '/pharmacist/expiry',
              label: 'Expiry & Quarantine',
              icon: Calendar,
              color: 'text-rose-600 bg-rose-50',
            },
            {
              to: '/pharmacist/history',
              label: 'Dispense History',
              icon: History,
              color: 'text-purple-600 bg-purple-50',
            },
          ];
        }

        // Registration Clerk
        if (staffSubType === 'REGISTRATION_CLERK') {
          return [
            {
              to: '/registration-clerk',
              label: 'Front Desk Hub',
              icon: LayoutDashboard,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              to: '/registration-clerk/register',
              label: 'Patient Registration',
              icon: UserPlus,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              to: '/registration-clerk/appointments',
              label: 'Appointment Desk',
              icon: CalendarCheck2,
              color: 'text-pink-600 bg-pink-50',
            },
            {
              to: '/registration-clerk/queue',
              label: 'OPD Token Counter',
              icon: Ticket,
              color: 'text-orange-600 bg-orange-50',
            },
          ];
        }

        // Facility Operations
        if (staffSubType === 'FACILITY_OPERATIONS') {
          return [
            {
              to: '/facility-operations',
              label: 'Operations Command',
              icon: LayoutDashboard,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              to: '/facility-operations/services',
              label: 'Services & OPD Status',
              icon: Activity,
              color: 'text-emerald-600 bg-emerald-50',
            },
            {
              to: '/facility-operations/staff-leave',
              label: 'Staff Leave & Coverage',
              icon: Calendar,
              color: 'text-teal-600 bg-teal-50',
            },
            {
              to: '/facility-operations/queues',
              label: 'Live Queue Velocity',
              icon: Ticket,
              color: 'text-orange-600 bg-orange-50',
            },
            {
              to: '/facility-operations/referrals',
              label: 'Transfer Coordination',
              icon: GitBranch,
              color: 'text-indigo-600 bg-indigo-50',
            },
            {
              to: '/facility-operations/alerts',
              label: 'Operational Alerts',
              icon: AlertOctagon,
              color: 'text-rose-600 bg-rose-50',
            },
          ];
        }

        // Generic Staff Fallback
        return [
          {
            to: '/staff',
            label: 'Home',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            to: '/staff/registration',
            label: 'Register Patient',
            icon: UserPlus,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            to: '/staff/queue',
            label: 'Patient Tokens',
            icon: Ticket,
            color: 'text-orange-600 bg-orange-50',
          },
          {
            to: '/staff/pharmacy',
            label: 'Medicine & Stock',
            icon: Pill,
            color: 'text-pink-600 bg-pink-50',
          },
          {
            to: '/staff/beds',
            label: 'Hospital Beds',
            icon: Bed,
            color: 'text-blue-600 bg-blue-50',
          },
        ];
      }

      // ==================================================
      // DISTRICT ADMIN
      // ==================================================
      case 'DISTRICT_ADMIN':
        return [
          // 1. Overview
          {
            to: '/district',
            label: 'Overview',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
            section: 'Overview',
          },
          {
            to: '/district/alerts',
            label: 'Action Center',
            icon: AlertOctagon,
            color: 'text-rose-600 bg-rose-50',
            section: 'Overview',
          },

          // 2. Facilities & Care
          {
            to: '/district/facilities',
            label: 'Facilities',
            icon: Building2,
            color: 'text-cyan-600 bg-cyan-50',
            section: 'Facilities & Care',
          },
          {
            to: '/district/doctors',
            label: 'Doctors',
            icon: Stethoscope,
            color: 'text-teal-600 bg-teal-50',
            section: 'Facilities & Care',
          },
          {
            to: '/district/referrals',
            label: 'Referrals',
            icon: GitBranch,
            color: 'text-indigo-600 bg-indigo-50',
            section: 'Facilities & Care',
          },

          // 3. District Resources
          {
            to: '/district/resources',
            label: 'Resource Planning',
            icon: Activity,
            color: 'text-cyan-600 bg-cyan-50',
            section: 'District Resources',
          },
          {
            to: '/district/medicines',
            label: 'Medicines',
            icon: Pill,
            color: 'text-pink-600 bg-pink-50',
            section: 'District Resources',
          },
          {
            to: '/district/blood',
            label: 'Blood Bank',
            icon: Droplet,
            color: 'text-red-600 bg-red-50',
            section: 'District Resources',
          },
          {
            to: '/district/ambulances',
            label: 'Ambulances',
            icon: Ambulance,
            color: 'text-amber-600 bg-amber-50',
            section: 'District Resources',
          },
          {
            to: '/district/diagnostics',
            label: 'Diagnostics',
            icon: FlaskConical,
            color: 'text-purple-600 bg-purple-50',
            section: 'District Resources',
          },

          // 4. Public Health & Insights
          {
            to: '/district/resource-intelligence',
            label: 'Resource Intelligence',
            icon: Radar,
            color: 'text-teal-700 bg-teal-50',
            section: 'Public Health & Insights',
          },
          {
            to: '/district/map',
            label: 'District Map',
            icon: Map,
            color: 'text-emerald-600 bg-emerald-50',
            section: 'Public Health & Insights',
          },
          {
            to: '/district/disease-trends',
            label: 'Disease Trends',
            icon: TrendingUp,
            color: 'text-rose-600 bg-rose-50',
            section: 'Public Health & Insights',
          },
          {
            to: '/district/ai',
            label: 'Demand Forecast',
            icon: BrainCircuit,
            color: 'text-violet-600 bg-violet-50',
            section: 'Public Health & Insights',
          },
          {
            to: '/district/reports',
            label: 'Reports & Exports',
            icon: FileText,
            color: 'text-slate-600 bg-slate-100',
            section: 'Public Health & Insights',
          },
        ];

      // ==================================================
      // SUPER ADMIN
      // ==================================================
      case 'SUPER_ADMIN':
        return [
          {
            to: '/super-admin',
            label: 'Dashboard',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            to: '/super-admin/system-health',
            label: 'System Health',
            icon: Server,
            color: 'text-emerald-600 bg-emerald-50',
          },
          {
            to: '/super-admin/facilities',
            label: 'Facilities',
            icon: Building2,
            color: 'text-cyan-600 bg-cyan-50',
          },
          {
            to: '/super-admin/district-admins',
            label: 'District Admins',
            icon: UserCheck,
            color: 'text-indigo-600 bg-indigo-50',
          },
          {
            to: '/super-admin/users',
            label: 'Users',
            icon: Users,
            color: 'text-purple-600 bg-purple-50',
          },
          {
            to: '/super-admin/settings',
            label: 'Settings',
            icon: Settings,
            color: 'text-slate-600 bg-slate-100',
          },
        ];

      default:
        return [
          {
            to: '/patient',
            label: 'Home',
            icon: LayoutDashboard,
            color: 'text-blue-600 bg-blue-50',
          },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* MOBILE BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-x-0 top-16 bottom-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={cn(
          `fixed top-16 bottom-0 left-0 z-30
          w-64 h-[calc(100vh-4rem)]
          border-r border-slate-200
          bg-white
          shadow-[4px_0_24px_rgba(15,23,42,0.04)]
          transition-transform duration-200
          ease-in-out
          md:sticky md:top-16
          md:shrink-0 md:translate-x-0
          flex flex-col`,
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* ---------------------------------------------
            OFFLINE MODE BANNER
        --------------------------------------------- */}
        {networkState === 'OFFLINE' && (
          <div className="mx-3 my-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-800">
                  {t('status.offline', 'OFFLINE MODE')}
                </span>
              </div>
              {pendingSyncCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
                  {pendingSyncCount} {t('common.queued', 'queued')}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-amber-700">
              {t('status.offlineNotice', 'Data will sync when internet is available.')}
            </p>
          </div>
        )}

        {/* ---------------------------------------------
            NAVIGATION
        --------------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {!navItems[0]?.section && (
            <div className="mb-2 px-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                  {t('sections.Menu', 'Menu')}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const showSection =
                item.section &&
                (index === 0 || navItems[index - 1].section !== item.section);

              return (
                <React.Fragment key={item.to}>
                  {showSection && (
                    <div
                      className={cn(
                        'px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400',
                        index > 0 ? 'pt-3.5 pb-1' : 'pb-1'
                      )}
                    >
                      {item.section ? t(`sections.${item.section}`, item.section) : ''}
                    </div>
                  )}
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    end={item.to.split('/').length <= 2}
                    className={({ isActive }) =>
                      cn(
                        `group relative flex items-center justify-between rounded-2xl px-2.5 py-2 min-h-[44px] text-sm font-medium transition-all duration-200`,
                        isActive
                          ? `bg-[#E1EFFA] text-[#1D6394] font-bold shadow-xs`
                          : `text-slate-600 hover:bg-slate-50 hover:text-slate-900`
                      )
                    }
                  >
                  {({ isActive }) => (
                    <>
                      {/* Active Left Indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-[#1D6394]" />
                      )}

                      <div className="flex min-w-0 items-center gap-3">
                        {/* ICON */}
                        <div
                          className={cn(
                            `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200`,
                            isActive
                              ? 'bg-white shadow-xs text-[#1D6394]'
                              : item.color || 'bg-slate-50 text-slate-500'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-[18px] w-[18px]',
                              isActive ? 'text-[#1D6394]' : ''
                            )}
                          />
                        </div>

                        {/* LABEL */}
                        <span className="truncate">{t(`navMap.${item.label}`, item.label)}</span>
                      </div>

                      {/* BADGE */}
                      {item.badge !== undefined && (
                        <span className="ml-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </React.Fragment>
            );
          })}
          </nav>
        </div>
      </aside>
    </>
  );
};
