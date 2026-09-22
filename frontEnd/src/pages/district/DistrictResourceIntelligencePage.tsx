import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useLocationContext } from '@/contexts/LocationContext';
import { intelligenceApi } from '@/api/intelligenceApi';
import {
  DistrictHealthSummary,
  AreaIntelligenceProfile,
  FacilityGapProfile,
  HospitalDoctorRequirement,
  UnusedResourceItem,
} from '@/types/intelligence';
import { DistrictIntelligenceMap } from '@/components/district/DistrictIntelligenceMap';
import {
  Building2,
  Stethoscope,
  Wrench,
  AlertTriangle,
  TrendingUp,
  MapPin,
  RefreshCw,
  Bed,
  Map,
  Package,
  Activity,
  Sparkles,
  Search,
  Filter,
  X,
  Eye,
  ArrowRight,
  Check,
  ChevronRight,
  Info,
  ShieldCheck,
  GitBranch,
} from 'lucide-react';

export const DistrictResourceIntelligencePage: React.FC = () => {
  const { selectedDistrict } = useLocationContext();

  // Active View Filter & Toggles
  const [activeSection, setActiveSection] = useState<'ALL' | 'AREAS' | 'DOCTORS' | 'UNUSED'>('ALL');
  const [timeRange, setTimeRange] = useState<'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS'>('TODAY');
  const [showMap, setShowMap] = useState<boolean>(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('area_sec_24');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('fac_civil_01');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'OUTBREAK'>('ALL');

  // Modal Detail States (Progressive Disclosure)
  const [selectedAreaForModal, setSelectedAreaForModal] = useState<AreaIntelligenceProfile | null>(null);
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState<HospitalDoctorRequirement | null>(null);
  const [selectedResourceForModal, setSelectedResourceForModal] = useState<UnusedResourceItem | null>(null);

  // Datasets
  const [summary, setSummary] = useState<DistrictHealthSummary | null>(null);
  const [areas, setAreas] = useState<AreaIntelligenceProfile[]>([]);
  const [facilities, setFacilities] = useState<FacilityGapProfile[]>([]);
  const [doctorRequirements, setDoctorRequirements] = useState<HospitalDoctorRequirement[]>([]);
  const [unusedResources, setUnusedResources] = useState<UnusedResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load authoritative data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, areasRes, facsRes, docsRes, unusedRes] = await Promise.all([
        intelligenceApi.getSummary(selectedDistrict, timeRange),
        intelligenceApi.getAreas(selectedDistrict),
        intelligenceApi.getFacilities(selectedDistrict),
        intelligenceApi.getDoctorRequirements(selectedDistrict),
        intelligenceApi.getUnusedResources(selectedDistrict),
      ]);

      setSummary(sumRes.data);
      setAreas(areasRes.data);
      setFacilities(facsRes.data);
      setDoctorRequirements(docsRes.data);
      setUnusedResources(unusedRes.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load district health intelligence telemetry. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDistrict, timeRange]);

  // Derived available blocks
  const availableBlocks = useMemo(() => {
    return Array.from(new Set(areas.map((a) => a.block)));
  }, [areas]);

  // Filtered areas
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      if (selectedBlockFilter !== 'ALL' && area.block !== selectedBlockFilter) {
        return false;
      }
      if (selectedSeverityFilter === 'CRITICAL' && area.priorityScore < 80) {
        return false;
      }
      if (
        selectedSeverityFilter === 'OUTBREAK' &&
        !area.demand.topCaseCategories.some((c) => (c.trendPercentage ?? 0) > 15)
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = area.name.toLowerCase().includes(q);
        const matchBlock = area.block.toLowerCase().includes(q);
        const matchDisease = area.demand.topCaseCategories.some((c) => c.category.toLowerCase().includes(q));
        const matchFacility = area.servingFacilities.some((f) => f.name.toLowerCase().includes(q));
        return matchName || matchBlock || matchDisease || matchFacility;
      }
      return true;
    });
  }, [areas, selectedBlockFilter, selectedSeverityFilter, searchQuery]);

  // Filtered doctor requirements
  const filteredDoctorRequirements = useMemo(() => {
    return doctorRequirements.filter((hospital) => {
      if (selectedSeverityFilter === 'CRITICAL' && !hospital.requirements.some((r) => r.urgency === 'CRITICAL')) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHospital =
          hospital.facilityName.toLowerCase().includes(q) || hospital.facilityType.toLowerCase().includes(q);
        const matchSpecialty = hospital.requirements.some(
          (r) => r.specialty.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q)
        );
        return matchHospital || matchSpecialty;
      }
      return true;
    });
  }, [doctorRequirements, selectedSeverityFilter, searchQuery]);

  // Filtered unused resources
  const filteredUnusedResources = useMemo(() => {
    return unusedResources.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.resourceName.toLowerCase().includes(q);
        const matchFacility = item.facilityName.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchCause = item.impactOrCause.toLowerCase().includes(q);
        const matchRec = item.opportunityRecommendation.toLowerCase().includes(q);
        return matchName || matchFacility || matchCategory || matchCause || matchRec;
      }
      return true;
    });
  }, [unusedResources, searchQuery]);

  // Derived active selections using useMemo
  const activeArea = useMemo(() => {
    return areas.find((a) => a.id === selectedAreaId) || areas[0] || null;
  }, [areas, selectedAreaId]);

  if (isLoading && !summary) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
        <div className="h-10 bg-slate-200 rounded-xl animate-pulse w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 inline-block">
          <AlertTriangle className="h-8 w-8 mx-auto" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">District Intelligence Telemetry Unavailable</h3>
        <p className="text-xs text-slate-600">{error}</p>
        <Button onClick={fetchData} className="gap-2 bg-teal-700 hover:bg-teal-800 text-white">
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </Button>
      </div>
    );
  }

  // Count metrics for quick badge summaries
  const totalDoctorsNeeded = filteredDoctorRequirements.reduce(
    (acc, h) => acc + h.requirements.reduce((rAcc, r) => rAcc + r.doctorsNeeded, 0),
    0
  );
  const totalUnusedItems = filteredUnusedResources.length;
  const isFilterActive = searchQuery.trim() !== '' || selectedBlockFilter !== 'ALL' || selectedSeverityFilter !== 'ALL';


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Clean Minimal Header */}
      <PageHeader
        title="District Resource Intelligence"
        subtitle={`Live area disease predictions, hospital doctor requirements, and underutilized public resources across ${selectedDistrict} District.`}
        breadcrumbs={[
          { label: 'District Admin', to: '/district' },
          { label: 'Public Health & Insights', to: '/district' },
          { label: 'Resource Intelligence' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {(['TODAY', 'LAST_7_DAYS', 'LAST_30_DAYS'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {range === 'TODAY' ? 'Today' : range === 'LAST_7_DAYS' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            {/* Map Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
              className={`gap-1.5 text-xs font-semibold cursor-pointer ${
                showMap ? 'bg-teal-50 border-teal-300 text-teal-800' : 'text-slate-700'
              }`}
            >
              <Map className="h-4 w-4 text-teal-600" />
              <span>{showMap ? 'Hide Map' : 'View District Map'}</span>
            </Button>

            {/* Refresh Sync */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="gap-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Sync</span>
            </Button>
          </div>
        }
      />

      {/* 2. Smart Search & Filter Bar */}
      <Card className="p-3 sm:p-4 bg-white border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, disease (e.g. Dengue, Diabetes), hospital, doctor specialty, or resource..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter 1: Block Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white shadow-2xs px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Blocks ({areas.length})</option>
              {availableBlocks.map((blk) => (
                <option key={blk} value={blk}>
                  {blk} Block
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Severity Filter */}
          <select
            value={selectedSeverityFilter}
            onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
            className="rounded-xl border border-slate-300 bg-white shadow-2xs px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-teal-600 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="OUTBREAK">🚨 Outbreak Surges Only</option>
            <option value="CRITICAL">⚠️ Critical Priority Only</option>
          </select>

          {/* Clear Filters Button (Visible only when filters active) */}
          {isFilterActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedBlockFilter('ALL');
                setSelectedSeverityFilter('ALL');
              }}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 gap-1 h-9 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Filter Results Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing: <strong>{filteredAreas.length}</strong> areas • <strong>{filteredDoctorRequirements.length}</strong> hospitals • <strong>{filteredUnusedResources.length}</strong> unused items
          </span>
          <span className="text-teal-700 font-medium">💡 Click any card to open full details</span>
        </div>
      </Card>

      {/* 3. Sleek 3-Step Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1: Area Predictions */}
        <div
          onClick={() => setActiveSection(activeSection === 'AREAS' ? 'ALL' : 'AREAS')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSection === 'AREAS'
              ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-100/80 text-teal-800">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Areas & Disease</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              {filteredAreas.length} Areas
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1.5">Area-Wise Disease Predictions</p>
          <p className="text-[11px] text-slate-500">Which disease is surging in each village/sector</p>
        </div>

        {/* Step 2: Doctors Needed */}
        <div
          onClick={() => setActiveSection(activeSection === 'DOCTORS' ? 'ALL' : 'DOCTORS')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSection === 'DOCTORS'
              ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-100/80 text-rose-800">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Doctors Needed</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              +{totalDoctorsNeeded} Required
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1.5">Hospital-Wise Doctor Shortages</p>
          <p className="text-[11px] text-slate-500">Specialty & field doctors required per hospital</p>
        </div>

        {/* Step 3: Unused Items */}
        <div
          onClick={() => setActiveSection(activeSection === 'UNUSED' ? 'ALL' : 'UNUSED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            activeSection === 'UNUSED'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-100/80 text-amber-800">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Unused Resources</span>
            </div>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {totalUnusedItems} Items
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1.5">Unused & Underutilized Items</p>
          <p className="text-[11px] text-slate-500">Idle equipment, vacant beds & surplus supplies</p>
        </div>
      </div>

      {/* 4. Collapsible Map Section (Toggled only when requested) */}
      {showMap && (
        <Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">District Geospatial Overview</h3>
            </div>
            <span className="text-xs text-slate-500">Click any marker or area to focus</span>
          </div>

          <DistrictIntelligenceMap
            areas={areas}
            facilities={facilities}
            selectedAreaId={selectedAreaId}
            onSelectArea={(area) => {
              setSelectedAreaId(area.id);
              setSelectedAreaForModal(area);
            }}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={(fac) => setSelectedFacilityId(fac.facilityId)}
            className="h-[380px]"
          />
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: AREA-WISE DISEASE PREDICTION (COMPACT SUMMARY CARDS)           */}
      {/* ========================================================================= */}
      {(activeSection === 'ALL' || activeSection === 'AREAS') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs">1</div>
              <h3 className="text-base font-bold text-slate-900">Area-Wise Disease Predictions & Health Patterns</h3>
            </div>
            <span className="text-xs text-slate-500">Click card to view full case breakdown & predictions</span>
          </div>

          {filteredAreas.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200 text-xs text-slate-500 space-y-2">
              <p>No areas matched your search query or filter.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBlockFilter('ALL');
                  setSelectedSeverityFilter('ALL');
                }}
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAreas.map((area) => {
                const topDisease = area.demand.topCaseCategories[0];
                const isSurge = topDisease?.trendPercentage && topDisease.trendPercentage > 15;

                return (
                  <Card
                    key={area.id}
                    onClick={() => setSelectedAreaForModal(area)}
                    className="p-4 bg-white border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Header: Block & Status Badge */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {area.block} Block • Pop: {area.populationEstimate.toLocaleString()}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isSurge || area.priorityScore > 80
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isSurge ? '🚨 OUTBREAK SURGE' : '⚠️ HIGH DEMAND'}
                        </span>
                      </div>

                      {/* Area Title */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {area.name}
                      </h4>

                      {/* Primary Disease Pill */}
                      {topDisease && (
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate mr-2">
                            <Activity className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">{topDisease.category}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-black text-slate-900">{topDisease.recordedCases} cases</span>
                            {topDisease.trendPercentage !== undefined && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                  topDisease.trendPercentage > 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {topDisease.trendPercentage > 0 ? `+${topDisease.trendPercentage}%` : `${topDisease.trendPercentage}%`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Serving Hospital & Travel Burden */}
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                        <span className="truncate">
                          Serving: <strong>{area.servingFacilities[0]?.name.split('(')[0]}</strong>
                        </span>
                        <span className="text-rose-700 font-bold shrink-0 ml-2">
                          {Math.round(area.referralDependency.outwardReferralRatio * 100)}% Outward
                        </span>
                      </div>
                    </div>

                    {/* Action Link Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                      <span>View Full Analysis & Gaps</span>
                      <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: HOSPITAL-WISE DOCTORS NEEDED (COMPACT SUMMARY CARDS)           */}
      {/* ========================================================================= */}
      {(activeSection === 'ALL' || activeSection === 'DOCTORS') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">2</div>
              <h3 className="text-base font-bold text-slate-900">Hospital-Wise Doctors Needed (Field & Specialty Gaps)</h3>
            </div>
            <span className="text-xs text-slate-500">Click card to view clinical rationale & backlog</span>
          </div>

          {filteredDoctorRequirements.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200 text-xs text-slate-500 space-y-2">
              <p>No hospital doctor requirements match your filter.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDoctorRequirements.map((hospital) => {
                const totalHospitalDoctors = hospital.requirements.reduce((acc, r) => acc + r.doctorsNeeded, 0);
                const totalBacklog = hospital.requirements.reduce((acc, r) => acc + r.patientBacklog, 0);

                return (
                  <Card
                    key={hospital.facilityId}
                    onClick={() => setSelectedHospitalForModal(hospital)}
                    className="p-4 bg-white border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-teal-50 text-teal-700">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">{hospital.facilityName}</h4>
                            <span className="text-[10px] text-slate-500">{hospital.facilityType}</span>
                          </div>
                        </div>

                        <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-black shrink-0">
                          +{totalHospitalDoctors} Doctors Needed
                        </span>
                      </div>

                      {/* Specialty Shortage Tags */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                          Deficit Specialties:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {hospital.requirements.map((req, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold"
                            >
                              <span>{req.specialty}</span>
                              <span className="font-black text-rose-600 bg-rose-50 px-1 rounded text-[10px]">
                                +{req.doctorsNeeded}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Cumulative Impact summary */}
                      <div className="text-[11px] text-slate-500 pt-1">
                        Total daily backlog: <strong className="text-slate-900">{totalBacklog} patients/day</strong>
                      </div>
                    </div>

                    {/* Action Link Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700">
                      <span>View Detailed Doctor Requirements</span>
                      <ArrowRight className="h-3.5 w-3.5 text-rose-600" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: UNUSED & UNDERUTILIZED RESOURCES (COMPACT SUMMARY CARDS)        */}
      {/* ========================================================================= */}
      {(activeSection === 'ALL' || activeSection === 'UNUSED') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">3</div>
              <h3 className="text-base font-bold text-slate-900">Unused & Underutilized Resources (Konsi Chize Unused Hain)</h3>
            </div>
            <span className="text-xs text-slate-500">Click card to view optimization & transfer opportunity</span>
          </div>

          {filteredUnusedResources.length === 0 ? (
            <Card className="p-8 text-center bg-white border-slate-200 text-xs text-slate-500 space-y-2">
              <p>No unused resources match your search query.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredUnusedResources.map((item) => {
                const isOffline = item.currentStatus === 'OFFLINE_MAINTENANCE';
                const isIdle = item.currentStatus === 'IDLE';
                const isLowUse = item.currentStatus === 'LOW_UTILIZATION';

                return (
                  <Card
                    key={item.id}
                    onClick={() => setSelectedResourceForModal(item)}
                    className="p-4 bg-white border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      {/* Top Header: Category & Status */}
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                          {item.category} • {item.facilityName.split('(')[0]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${
                            isOffline
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isIdle
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : isLowUse
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.currentStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Resource Name */}
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {item.resourceName}
                      </h4>

                      {/* Idle Metric */}
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Idle Capacity</span>
                          <span className="font-bold text-slate-900 truncate block">{item.idleQuantity}</span>
                        </div>
                        {item.utilizationRate !== undefined && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Utilization</span>
                            <span className={`font-black ${item.utilizationRate < 25 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {item.utilizationRate}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Opportunity hint */}
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {item.opportunityRecommendation}
                      </p>
                    </div>

                    {/* Action Link Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800">
                      <span>View Redeployment Plan</span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: AREA DETAILS & PREDICTIONS DIALOG                                */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedAreaForModal}
        onOpenChange={(open) => !open && setSelectedAreaForModal(null)}
        maxWidth="xl"
      >
        {selectedAreaForModal && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedAreaForModal.block} Block • Population: {selectedAreaForModal.populationEstimate.toLocaleString()}
                  </span>
                  <DialogTitle className="mt-0.5">{selectedAreaForModal.name}</DialogTitle>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Gap Index</span>
                  <span className="text-2xl font-black text-rose-600 leading-none">
                    {selectedAreaForModal.priorityScore}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ 100</span>
                </div>
              </div>
            </DialogHeader>

            <DialogContent className="space-y-4 text-xs">
              {/* 1. Common Diseases in this Area */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  1. Common Diseases & Case Load Breakdown:
                </span>
                <div className="space-y-1.5">
                  {selectedAreaForModal.demand.topCaseCategories.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-700" />
                        <span className="font-semibold text-slate-900">{c.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{c.recordedCases} recorded cases</span>
                        {c.trendPercentage !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              c.trendPercentage > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c.trendPercentage > 0 ? `+${c.trendPercentage}%` : `${c.trendPercentage}%`}
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                          {c.isProjected ? 'MODELED' : 'RECORDED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Health Prediction & Alerts */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                <strong className="text-teal-950 flex items-center gap-1.5 font-bold">
                  <TrendingUp className="h-4 w-4 text-teal-700" /> Epidemiological Prediction & Outbreak Alert:
                </strong>
                <p className="text-teal-900 leading-relaxed">
                  {selectedAreaForModal.id === 'area_sec_24'
                    ? 'Dengue Serotype-2 surge observed; expect +35 acute fever cases in next 48h. Platelet transfusion requirement surging across district blood banks.'
                    : selectedAreaForModal.id === 'area_peth_w3'
                    ? 'Maternal anemia cases elevated (Hb < 8.0 g/dL); 100% of prenatal ultrasound scans currently forced to travel 6.8 km to Civil Hospital.'
                    : selectedAreaForModal.id === 'area_peth_w1'
                    ? 'High diabetic foot complications; delayed presentation due to lack of on-site HbA1c testing at PHC.'
                    : 'Emergency maternity & agricultural trauma cases rising; delayed transit to district tertiary hospital.'}
                </p>
              </div>

              {/* 3. Serving Public Facilities */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  2. Designated Public Facilities Serving This Area:
                </span>
                <div className="space-y-1">
                  {selectedAreaForModal.servingFacilities.map((fac) => (
                    <div
                      key={fac.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-teal-700" />
                        <span className="font-semibold text-slate-900">{fac.name}</span>
                        {fac.isNearest && (
                          <span className="text-[10px] rounded bg-teal-100 text-teal-800 px-1 font-bold">
                            Nearest
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-medium">{fac.distanceKm} km away</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Local Service Availability Matrix */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  3. Local Service Availability Matrix:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { label: 'General Care', val: selectedAreaForModal.serviceAvailability.generalCare },
                    { label: 'Specialist Care', val: selectedAreaForModal.serviceAvailability.specialistCare },
                    { label: 'Emergency 24x7', val: selectedAreaForModal.serviceAvailability.emergencyCasualty },
                    { label: 'Diagnostics', val: selectedAreaForModal.serviceAvailability.diagnostics },
                    { label: 'Pharmacy', val: selectedAreaForModal.serviceAvailability.pharmacyMeds },
                    { label: 'Maternal ANC', val: selectedAreaForModal.serviceAvailability.maternalCare },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-2 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                    >
                      <span className="text-[10px] text-slate-600 font-medium">{item.label}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.val === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.val === 'LIMITED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Outward Referral Burden */}
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1 text-rose-900">
                    <GitBranch className="h-3.5 w-3.5 text-rose-700" />
                    Outward Referral Burden: {Math.round(selectedAreaForModal.referralDependency.outwardReferralRatio * 100)}%
                  </span>
                  <span className="text-[10px] font-bold text-rose-700">
                    {selectedAreaForModal.demand.referralVolume30d} referrals / mo
                  </span>
                </div>
                <p className="text-[11px] text-rose-800">
                  Patients transferred {selectedAreaForModal.referralDependency.averageTransferDistanceKm} km to{' '}
                  <strong>{selectedAreaForModal.referralDependency.primaryDestinationFacilityName}</strong> for{' '}
                  {selectedAreaForModal.referralDependency.dominantReferralSpecialties.join(', ')}.
                </p>
              </div>

              {/* 6. Administrative Review Consideration */}
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1">
                <strong className="text-slate-900 flex items-center gap-1 text-xs">
                  <Info className="h-3.5 w-3.5 text-slate-700" /> Suggested Action for District Health Admin Review:
                </strong>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {selectedAreaForModal.suggestedAdministrativeReview}
                </p>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAreaForModal(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: HOSPITAL DOCTOR REQUIREMENTS DIALOG                              */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedHospitalForModal}
        onOpenChange={(open) => !open && setSelectedHospitalForModal(null)}
        maxWidth="lg"
      >
        {selectedHospitalForModal && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedHospitalForModal.facilityType}
                  </span>
                  <DialogTitle className="mt-0.5">{selectedHospitalForModal.facilityName}</DialogTitle>
                </div>
                <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 text-xs font-black">
                  +{selectedHospitalForModal.requirements.reduce((acc, r) => acc + r.doctorsNeeded, 0)} Doctors Needed
                </span>
              </div>
            </DialogHeader>

            <DialogContent className="space-y-3 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Doctor & Specialist Shortages Breakdown:
              </span>

              <div className="space-y-2.5">
                {selectedHospitalForModal.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.specialty}</span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-black ${
                            req.urgency === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : req.urgency === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {req.urgency}
                        </span>
                      </div>

                      <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                        +{req.doctorsNeeded} {req.doctorsNeeded > 1 ? 'Doctors' : 'Doctor'} Needed
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-white border border-slate-100 text-slate-600 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current On Duty</span>
                        <strong className="text-slate-900">{req.currentDoctors}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Patient Backlog</span>
                        <strong className="text-slate-900">{req.patientBacklog} patients/day</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Average Wait</span>
                        <strong className="text-slate-900">{req.avgWaitDays ? `${req.avgWaitDays} days` : 'N/A'}</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/50">
                      <strong>Clinical Justification: </strong> {req.reason}
                    </p>
                  </div>
                ))}
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedHospitalForModal(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: UNUSED RESOURCE DETAILS & REDEPLOYMENT DIALOG                    */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedResourceForModal}
        onOpenChange={(open) => !open && setSelectedResourceForModal(null)}
        maxWidth="lg"
      >
        {selectedResourceForModal && (
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedResourceForModal.category} • {selectedResourceForModal.facilityName}
                  </span>
                  <DialogTitle className="mt-0.5">{selectedResourceForModal.resourceName}</DialogTitle>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    selectedResourceForModal.currentStatus === 'OFFLINE_MAINTENANCE'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedResourceForModal.currentStatus === 'IDLE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedResourceForModal.currentStatus.replace(/_/g, ' ')}
                </span>
              </div>
            </DialogHeader>

            <DialogContent className="space-y-3.5 text-xs">
              {/* Utilization & Capacity */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">Idle Capacity / Available</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedResourceForModal.idleQuantity}</span>
                </div>
                {selectedResourceForModal.utilizationRate !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current Utilization Rate</span>
                    <span className={`font-black text-sm ${selectedResourceForModal.utilizationRate < 25 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {selectedResourceForModal.utilizationRate}%
                    </span>
                  </div>
                )}
              </div>

              {/* Why it is unused */}
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block text-xs">Why this resource is currently idle / unused:</span>
                <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 text-[11px]">
                  {selectedResourceForModal.impactOrCause}
                </p>
              </div>

              {/* Optimization & Redistribution Plan */}
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 space-y-1">
                <strong className="flex items-center gap-1.5 text-teal-900 text-xs">
                  <Sparkles className="h-4 w-4 text-teal-700" />
                  Recommended District Redeployment & Optimization Opportunity:
                </strong>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  {selectedResourceForModal.opportunityRecommendation}
                </p>
              </div>
            </DialogContent>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedResourceForModal(null)}
                className="text-xs"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
};


