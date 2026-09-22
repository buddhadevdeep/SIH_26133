import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { AiModelRegistryItem } from '@/types/admin';
import {
  BrainCircuit,
  Zap,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

interface AiModelsTabProps {
  models: AiModelRegistryItem[];
  onDeployModel: (id: string) => Promise<void>;
  onRollbackModel: (id: string) => Promise<void>;
  isDeploying: string | null;
}

export const AiModelsTab: React.FC<AiModelsTabProps> = ({
  models,
  onDeployModel,
  onRollbackModel,
  isDeploying,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: 'DEPLOY' | 'ROLLBACK';
    model: AiModelRegistryItem | null;
  }>({
    open: false,
    type: 'DEPLOY',
    model: null,
  });

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

    if (type === 'DEPLOY') {
      await onDeployModel(model.id);
    } else {
      await onRollbackModel(model.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinical Intelligence & Operational Models</h3>
            <p className="text-xs text-slate-500">
              Verified clinical algorithms supporting triage, bed forecasts, and outbreak monitoring
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
          {models.filter((m) => m.status === 'ACTIVE').length} / {models.length} Models Active
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
                  Target: <strong className="text-slate-700">{model.targetMetric}</strong> • Architecture: {model.algorithm}
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

            {/* Performance Metrics */}
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
              <span>Last evaluated: <strong>2026-03-11</strong> • Model format: ONNX Runtime</span>
              <span className="text-slate-400 text-[11px]">Deployed at: {model.deployedAt || 'Pending deployment'}</span>
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
                Deploying this model will immediately activate it across all district healthcare facilities for real-time triage and bed allocation decisions.
              </p>
            ) : (
              <p>
                Rolling back will revert this model to staging and restore the previous baseline algorithm. Live inference requests will switch without downtime.
              </p>
            )}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
              <div>Target Metric: {confirmModal.model.targetMetric}</div>
              <div>Accuracy: {confirmModal.model.accuracyPercent}%</div>
              <div>Trained Records: {confirmModal.model.trainedOnRecords.toLocaleString()}</div>
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
