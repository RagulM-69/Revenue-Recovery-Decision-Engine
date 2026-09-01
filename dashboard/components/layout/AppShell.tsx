'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
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
    <div className="flex min-h-screen">
      <Sidebar currentRun={currentRun} />
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
};
