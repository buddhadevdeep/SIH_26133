import React, { useState, useRef, useEffect } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { AddFamilyMemberModal } from './AddFamilyMemberModal';
import { Link } from 'react-router-dom';
import {
  Users,
  ChevronDown,
  Check,
  UserPlus,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export const FamilyMemberSwitcher: React.FC<{
  variant?: 'banner' | 'compact' | 'navbar' | 'sidebar';
}> = ({ variant = 'banner' }) => {
  const { members, activeMember, setActiveMemberId } = useFamily();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div
        className={`relative text-left ${variant === 'sidebar' ? 'w-full' : 'inline-block'}`}
        ref={dropdownRef}
      >
        {/* VARIANT 1: NAVBAR */}
        {variant === 'navbar' ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-xl bg-teal-50/90 hover:bg-teal-100 border border-teal-200/90 px-2.5 sm:px-3 py-1.5 text-xs text-teal-950 font-bold shadow-2xs transition-all cursor-pointer group min-h-[38px]"
            title="Click to switch active family member profile"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-700 text-white font-black text-[10px] uppercase shadow-2xs group-hover:bg-teal-800 transition-colors">
              {activeMember.name.slice(0, 2)}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 block leading-none">
                Patient Switcher
              </span>
              <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1 mt-0.5 leading-none">
                {activeMember.name} <span className="text-teal-700 font-semibold text-[10px]">({activeMember.relation === 'SELF' ? 'Self' : activeMember.relationLabel.split(' ')[0]})</span>
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-teal-700 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : variant === 'sidebar' ? (
          /* VARIANT 2: SIDEBAR */
          <div className="w-full">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between gap-2.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100/80 hover:to-emerald-100/70 border border-teal-200/80 p-2.5 text-left transition-all cursor-pointer shadow-2xs group"
              title="Click to switch active family member"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white font-bold text-xs uppercase shadow-xs group-hover:scale-105 transition-transform">
                  {activeMember.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-teal-200/70 text-teal-900">
                      Active
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 truncate">
                      {activeMember.relation === 'SELF' ? 'Self' : activeMember.relationLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                    {activeMember.name}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 text-teal-700">
                <span className="text-[10px] font-bold uppercase tracking-wider hidden xl:inline">
                  Switch
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        ) : variant === 'banner' ? (
          /* VARIANT 3: BANNER */
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-xl bg-teal-800/80 hover:bg-teal-700/90 border border-teal-500/50 px-3 py-1.5 text-xs text-white shadow-xs transition-all cursor-pointer group"
            title="Switch family member profile"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-[10px] uppercase">
              {activeMember.name.slice(0, 2)}
            </div>
            <div className="text-left">
              <span className="text-[10px] text-teal-200 block leading-none">
                Active Patient Profile
              </span>
              <span className="font-bold text-xs text-white flex items-center gap-1.5 mt-0.5">
                {activeMember.name} ({activeMember.relation === 'SELF' ? 'Self' : activeMember.relationLabel.split(' ')[0]})
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-teal-300 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        ) : (
          /* VARIANT 4: COMPACT */
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
          >
            <Users className="h-3.5 w-3.5 text-teal-700" />
            <span className="truncate max-w-[120px] font-bold text-slate-800">
              {activeMember.name}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">
              ({activeMember.relation === 'SELF' ? 'Self' : activeMember.relationLabel.split(' ')[0]})
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute mt-2 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-in fade-in-50 duration-100 space-y-1 ${
              variant === 'sidebar'
                ? 'left-0 right-0 w-full'
                : 'right-0 w-72 sm:w-80'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Household Member ({members.length})
              </span>
              <Link
                to="/patient/profile"
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5"
              >
                Manage All
              </Link>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 py-1">
              {members.map((m) => {
                const isActive = m.id === activeMember.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveMemberId(m.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-950 font-bold border border-teal-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                          isActive
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs truncate leading-tight font-bold">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {m.relationLabel} • {m.age} yrs • <span className="font-mono">{m.bloodGroup}</span>
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-white shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-teal-700 shrink-0">
                        Switch
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 px-2 py-1.5 rounded-lg hover:bg-teal-50 w-full justify-center transition-colors cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add Family Member</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AddFamilyMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
};
