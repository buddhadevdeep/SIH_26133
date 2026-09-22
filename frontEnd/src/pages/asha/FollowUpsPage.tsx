import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { INITIAL_ASHA_TASKS } from '@/mock/mockData';
import { FollowUpTask } from '@/types/asha';
import { ashaApi } from '@/api/ashaApi';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Check,
  RotateCcw,
} from 'lucide-react';

export const FollowUpsPage: React.FC = () => {
  const [tasks, setTasks] = useState<FollowUpTask[]>(INITIAL_ASHA_TASKS);
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    ashaApi.getTasks().then((res) => {
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setTasks(res.data);
      }
    }).catch((err) => {
      console.warn('Live asha tasks fetch failed:', err);
    });
  }, []);

  const counts = useMemo(() => {
    return {
      all: tasks.filter((t) => !t.isCompleted).length,
      overdue: tasks.filter((t) => t.urgency === 'OVERDUE' && !t.isCompleted).length,
      today: tasks.filter((t) => t.urgency === 'DUE_TODAY' && !t.isCompleted).length,
      upcoming: tasks.filter((t) => t.urgency === 'UPCOMING' && !t.isCompleted).length,
      completed: tasks.filter((t) => t.isCompleted).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (urgencyFilter !== 'ALL' && t.urgency !== urgencyFilter && !t.isCompleted) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.patientName.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.village.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, urgencyFilter, categoryFilter, search]);

  const toggleTaskCompletion = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const nextState = !targetTask.isCompleted;

    try {
      await ashaApi.updateTask(taskId, nextState);
    } catch (err) {
      console.warn('Failed to update task in backend:', err);
    }

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            isCompleted: nextState,
            completedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-up Tasks & Action Register"
        subtitle="Actionable frontline care register for overdue maternal ANC doses, missed child vaccinations, and chronic NCD checkups."
        breadcrumbs={[{ label: 'ASHA Dashboard', to: '/asha' }, { label: 'Follow-ups' }]}
      />

      {/* Urgency Counter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setUrgencyFilter('OVERDUE')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            urgencyFilter === 'OVERDUE'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
            Overdue Tasks
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{counts.overdue}</p>
          <span className="text-[11px] text-rose-600 font-semibold">Immediate attention</span>
        </button>

        <button
          type="button"
          onClick={() => setUrgencyFilter('DUE_TODAY')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            urgencyFilter === 'DUE_TODAY'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Due Today
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">{counts.today}</p>
          <span className="text-[11px] text-amber-700 font-medium">To complete today</span>
        </button>

        <button
          type="button"
          onClick={() => setUrgencyFilter('UPCOMING')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            urgencyFilter === 'UPCOMING'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Upcoming (Next 7 Days)
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{counts.upcoming}</p>
          <span className="text-[11px] text-slate-500">Scheduled checks</span>
        </button>

        <button
          type="button"
          onClick={() => setUrgencyFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
            urgencyFilter === 'ALL'
              ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-600/30'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
            Completed Tasks
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{counts.completed}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Recorded in register</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'All Categories' },
            { key: 'ANC', label: 'Maternal ANC' },
            { key: 'IMMUNIZATION', label: 'Immunization (UIP)' },
            { key: 'NCD', label: 'NCD Monitoring' },
            { key: 'TB_FOLLOWUP', label: 'TB Follow-up' },
            { key: 'POST_DISCHARGE', label: 'Post-Discharge' },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                categoryFilter === cat.key
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks or patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center bg-white border-slate-200">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
            <h3 className="font-bold text-slate-900 text-base">No Pending Follow-ups</h3>
            <p className="text-xs text-slate-500 mt-1">
              All community follow-up tasks in this category have been completed or none are currently scheduled.
            </p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={`border transition-all ${
                task.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                  : task.urgency === 'OVERDUE'
                  ? 'border-rose-300 bg-white shadow-xs'
                  : task.urgency === 'DUE_TODAY'
                  ? 'border-amber-300 bg-white shadow-xs'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.isCompleted ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Completed
                      </span>
                    ) : task.urgency === 'OVERDUE' ? (
                      <span className="rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> OVERDUE
                      </span>
                    ) : task.urgency === 'DUE_TODAY' ? (
                      <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> DUE TODAY
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                        Upcoming
                      </span>
                    )}

                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      {task.category.replace(/_/g, ' ')}
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {task.patientName} ({task.village})
                    </span>
                  </div>

                  <h4
                    className={`font-extrabold text-sm sm:text-base ${
                      task.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-xs text-slate-600">{task.description}</p>

                  <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block">Required Frontline Action:</span>
                    <p className="text-slate-600">{task.actionRequired}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-teal-700" />
                      Target Due Date: <strong>{task.dueDate}</strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  {task.patientPhone && (
                    <a
                      href={`tel:${task.patientPhone}`}
                      className="rounded-xl border border-slate-300 p-2.5 text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="Call Beneficiary"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}

                  <Link to="/asha/visits">
                    <Button variant="outline" size="sm" className="text-xs min-h-[44px]">
                      Visit Screen
                    </Button>
                  </Link>

                  <Button
                    type="button"
                    onClick={() => toggleTaskCompletion(task.id)}
                    variant={task.isCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    className={`text-xs min-h-[44px] font-bold ${
                      task.isCompleted
                        ? 'text-slate-600 hover:bg-slate-200'
                        : 'bg-teal-700 hover:bg-teal-800'
                    }`}
                  >
                    {task.isCompleted ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" /> Mark Done
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
