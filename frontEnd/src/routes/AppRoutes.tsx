import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

// Public & Auth Pages
import { LandingPage } from '@/pages/LandingPage';
import { Login } from '@/pages/auth/Login';
import { Unauthorized, NotFound } from '@/pages/errors/Unauthorized';

// Patient Pages
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { FacilityDiscovery } from '@/pages/patient/FacilityDiscovery';
import { FacilityDetail } from '@/pages/patient/FacilityDetail';
import { TokenExperience } from '@/pages/patient/TokenExperience';
import { AppointmentBooking } from '@/pages/patient/AppointmentBooking';
import { AppointmentDetails } from '@/pages/patient/AppointmentDetails';
import { HealthRecordView } from '@/pages/patient/HealthRecordView';
import { ReferralTracking } from '@/pages/patient/ReferralTracking';
import { ReferralDetails } from '@/pages/patient/ReferralDetails';
import ClinicalNotes from '@/pages/patient/ClinicalNotes';
import TeleconsultationRoomPatient from '@/pages/patient/TeleconsultationRoom';
import TeleconsultationHistory from '@/pages/patient/TeleconsultationHistory';
import Teleconsultation from '@/pages/patient/Teleconsultation';
import { PatientProfile } from '@/pages/patient/PatientProfile';
import { NearbyMedicalStores } from '@/pages/patient/NearbyMedicalStores';

// Doctor Pages
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { PatientClinicalWorkspace } from '@/pages/doctor/PatientClinicalWorkspace';
import { PatientHistoryPage } from '@/pages/doctor/PatientHistoryPage';
import { ReferralCreationWizard } from '@/pages/doctor/ReferralCreationWizard';
import { DoctorReferralHub } from '@/pages/doctor/DoctorReferralHub';
import TeleconsultationRoomDoctor from '@/pages/doctor/TeleconsultationRoom';

// Facility Staff Pages
import { StaffDashboard } from '@/pages/staff/StaffDashboard';

// Registration Clerk Pages
import { RegistrationClerkDashboard } from '@/pages/registration-clerk/RegistrationClerkDashboard';
import { PatientRegistrationWizard } from '@/pages/registration-clerk/PatientRegistrationWizard';
import { PatientSummaryPage } from '@/pages/registration-clerk/PatientSummaryPage';
import { AppointmentDeskPage } from '@/pages/registration-clerk/AppointmentDeskPage';
import { QueueCounterPage } from '@/pages/registration-clerk/QueueCounterPage';

// Pharmacist Pages
import { PharmacistDashboard } from '@/pages/pharmacist/PharmacistDashboard';
import { PrescriptionQueuePage } from '@/pages/pharmacist/PrescriptionQueuePage';
import { PrescriptionDetailPage } from '@/pages/pharmacist/PrescriptionDetailPage';
import { PharmacyStockPage } from '@/pages/pharmacist/PharmacyStockPage';
import { ExpiryManagementPage } from '@/pages/pharmacist/ExpiryManagementPage';
import { DispensingHistoryPage } from '@/pages/pharmacist/DispensingHistoryPage';

// Facility Operations Pages
import { FacilityOperationsDashboard } from '@/pages/facility-operations/FacilityOperationsDashboard';
import { ServicesOperationsPage } from '@/pages/facility-operations/ServicesOperationsPage';
import { StaffLeaveOperationsPage } from '@/pages/facility-operations/StaffLeaveOperationsPage';
import { QueuesOperationsPage } from '@/pages/facility-operations/QueuesOperationsPage';
import { ReferralOperationsPage } from '@/pages/facility-operations/ReferralOperationsPage';
import { AlertsCenterPage } from '@/pages/facility-operations/AlertsCenterPage';

// District Admin Pages
import { DistrictCommandDashboard } from '@/pages/district/DistrictCommandDashboard';
import { DistrictFacilitiesPage } from '@/pages/district/DistrictFacilitiesPage';
import { DistrictFacilityDetailPage } from '@/pages/district/DistrictFacilityDetailPage';
import { DistrictDoctorsPage } from '@/pages/district/DistrictDoctorsPage';
import { DistrictResourcesPage } from '@/pages/district/DistrictResourcesPage';
import { DistrictMedicinesPage } from '@/pages/district/DistrictMedicinesPage';
import { DistrictBloodPage } from '@/pages/district/DistrictBloodPage';
import { DistrictAmbulancesPage } from '@/pages/district/DistrictAmbulancesPage';
import { DistrictDiagnosticsPage } from '@/pages/district/DistrictDiagnosticsPage';
import { DistrictMapView } from '@/pages/district/DistrictMapView';
import { ReferralMonitor } from '@/pages/district/ReferralMonitor';
import { DiseaseTrends } from '@/pages/district/DiseaseTrends';
import { AiDemandIntelligence } from '@/pages/district/AiDemandIntelligence';
import { DistrictAlertsPage } from '@/pages/district/DistrictAlertsPage';
import { DistrictReportsPage } from '@/pages/district/DistrictReportsPage';
import { DistrictResourceIntelligencePage } from '@/pages/district/DistrictResourceIntelligencePage';

