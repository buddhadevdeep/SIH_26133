import React from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Button } from '@/components/ui/Button';
import { BellRing, CheckCircle2, ArrowRight } from 'lucide-react';

export const CallingAlertModal: React.FC = () => {
  const { activeCalledToken, dismissCallingAlert } = useSocket();

  if (!activeCalledToken) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-xl sm:max-w-2xl rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border-4 border-teal-500 space-y-6">
        {/* Animated Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-700 animate-bounce">
          <BellRing className="h-10 w-10 text-teal-700" />
        </div>

        <div>
          <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-800">
            Token Called Now
          </span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            {activeCalledToken.tokenNumber}
          </h2>
          <p className="mt-1 text-base font-semibold text-slate-700">{activeCalledToken.patientName}</p>
        </div>

        {/* Room Callout Box */}
        <div className="rounded-2xl bg-teal-50 border-2 border-teal-300 p-5 text-teal-950 space-y-1">
          <p className="text-sm uppercase tracking-wider text-teal-800 font-semibold">Destination</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-900">
            Please proceed to {activeCalledToken.roomNumber || 'Room 4'}
          </p>
          <p className="text-xs text-teal-700 pt-1">
            {activeCalledToken.departmentName} • {activeCalledToken.facilityName}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={dismissCallingAlert}
            variant="primary"
            size="lg"
            className="w-full gap-2 text-base font-bold bg-teal-700 hover:bg-teal-800"
          >
            <CheckCircle2 className="h-5 w-5" />
            I am Proceeding to Room
          </Button>
          <Button
            onClick={dismissCallingAlert}
            variant="outline"
            size="lg"
            className="w-full text-slate-600"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
