import * as React from "react";
import type { ISvgIcons } from "../type";

export function PlaneWordmark({ width = "80", height = "24", className, color = "currentColor" }: ISvgIcons) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text x="0" y="20" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" fill={color} letterSpacing="2">PACE</text>
    </svg>
  );
}