import * as React from "react";
import type { ISvgIcons } from "../type";

export function PlaneLogo({ width = "32", height = "32", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg width={width} height={height} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="14" stroke={color} strokeWidth="3" />
      <path d="M10 20L16 10L22 20H10Z" fill={color} />
    </svg>
  );
}