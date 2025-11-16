import { Suspense } from "react";
import GameFallbackClient from "./GameFallbackClient";

export default function GameFallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameFallbackClient />
    </Suspense>
  );
}