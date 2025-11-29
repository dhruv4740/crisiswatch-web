"use client";

import { GamificationProvider } from "./components/ui/gamification";

export function Providers({ children }: { children: React.ReactNode }) {
  return <GamificationProvider>{children}</GamificationProvider>;
}
