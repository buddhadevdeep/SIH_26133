import React from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DistrictAdminsTab } from './views/DistrictAdminsTab';

export const DistrictAdminsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="District Health Administrators (CDHOs)"
        subtitle="Exclusive State Apex Commissioning console: Only Super Admin / Website Owner can appoint or revoke District Health Administrators."
        breadcrumbs={[
          { label: 'Operations Center', to: '/super-admin' },
          { label: 'District Admins' },
        ]}
      />

      <DistrictAdminsTab />
    </div>
  );
};
