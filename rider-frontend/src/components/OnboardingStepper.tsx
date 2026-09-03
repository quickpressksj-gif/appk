import { Check } from "lucide-react";

export type OnboardingStep = 1 | 2 | 3 | 4;

type StepperProps = {
  currentStep: OnboardingStep;
  onStepClick?: (step: OnboardingStep) => void;
};

const STEPS = [
  { id: 1 as const, label: "Personal" },
  { id: 2 as const, label: "Vehicle" },
  { id: 3 as const, label: "Documents" },
  { id: 4 as const, label: "Bank" },
];

export function OnboardingStepper({ currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Onboarding Progress" className="w-full py-2">
      <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <div key={step.id} className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => isCompleted && onStepClick?.(step.id)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all ${
                  isActive
                    ? "bg-emerald-100 font-black text-emerald-800 shadow-2xs"
                    : isCompleted
                      ? "text-emerald-700 font-bold hover:bg-emerald-50 cursor-pointer"
                      : "text-slate-400 font-medium cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-3 stroke-[3]" />
                ) : isActive ? (
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                ) : null}
                <span>
                  {step.id} {step.label}
                </span>
              </button>

              {step.id < 4 ? (
                <span className="text-slate-300 text-xs px-0.5 select-none">›</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
