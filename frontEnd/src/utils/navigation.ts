import { User, UserRole, StaffSubType } from '@/types/auth';

/**
 * Resolves the primary landing route for any authenticated user based on:
 * Role -> Staff Subtype -> Permissions -> Assigned Scope
 */
export function resolveLandingRoute(user: User | null | undefined): string {
  if (!user) {
    return '/login';
  }

  const role: UserRole = user.role;
  const staffSubType: StaffSubType | undefined = user.staffSubType;

  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';

    case 'DISTRICT_ADMIN':
      return '/district';

    case 'HOSPITAL_ADMIN':
      return '/hospital';

    case 'DOCTOR':
      return '/doctor';

    case 'FACILITY_STAFF':
      if (staffSubType === 'FACILITY_OPERATIONS') {
        return '/facility-operations';
      }
      if (staffSubType === 'REGISTRATION_CLERK') {
        return '/registration-clerk';
      }
      if (staffSubType === 'PHARMACIST') {
        return '/pharmacist';
      }
      if (staffSubType === 'LAB_TECHNICIAN') {
        return '/staff/lab';
      }
      return '/staff';

    case 'PATIENT':
      return '/patient';

    case 'ASHA':
      return '/patient';

    default:
      return '/patient';
  }
}
