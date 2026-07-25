import * as React from "react";
import type { ISvgIcons } from "../type";

export function PlaneLockup({ width = "120", height = "32", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="16" r="10" stroke={color} strokeWidth="2.5" />
      <path d="M6 20L12 10L18 20H6Z" fill={color} />
      <text x="28" y="22" fontFamily="Inter, sans-serif" fontSize="18" fontWeight="700" fill={color} letterSpacing="2">PACE</text>
    </svg>
  );
}