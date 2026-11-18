"use client";

import { MotionConfig } from "framer-motion";
import { UmpanProvider } from "./Umpan";

// Animasi otomatis dimatikan bila pengguna memilih "kurangi gerakan" di sistem operasinya
export default function Providers({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <UmpanProvider>{children}</UmpanProvider>
    </MotionConfig>
  );
}
