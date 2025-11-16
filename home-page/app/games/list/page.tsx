import React, { Suspense } from 'react';
import GamesListClient from './GamesListClient';

export default function GamesListPage() {
  return (
    <Suspense fallback={<div>Loading games...</div>}>
      <GamesListClient />
    </Suspense>
  );
}