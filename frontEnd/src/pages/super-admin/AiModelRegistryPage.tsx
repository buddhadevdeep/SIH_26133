import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { INITIAL_AI_MODELS } from '@/mock/mockData';
import { AiModelRegistryItem } from '@/types/admin';
import { adminApi } from '@/api/adminApi';
import {
  BrainCircuit,
  Zap,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Info,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const AiModelRegistryPage: React.FC = () => {
  const [models, setModels] = useState<AiModelRegistryItem[]>(INITIAL_AI_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'DEPLOY' | 'ROLLBACK';
    model: AiModelRegistryItem | null;
  }>({
    open: false,
    type: 'DEPLOY',
    model: null,
  });

  const fetchModels = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    setError(null);
    try {
      const res = await adminApi.getAiModels();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setModels(res.data);
      }
    } catch (err: any) {
      console.warn('AI Models fetch error:', err);
      setError(err?.message || 'Could not fetch live AI models.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchModels();
  }, []);

  const handleOpenConfirm = (model: AiModelRegistryItem, type: 'DEPLOY' | 'ROLLBACK') => {
    setConfirmModal({
      open: true,
      type,
      model,
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal.model) return;
    const { model, type } = confirmModal;
    setConfirmModal({ open: false, type: 'DEPLOY', model: null });

    setIsDeploying(model.id);
    try {
      if (type === 'DEPLOY') {
        await adminApi.deployModel(model.id);
        setModels((prev) =>
          prev.map((m) =>
            m.id === model.id ? { ...m, status: 'ACTIVE', deployedAt: new Date().toISOString().slice(0, 10) } : m
          )
        );
        setSuccessToast(`Model "${(model as any).name || model.modelName}" (${model.version}) deployed to active production cluster.`);
      } else {
        await adminApi.rollbackModel(model.id);
        setModels((prev) =>
          prev.map((m) => (m.id === model.id ? { ...m, status: 'STAGING' } : m))
        );
        setSuccessToast(`Model "${(model as any).name || model.modelName}" (${model.version}) rolled back to previous checkpoint.`);
      }
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      console.warn('Model deployment/rollback error:', err);
      setError(err?.message || 'Action failed on server.');
    } finally {
      setIsDeploying(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Model Registry"
        subtitle="Manage verified clinical assistance algorithms and operational models across the health grid."
        breadcrumbs={[
          { label: 'Technical Center', to: '/super-admin' },
          { label: 'AI Models' },
        ]}
        actions={
          <Button
            onClick={() => fetchModels(true)}
            variant="outline"
            size="sm"
            isLoading={isRefreshing}
            className="text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-teal-700" />
            Refresh Registry
          </Button>
        }
      />

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => fetchModels(true)}>Retry</Button>
        </div>
      )}

      {/* Clinical Safety Notice Banner (Required by Section 13) */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block text-sm">
            Clinical Governance & Safety Mandate
          </span>
          <p className="text-slate-600 leading-relaxed">
            AI models in HealthConnect serve exclusively as diagnostic decision support, patient flow forecasting, and bed triage assistants. Final clinical diagnosis, medication prescriptions, and emergency care decisions always rest solely with the licensed doctor or authorized healthcare worker.
          </p>
        </div>
      </div>

      {/* Models Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Deployed Machine Learning Models</h3>
            <p className="text-xs text-slate-500">
              {models.filter((m) => m.status === 'ACTIVE').length} active models in production inference runtime
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          Runtime: ONNX Microservices Grid
        </span>
      </div>

      {/* Model Cards */}
      <div className="space-y-4">
        {models.map((model) => (
          <Card key={model.id} className="p-5 border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">{model.modelName}</h4>
                  <span className="rounded-md bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold px-2 py-0.5">
                    v{model.version}
                  </span>
                  <StatusBadge status={model.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Target Metric: <strong className="text-slate-800">{model.targetMetric}</strong> • Architecture: {model.algorithm}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {model.status === 'STAGING' ? (
                  <Button
                    onClick={() => handleOpenConfirm(model, 'DEPLOY')}
                    variant="primary"
                    size="sm"
                    className="text-xs font-semibold gap-1.5 cursor-pointer"
                    isLoading={isDeploying === model.id}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Deploy to Production
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleOpenConfirm(model, 'ROLLBACK')}
                    variant="outline"
                    size="sm"
                    className="text-xs font-medium text-slate-700 gap-1.5 cursor-pointer hover:bg-slate-100"
                    isLoading={isDeploying === model.id}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rollback Model
                  </Button>
                )}
              </div>
            </div>

            {/* Performance Metrics Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
                <span className="text-lg font-black text-slate-900">{model.accuracyPercent}%</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Mean Abs Error</span>
                <span className="text-lg font-black text-slate-900">{model.mae}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">RMSE</span>
                <span className="text-lg font-black text-slate-900">{model.rmse}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Trained Samples</span>
                <span className="text-lg font-black text-slate-900">{model.trainedOnRecords.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 pt-1">
              <span>Verified Dataset: Gandhinagar Health Repository • Training Format: ONNX Runtime</span>
              <span className="text-slate-400 text-[11px]">Deployed: {model.deployedAt || 'Pending deployment'}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog for Sensitive Actions */}
      {confirmModal.open && confirmModal.model && (
        <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))} maxWidth="md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>
                  {confirmModal.type === 'DEPLOY' ? 'Deploy AI Model to Production?' : 'Rollback AI Model?'}
                </DialogTitle>
                <DialogDescription>
                  {confirmModal.model.modelName} (v{confirmModal.model.version})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogContent className="space-y-3 text-xs text-slate-600">
            {confirmModal.type === 'DEPLOY' ? (
              <p>
                Deploying this model will immediately activate it across all district healthcare facilities for live queue estimation and bed triage.
              </p>
            ) : (
              <p>
                Rolling back will revert this model to staging and restore the previous baseline algorithm. Real-time inference traffic will switch without downtime.
              </p>
            )}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
              <div>Target Metric: {confirmModal.model.targetMetric}</div>
              <div>Algorithm: {confirmModal.model.algorithm}</div>
              <div>Accuracy: {confirmModal.model.accuracyPercent}%</div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              variant="secondary"
              size="sm"
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteAction}
              variant={confirmModal.type === 'DEPLOY' ? 'primary' : 'destructive'}
              size="sm"
              className="cursor-pointer"
            >
              {confirmModal.type === 'DEPLOY' ? 'Confirm & Deploy' : 'Confirm Rollback'}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