// Super Admin Pages
import { SuperAdminDashboard } from '@/pages/super-admin/SuperAdminDashboard';
import { TechnicalCenterPage } from '@/pages/super-admin/TechnicalCenterPage';
import { SystemHealthPage } from '@/pages/super-admin/SystemHealthPage';
import { FacilityGovernancePage } from '@/pages/super-admin/FacilityGovernancePage';
import { DistrictAdminsPage } from '@/pages/super-admin/DistrictAdminsPage';
import { UserManagementPage } from '@/pages/super-admin/UserManagementPage';
import { RolesPermissionsPage } from '@/pages/super-admin/RolesPermissionsPage';
import { AiModelRegistryPage } from '@/pages/super-admin/AiModelRegistryPage';
import { AuditLogsPage } from '@/pages/super-admin/AuditLogsPage';
import { SuperAdminSettingsPage } from '@/pages/super-admin/SuperAdminSettingsPage';
import { UserProfilePage } from '@/pages/profile/UserProfilePage';

// Hospital Admin Pages
import { HospitalDashboard } from '@/pages/hospital/HospitalDashboard';
import { HospitalStaffManagement } from '@/pages/hospital/HospitalStaffManagement';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing & Authentication */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/patient/login" element={<Login />} />
      <Route path="/403" element={<Unauthorized />} />

      {/* Universal Profile Route for all authenticated roles */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'FACILITY_STAFF', 'HOSPITAL_ADMIN', 'DISTRICT_ADMIN', 'SUPER_ADMIN']}>
            <AppShell>
              <UserProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Doctor Roster & Monthly Planner Route */}
      <Route
        path="/doctor/roster"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <UserProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 1. PATIENT / CITIZEN ROUTES */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <PatientDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/facilities"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <FacilityDiscovery />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/facilities/:id"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <FacilityDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/tokens"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <TokenExperience />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/token"
        element={<Navigate to="/patient/tokens" replace />}
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <AppointmentBooking />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointment"
        element={<Navigate to="/patient/appointments" replace />}
      />
      <Route
        path="/patient/appointments/:id"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <AppointmentDetails />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/records"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <HealthRecordView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/referrals"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <ReferralTracking />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/referral"
        element={<Navigate to="/patient/referrals" replace />}
      />
      <Route
        path="/patient/health-records"
        element={<Navigate to="/patient/records" replace />}
      />
      <Route
        path="/patient/referrals/:id"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <ReferralDetails />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/consultations"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <Teleconsultation />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/teleconsultation"
        element={<Navigate to="/patient/consultations" replace />}
      />
      <Route
        path="/patient/teleconsultations"
        element={<Navigate to="/patient/consultations" replace />}
      />
      <Route
        path="/patient/consultations/room"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <TeleconsultationRoomPatient />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/teleconsultation-history"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <TeleconsultationHistory />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <PatientProfile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/family"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <PatientProfile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/medical-stores"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AppShell>
              <NearbyMedicalStores />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/nearby-pharmacies"
        element={<Navigate to="/patient/medical-stores" replace />}
      />

      {/* 2. DISABLED ASHA ROLE ROUTES (Redirect to Home) */}
      <Route path="/asha" element={<Navigate to="/" replace />} />
      <Route path="/asha/*" element={<Navigate to="/" replace />} />

      {/* 3. DOCTOR / MEDICAL OFFICER ROUTES */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <DoctorDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/queue"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <Navigate to="/doctor/patients" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <PatientClinicalWorkspace />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients/:id"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <PatientClinicalWorkspace />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients/:id/history"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <PatientHistoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients/history"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <PatientHistoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/history"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <PatientHistoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/referrals"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <DoctorReferralHub />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/teleconsultations"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <TeleconsultationRoomDoctor />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/clinical-notes"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AppShell>
              <ClinicalNotes />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 4. FACILITY STAFF & PHARMACIST & REGISTRATION CLERK ROUTES */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <StaffDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/pharmacy"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PharmacistDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/lab"
        element={<Navigate to="/staff" replace />}
      />
      <Route
        path="/staff/registration"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PatientRegistrationWizard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/queue"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <QueueCounterPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/operations"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <FacilityOperationsDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/:subview"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <StaffDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* DEDICATED REGISTRATION CLERK ROUTES */}
      <Route
        path="/registration-clerk"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <RegistrationClerkDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-clerk/register"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PatientRegistrationWizard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-clerk/patients"
        element={<Navigate to="/registration-clerk" replace />}
      />
      <Route
        path="/registration-clerk/patients/:id"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PatientSummaryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-clerk/appointments"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <AppointmentDeskPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/registration-clerk/queue"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <QueueCounterPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* DEDICATED PHARMACIST ROUTES */}
      <Route
        path="/pharmacist"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PharmacistDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PrescriptionQueuePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/prescriptions/:id"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PrescriptionDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/stock"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <PharmacyStockPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/expiry"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <ExpiryManagementPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacist/history"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <DispensingHistoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* DISABLED LAB TECHNICIAN ROUTES (Redirect to Home) */}
      <Route path="/lab-technician" element={<Navigate to="/" replace />} />
      <Route path="/lab-technician/*" element={<Navigate to="/" replace />} />

      {/* DEDICATED FACILITY OPERATIONS ROUTES */}
      <Route
        path="/facility-operations"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <FacilityOperationsDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/services"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <ServicesOperationsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/staff-leave"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <StaffLeaveOperationsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/queues"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <QueuesOperationsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/referrals"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <ReferralOperationsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/resources"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <Navigate to="/facility-operations" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facility-operations/alerts"
        element={
          <ProtectedRoute allowedRoles={['FACILITY_STAFF']}>
            <AppShell>
              <AlertsCenterPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 5. HOSPITAL ADMIN ROUTES */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
            <AppShell>
              <HospitalDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/staff"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL_ADMIN']}>
            <AppShell>
              <HospitalStaffManagement />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 6. DISTRICT HEALTH ADMIN ROUTES */}
      <Route
        path="/district"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictCommandDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/facilities"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictFacilitiesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/facilities/:id"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictFacilityDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/doctors"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictDoctorsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/referrals"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <ReferralMonitor />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/operations"
        element={<Navigate to="/district" replace />}
      />
      <Route
        path="/district/resources"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictResourcesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/medicines"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictMedicinesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/blood"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictBloodPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/ambulances"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictAmbulancesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/diagnostics"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictDiagnosticsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/map"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictMapView />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/disease-trends"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DiseaseTrends />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/ai"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN', 'SUPER_ADMIN']}>
            <AppShell>
              <AiDemandIntelligence />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/alerts"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictAlertsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/resource-intelligence"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN', 'SUPER_ADMIN']}>
            <AppShell>
              <DistrictResourceIntelligencePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/district/intelligence"
        element={<Navigate to="/district/resource-intelligence" replace />}
      />
      <Route
        path="/district/reports"
        element={
          <ProtectedRoute allowedRoles={['DISTRICT_ADMIN']}>
            <AppShell>
              <DistrictReportsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* District Admin Aliases (/district-admin/* -> /district/*) */}
      <Route path="/district-admin" element={<Navigate to="/district" replace />} />
      <Route path="/district-admin/resource-intelligence" element={<Navigate to="/district/resource-intelligence" replace />} />
      <Route path="/district-admin/intelligence" element={<Navigate to="/district/resource-intelligence" replace />} />
      <Route path="/district-admin/facilities" element={<Navigate to="/district/facilities" replace />} />
      <Route path="/district-admin/facilities/:id" element={<Navigate to="/district/facilities/:id" replace />} />
      <Route path="/district-admin/doctors" element={<Navigate to="/district/doctors" replace />} />
      <Route path="/district-admin/referrals" element={<Navigate to="/district/referrals" replace />} />
      <Route path="/district-admin/operations" element={<Navigate to="/district" replace />} />
      <Route path="/district-admin/resources" element={<Navigate to="/district/resources" replace />} />
      <Route path="/district-admin/medicines" element={<Navigate to="/district/medicines" replace />} />
      <Route path="/district-admin/blood" element={<Navigate to="/district/blood" replace />} />
      <Route path="/district-admin/ambulances" element={<Navigate to="/district/ambulances" replace />} />
      <Route path="/district-admin/diagnostics" element={<Navigate to="/district/diagnostics" replace />} />
      <Route path="/district-admin/map" element={<Navigate to="/district/map" replace />} />
      <Route path="/district-admin/disease-trends" element={<Navigate to="/district/disease-trends" replace />} />
      <Route path="/district-admin/ai" element={<Navigate to="/district/ai" replace />} />
      <Route path="/district-admin/alerts" element={<Navigate to="/district/alerts" replace />} />
      <Route path="/district-admin/reports" element={<Navigate to="/district/reports" replace />} />
      <Route path="/district-admin/*" element={<Navigate to="/district" replace />} />

      {/* 6. SUPER ADMIN ROUTES (Technical Center & Platform Governance) */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <TechnicalCenterPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/system-health"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <SystemHealthPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/facilities"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <FacilityGovernancePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/district-admins"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <DistrictAdminsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <UserManagementPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/roles"
        element={<Navigate to="/super-admin/users" replace />}
      />
      <Route
        path="/super-admin/ai-models"
        element={<Navigate to="/super-admin" replace />}
      />
      <Route
        path="/super-admin/audit"
        element={<Navigate to="/super-admin" replace />}
      />
      <Route
        path="/super-admin/settings"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <SuperAdminSettingsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      {/* Legacy / Tabbed fallback */}
      <Route
        path="/super-admin/:tab"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <AppShell>
              <SuperAdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* 404 Wildcard Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
