import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { INITIAL_FACILITIES, INITIAL_BLOOD_INVENTORY } from '@/mock/mockData';
import { facilityApi } from '@/api/facilityApi';
import { Facility } from '@/types/facility';

import {
  Building2,
  Phone,
  Navigation,
  ShieldCheck,
  Bed,
  Clock,
  Stethoscope,
  Ticket,
  Droplet,
  Wrench,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const FacilityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [facility, setFacility] = useState<Facility>(() => {
    return INITIAL_FACILITIES.find((f) => f.id === id) || INITIAL_FACILITIES[0];
  });

  useEffect(() => {
    if (!id) return;
    facilityApi.getById(id).then((res) => {
      if (res.data) {
        setFacility(res.data);
      }
    }).catch(() => {
      facilityApi.getAll().then((res) => {
        const found = res.data?.find((f) => f.id === id);
        if (found) setFacility(found);
      }).catch(console.warn);
    });
  }, [id]);

  const getFacilityType = (type: string) => {
    switch (type) {
      case 'DISTRICT_HOSPITAL':
        return 'District Hospital';

      case 'SUB_DISTRICT_HOSPITAL':
        return 'Sub-District Hospital';

      case 'CHC':
        return 'Community Health Centre';

      case 'PHC':
        return 'Primary Health Centre';

      default:
        return 'Hospital';
    }
  };

  return (
    <div className="space-y-4">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <PageHeader
        title={facility.name}
        subtitle={`${getFacilityType(facility.type)} • ${facility.address}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/patient' },
          { label: 'Hospitals', to: '/patient/facilities' },
          { label: 'Hospital Details' },
        ]}
      />

      {/* =====================================================
          HOSPITAL INTRO
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
                <Building2 className="h-5 w-5 text-teal-700" />
              </div>

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-base font-bold text-slate-900">
                    {facility.name}
                  </h2>

                  {facility.isVerified && (
                    <ShieldCheck
                      className="h-4 w-4 text-teal-600"
                    //   title="Verified hospital"
                    />
                  )}

                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {getFacilityType(facility.type)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {facility.address}
                </p>

              </div>

            </div>


            {/* Open Status */}

            <div className="flex items-center gap-2">

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  facility.isOpen
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {facility.isOpen ? 'Open Now' : 'Closed'}
              </span>

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

            <a href={`tel:${facility.contactNumber}`}>

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                <Phone className="h-3.5 w-3.5" />
                Call Hospital
              </Button>

            </a>


            <a
              href={`https://maps.google.com/?q=${facility.coordinates.lat},${facility.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >

              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs"
              >
                <Navigation className="h-3.5 w-3.5 text-teal-700" />
                Get Directions
              </Button>

            </a>


            <Link to="/patient/tokens">

              <Button
                variant="primary"
                size="sm"
                className="h-9 gap-1.5 bg-teal-700 text-xs hover:bg-teal-800"
              >
                <Ticket className="h-3.5 w-3.5" />
                Get Token
              </Button>

            </Link>

          </div>

        </CardContent>
      </Card>


      {/* =====================================================
          QUICK INFORMATION
      ====================================================== */}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

        {/* Beds */}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3">

            <div className="flex items-center gap-2">

              <Bed className="h-4 w-4 text-teal-600" />

              <span className="text-[11px] font-medium text-slate-500">
                Beds Available
              </span>

            </div>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {facility.availableBeds}
            </p>

            <p className="text-[10px] text-slate-400">
              out of {facility.totalBeds} beds
            </p>

          </CardContent>
        </Card>


        {/* ICU */}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3">

            <div className="flex items-center gap-2">

              <Bed className="h-4 w-4 text-red-500" />

              <span className="text-[11px] font-medium text-slate-500">
                ICU Beds
              </span>

            </div>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {facility.icuBedsAvailable}
            </p>

            <p className="text-[10px] text-slate-400">
              available now
            </p>

          </CardContent>
        </Card>


        {/* Waiting */}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3">

            <div className="flex items-center gap-2">

              <Clock className="h-4 w-4 text-amber-500" />

              <span className="text-[11px] font-medium text-slate-500">
                Waiting Time
              </span>

            </div>

            <p className="mt-1 text-lg font-bold text-slate-900">
              {facility.currentWaitTimeMinutes} min
            </p>

            <p className="text-[10px] text-slate-400">
              estimated
            </p>

          </CardContent>
        </Card>


        {/* Emergency */}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3">

            <div className="flex items-center gap-2">

              <Phone className="h-4 w-4 text-red-500" />

              <span className="text-[11px] font-medium text-slate-500">
                Emergency
              </span>

            </div>

            <p
              className={`mt-1 text-sm font-bold ${
                facility.emergencyAvailable
                  ? 'text-emerald-700'
                  : 'text-slate-500'
              }`}
            >
              {facility.emergencyAvailable
                ? 'Available'
                : 'Not Available'}
            </p>

            <p className="text-[10px] text-slate-400">
              emergency service
            </p>

          </CardContent>
        </Card>

      </div>


      {/* =====================================================
          SERVICES
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm">

        <CardContent className="p-4">

          <div className="flex items-center gap-2">

            <Stethoscope className="h-4 w-4 text-teal-700" />

            <h2 className="text-sm font-bold text-slate-900">
              Services Available
            </h2>

          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            Doctors and health services available at this hospital.
          </p>


          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">

            {facility.specialties.map((specialty) => (

              <div
                key={specialty}
                className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >

                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-600" />

                <span className="text-xs font-medium text-slate-700">
                  {specialty}
                </span>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          DEPARTMENTS
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm">

        <CardContent className="p-4">

          <h2 className="text-sm font-bold text-slate-900">
            Departments
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Choose a department when you visit the hospital.
          </p>


          <div className="mt-3 divide-y divide-slate-100">

            {facility.departments.map((dept) => (

              <div
                key={dept.id}
                className="flex items-center justify-between gap-3 py-3"
              >

                <div className="min-w-0">

                  <p className="text-xs font-semibold text-slate-800">
                    {dept.name}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {dept.activeDoctors} doctor
                    {dept.activeDoctors !== 1 ? 's' : ''} available
                  </p>

                </div>


                <div className="shrink-0 text-right">

                  <p className="text-[10px] text-slate-400">
                    Waiting
                  </p>

                  <p className="text-xs font-semibold text-teal-700">
                    {dept.currentWaitMinutes} min
                  </p>

                </div>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          BLOOD AVAILABILITY
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm">

        <CardContent className="p-4">

          <div className="flex items-center gap-2">

            <Droplet className="h-4 w-4 text-red-600" />

            <div>

              <h2 className="text-sm font-bold text-slate-900">
                Blood Available
              </h2>

              <p className="text-[10px] text-slate-500">
                Current blood stock
              </p>

            </div>

          </div>


          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">

            <div className="grid grid-cols-4 bg-slate-50">

              {INITIAL_BLOOD_INVENTORY.stock.map((blood) => (

                <div
                  key={blood.bloodGroup}
                  className="border-r border-slate-200 p-2.5 text-center last:border-r-0"
                >

                  <p className="text-xs font-bold text-red-700">
                    {blood.bloodGroup}
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {blood.unitsAvailable}
                  </p>

                  <p className="text-[9px] text-slate-400">
                    units
                  </p>

                </div>

              ))}

            </div>

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          EQUIPMENT
      ====================================================== */}

      <Card className="border-slate-200 shadow-sm">

        <CardContent className="p-4">

          <div className="flex items-center gap-2">

            <Wrench className="h-4 w-4 text-teal-700" />

            <h2 className="text-sm font-bold text-slate-900">
              Available Equipment
            </h2>

          </div>


          <div className="mt-3 divide-y divide-slate-100">

            {facility.equipment.map((equipment, index) => (

              <div
                key={index}
                className="flex items-center justify-between gap-3 py-2.5"
              >

                <div>

                  <p className="text-xs font-medium text-slate-800">
                    {equipment.name}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    {equipment.quantity} available
                  </p>

                </div>


                <span
                  className={`flex items-center gap-1 text-[10px] font-semibold ${
                    equipment.isOperational
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >

                  {equipment.isOperational && (
                    <CheckCircle2 className="h-3 w-3" />
                  )}

                  {equipment.isOperational
                    ? 'Working'
                    : 'Under Maintenance'}

                </span>

              </div>

            ))}

          </div>

        </CardContent>

      </Card>


      {/* =====================================================
          BOTTOM HELP
      ====================================================== */}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">

        <div className="flex items-center gap-2">

          <Building2 className="h-4 w-4 shrink-0 text-teal-700" />

          <p className="text-xs text-teal-900">
            Need help? Call the hospital before visiting.
          </p>

        </div>

        <a href={`tel:${facility.contactNumber}`}>

          <button className="shrink-0 text-xs font-semibold text-teal-700 hover:underline">
            Call
          </button>

        </a>

      </div>


      {/* BACK */}

      <Link
        to="/patient/facilities"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700"
      >

        <ArrowLeft className="h-3.5 w-3.5" />

        Back to Hospitals

      </Link>

    </div>
  );
};