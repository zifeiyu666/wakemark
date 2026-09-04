"use client";

import { type ReactNode, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export const DASHBOARD_HEADER_START_ID = "dashboard-header-start";
export const DASHBOARD_HEADER_END_ID = "dashboard-header-end";

export function DashboardHeaderPortals({
  start,
  end,
}: {
  start?: ReactNode;
  end?: ReactNode;
}) {
  const [startEl, setStartEl] = useState<HTMLElement | null>(null);
  const [endEl, setEndEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setStartEl(document.getElementById(DASHBOARD_HEADER_START_ID));
    setEndEl(document.getElementById(DASHBOARD_HEADER_END_ID));
  }, []);

  return (
    <>
      {startEl && start ? createPortal(start, startEl) : null}
      {endEl && end ? createPortal(end, endEl) : null}
    </>
  );
}
