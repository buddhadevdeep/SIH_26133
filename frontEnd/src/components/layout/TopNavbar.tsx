import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { supportedLanguages, changeAppLanguage } from '@/locales/i18n';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  Globe,
  MapPin,
  ChevronDown,
  Menu,
  X,
  Search,
  LogOut,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FamilyMemberSwitcher } from '@/components/patient/FamilyMemberSwitcher';

export const TopNavbar: React.FC<{ onToggleSidebar?: () => void; isSidebarOpen?: boolean }> = ({
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { user, role, staffSubType, logout } = useAuth();
  const { selectedDistrict, selectedFacility, openLocationModal } = useLocationContext();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(
    localStorage.getItem('healthconnect_language') || i18n.language || 'en'
  );

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e.detail?.language) {
        setActiveLang(e.detail.language);
      }
    };
    window.addEventListener('healthconnect-language-change', handleLangChange);
    return () => window.removeEventListener('healthconnect-language-change', handleLangChange);
  }, []);

  const currentLang = supportedLanguages.find((l) => l.code === activeLang) || supportedLanguages[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="flex h-16 items-center justify-between px-3 sm:px-6">
        {/* Left: Mobile Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B6CB0] text-white shadow-sm group-hover:bg-[#20548A] transition-colors">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                HEALTHCONNECT
              </span>
              <span className="block text-[11px] font-medium text-slate-500 leading-none">
                {t('navbar.brandSubtitle', 'Public Healthcare Access & Care Continuity')}
              </span>
            </div>
            <span className="font-bold text-base text-slate-900 sm:hidden">HealthConnect</span>
          </Link>
        </div>

        {/* Center: District & Hospital Geo Tag with Interactive Location Switcher */}
        <button
          type="button"
          onClick={openLocationModal}
          className="hidden md:flex items-center gap-2 rounded-full bg-slate-100/90 hover:bg-slate-200/80 px-3 py-1.5 text-xs text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer group"
          title="Click to change your hospital or district location"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 group-hover:bg-teal-100 text-teal-700 transition-colors">
            <MapPin className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-bold text-slate-900">{selectedDistrict}</span>
            <span className="text-slate-400 hidden xl:inline">|</span>
            <span className="text-slate-600 truncate max-w-[170px] hidden xl:inline">
              {selectedFacility.split('&')[0].trim()}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 ml-0.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
            Change
          </span>
        </button>

        {/* Right Controls: Status, Mobile Location, Language, Role Switcher, Emergency SOS, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Patient Direct Family Member Switcher (Anywhere in patient portal) */}
          {role === 'PATIENT' && (
            <FamilyMemberSwitcher variant="navbar" />
          )}

          {/* Mobile Location Switcher Button */}
          <button
            type="button"
            onClick={openLocationModal}
            className="md:hidden flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[38px] cursor-pointer"
            title={`Current Location: ${selectedDistrict}`}
            aria-label="Change Location"
          >
            <MapPin className="h-3.5 w-3.5 text-teal-700 shrink-0" />
            <span className="truncate max-w-[65px]">{selectedDistrict}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs min-h-[38px] cursor-pointer transition-colors"
              aria-label={t('navbar.switchLanguage', 'Switch Language')}
              title={t('navbar.switchLanguage', 'Switch Language')}
            >
              <Globe className="h-3.5 w-3.5 text-teal-700" />
              <span className="font-bold text-slate-900">{currentLang.nativeName}</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                  langMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto rounded-xl bg-white p-1.5 shadow-2xl border border-slate-200 z-50 animate-in fade-in-50 duration-100 divide-y divide-slate-100">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {t('navbar.switchLanguage', 'Select Language')}
                </div>
                <div className="py-1">
                  {supportedLanguages.map((lang) => {
                    const isSelected = lang.code === activeLang;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeAppLanguage(lang.code);
                          setActiveLang(lang.code);
                          setLangMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium min-h-[38px] transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-sm">{lang.nativeName}</span>
                        <span
                          className={`text-[10px] uppercase ${
                            isSelected ? 'text-teal-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {lang.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer"
              title="Manage Profile & Settings"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#2B6CB0] text-white font-bold text-xs uppercase shadow-2xs group-hover:bg-[#20548A] transition-colors">
                {user?.name ? user.name.slice(0, 2) : 'HC'}
              </div>
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px] group-hover:text-[#1D6394]" title={user?.name}>
                  {user?.name || 'Authorized User'}
                </p>
                <span className="text-[10px] font-semibold text-[#1D6394] bg-[#E1EFFA] px-1 py-0.5 rounded border border-[#C6E0F2] uppercase leading-none inline-block mt-0.5">
                  {role === 'FACILITY_STAFF' && staffSubType ? staffSubType.replace('_', ' ') : role?.replace('_', ' ')}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
