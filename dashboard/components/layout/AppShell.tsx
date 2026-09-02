'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { getLatestCompletedRun } from '@/lib/data-access';
import { PipelineRun } from '@/lib/types';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [currentRun, setCurrentRun] = useState<PipelineRun | null>(null);

  useEffect(() => {
    getLatestCompletedRun().then(setCurrentRun);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F1F4F9]">
      <Sidebar currentRun={currentRun} />
      <div className="flex-1 ml-64 min-h-screen flex flex-col bg-[#F1F4F9]">
        <TopHeader currentRunId={currentRun?.run_id} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
