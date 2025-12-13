import React from "react";

interface StepDotsProps {
  currentStep: number;
  steps: string[];
}

export function StepDots({ currentStep, steps }: StepDotsProps) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const active = stepNumber <= currentStep;

        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                active
                  ? "border-[#D9A66A] bg-[#2b0f0c] text-[#D9A66A] shadow-[0_0_18px_rgba(217,166,106,0.45)]"
                  : "border-[#3b1a15] bg-[#150605] text-gray-400"
              }`}
            >
              <span className="font-semibold">{stepNumber}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-[2px] w-14 rounded-full transition-all duration-300 ${
                  stepNumber < currentStep
                    ? "bg-[#D9A66A] shadow-[0_0_18px_rgba(217,166,106,0.35)]"
                    : "bg-[#3b1a15]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepDots;
