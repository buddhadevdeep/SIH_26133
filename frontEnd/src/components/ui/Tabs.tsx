import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ value, onValueChange, className, children }) => (
  <TabsContext.Provider value={{ activeTab: value, setActiveTab: onValueChange }}>
    <div className={cn('w-full flex flex-col space-y-4', className)}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div
    className={cn(
      'inline-flex h-12 items-center justify-start rounded-xl bg-slate-100 p-1 text-slate-500 overflow-x-auto max-w-full border border-slate-200/80',
      className
    )}
  >
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ value, className, children, icon }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');
  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0] min-h-[40px]',
        isActive
          ? 'bg-white text-[#1D6394] shadow-sm font-semibold'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60',
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; className?: string; children: React.ReactNode }> = ({
  value,
  className,
  children,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used inside Tabs');
  if (context.activeTab !== value) return null;

  return <div className={cn('animate-in fade-in-50 duration-150', className)}>{children}</div>;
};
