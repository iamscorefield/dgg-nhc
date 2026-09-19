'use client';

import React from 'react';
import KanbanBoard from '@/components/startup/KanbanBoard';

export default function StartupPipelinePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <KanbanBoard />
    </div>
  );
}