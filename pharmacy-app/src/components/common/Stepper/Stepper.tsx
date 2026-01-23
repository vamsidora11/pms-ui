interface Step {
  step: number;
  label: string;
}

interface StepperProps {
  currentStep: number;
  steps: Step[];
}

export default function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        {steps.map((item, index) => (
          <div key={item.step} className="flex items-center flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    currentStep >= item.step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
              >
                {item.step}
              </div>

              <div>
                <div
                  className={`text-sm ${
                    currentStep >= item.step
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  Step {item.step}
                </div>
                <div
                  className={`text-xs ${
                    currentStep >= item.step
                      ? "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  {item.label}
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 ${
                  currentStep > item.step
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
