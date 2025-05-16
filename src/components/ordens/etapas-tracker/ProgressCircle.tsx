
import React from "react";

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  bgColor?: string;
  fgColor?: string;
  textSize?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 100,
  strokeWidth = 8,
  bgColor = "text-slate-200",
  fgColor = "text-blue-500",
  textSize = "text-xl",
}) => {
  const radius = (size / 2) - (strokeWidth * 2);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className={`w-${size} h-${size}`} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={bgColor}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={fgColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 0.5s ease",
          }}
        />
      </svg>
      <span className={`absolute ${textSize} font-bold`}>{Math.round(value)}%</span>
    </div>
  );
};

export default ProgressCircle;
