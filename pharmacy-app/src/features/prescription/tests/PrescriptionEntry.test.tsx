// import React from "react";
// import { describe, it, beforeEach, expect, vi } from "vitest";
// import { render, screen, fireEvent } from "@testing-library/react";
// import PrescriptionEntry from "../PrescriptionEntry";

// // ---------------------
// // Module-level mutable state for the hook mock
// // ---------------------
// type HookDraft = {
//   patient: any;
//   doctor: any;
//   medications: any[];
// };

// type HookState = {
//   currentStep: 1 | 2 | 3 | 4;
//   steps: { key: string; label: string }[];
//   draft: HookDraft;
//   isSubmitting: boolean;
//   isNextDisabled: boolean;
//   goNext: () => void;
//   goPrev: () => void;

//   handlePatientSelected: (p: any) => void;
//   handleDoctorChange: (d: any) => void;
//   handleMedicationsChange: (m: any[]) => void;

//   handleSubmit: () => void;
// };

// let mockHookState: HookState;

// // ---------------------
// // Mock: usePrescriptionEntry hook
// // ---------------------
// vi.mock("../hooks/usePrescriptionEntry", () => {
//   return {
//     usePrescriptionEntry: vi.fn(() => mockHookState),
//   };
// });

// // ---------------------
// // Mock: Stepper
// // ---------------------
// const stepperSpy = vi.fn();
// vi.mock("@components/common/Stepper/Stepper", () => {
//   const MockStepper = (props: any) => {
//     stepperSpy(props);
//     return (
//       <div data-testid="stepper">
//         step:{props.currentStep} total:{props.steps?.length ?? 0}
//       </div>
//     );
//   };
//   return { default: MockStepper };
// });

// // ---------------------
// // Mock: PatientStep
// // ---------------------
// const patientStepSpy = vi.fn();
// vi.mock("@prescription/steps/PatientStep", () => {
//   const MockPatientStep = (props: any) => {
//     patientStepSpy(props);
//     return (
//       <div data-testid="patient-step">
//         <button
//           data-testid="patient-change"
//           onClick={() => props.onChange?.({ id: "p-1", name: "John Patient" })}
//         >
//           Trigger Patient Change
//         </button>
//       </div>
//     );
//   };
//   return { default: MockPatientStep };
// });

// // ---------------------
// // Mock: DoctorStep
// // ---------------------
// const doctorStepSpy = vi.fn();
// vi.mock("@prescription/steps/DoctorStep", () => {
//   const MockDoctorStep = (props: any) => {
//     doctorStepSpy(props);
//     return (
//       <div data-testid="doctor-step">
//         <button
//           data-testid="doctor-change"
//           onClick={() => props.onChange?.({ id: "d-1", name: "Dr. Who" })}
//         >
//           Trigger Doctor Change
//         </button>
//       </div>
//     );
//   };
//   return { default: MockDoctorStep };
// });

// // ---------------------
// // Mock: MedicationStep
// // ---------------------
// const medicationStepSpy = vi.fn();
// vi.mock("@prescription/steps/MedicationStep", () => {
//   const MockMedicationStep = (props: any) => {
//     medicationStepSpy(props);
//     return (
//       <div data-testid="medication-step">
//         <button
//           data-testid="medications-change"
//           onClick={() =>
//             props.onChange?.([
//               { id: "m-1", name: "Amoxicillin", qty: 10 },
//               { id: "m-2", name: "Ibuprofen", qty: 20 },
//             ])
//           }
//         >
//           Trigger Medications Change
//           </button>
//       </div>
//     );
//   };
//   return { default: MockMedicationStep };
// });

// // ---------------------
// // Mock: ReviewStep
// // ---------------------
// const reviewStepSpy = vi.fn();
// vi.mock("@prescription/steps/ReviewStep", () => {
//   const MockReviewStep = (props: any) => {
//     reviewStepSpy(props);
//     return (
//       <div data-testid="review-step">
//         <div data-testid="is-submitting">{String(props.isSubmitting)}</div>
//         <button data-testid="submit" onClick={() => props.onSubmit?.()}>
//           Submit
//         </button>
//       </div>
//     );
//   };
//   return { default: MockReviewStep };
// });

// // ---------------------
// // Helpers
// // ---------------------
// const createBaseHookState = (overrides?: Partial<HookState>): HookState => {
//   return {
//     currentStep: 1,
//     steps: [
//       { key: "patient", label: "Patient" },
//       { key: "doctor", label: "Doctor" },
//       { key: "meds", label: "Medications" },
//       { key: "review", label: "Review" },
//     ],
//     draft: {
//       patient: null,
//       doctor: null,
//       medications: [],
//     },
//     isSubmitting: false,
//     isNextDisabled: false,
//     goNext: vi.fn(),
//     goPrev: vi.fn(),
//     handlePatientSelected: vi.fn(),
//     handleDoctorChange: vi.fn(),
//     handleMedicationsChange: vi.fn(),
//     handleSubmit: vi.fn(),
//     ...overrides,
//   };
// };

// const renderWithState = (overrides?: Partial<HookState>) => {
//   mockHookState = createBaseHookState(overrides);
//   stepperSpy.mockClear();
//   patientStepSpy.mockClear();
//   doctorStepSpy.mockClear();
//   medicationStepSpy.mockClear();
//   reviewStepSpy.mockClear();

//   return render(<PrescriptionEntry />);
// };

// // ---------------------
// // Tests
// // ---------------------
// describe("PrescriptionEntry", () => {
//   beforeEach(() => {
//     mockHookState = createBaseHookState();
//   });

//   it("renders Stepper with provided props", () => {
//     renderWithState({ currentStep: 2 });
//     expect(screen.getByTestId("stepper")).toBeInTheDocument();
//     // assert Stepper received correct props
//     expect(stepperSpy).toHaveBeenCalledTimes(1);
//     const props = stepperSpy.mock.calls[0][0];
//     expect(props.currentStep).toBe(2);
//     expect(Array.isArray(props.steps)).toBe(true);
//     expect(props.steps.length).toBe(4);
//   });

//   it("step 1: shows PatientStep, Previous disabled, Next enabled, and forwards onChange", () => {
//     const handlePatientSelected = vi.fn();
//     const goPrev = vi.fn();
//     const goNext = vi.fn();

//     renderWithState({
//       currentStep: 1,
//       handlePatientSelected,
//       goPrev,
//       goNext,
//       isNextDisabled: false,
//     });

//     // PatientStep rendered, others not
//     expect(screen.getByTestId("patient-step")).toBeInTheDocument();
//     expect(screen.queryByTestId("doctor-step")).not.toBeInTheDocument();
//     expect(screen.queryByTestId("medication-step")).not.toBeInTheDocument();
//     expect(screen.queryByTestId("review-step")).not.toBeInTheDocument();

//     // Buttons visible (since step < 4)
//     const prevBtn = screen.getByRole("button", { name: /previous/i });
//     const nextBtn = screen.getByRole("button", { name: /next/i });

//     expect(prevBtn).toBeDisabled(); // currentStep === 1
//     expect(nextBtn).not.toBeDisabled();

//     // Clicking Previous (even if disabled, ensure no call)
//     fireEvent.click(prevBtn);
//     expect(goPrev).not.toHaveBeenCalled();

//     // Clicking Next invokes goNext
//     fireEvent.click(nextBtn);
//     expect(goNext).toHaveBeenCalledTimes(1);

//     // Trigger Patient change
//     fireEvent.click(screen.getByTestId("patient-change"));
//     expect(handlePatientSelected).toHaveBeenCalledWith({
//       id: "p-1",
//       name: "John Patient",
//     });
//   });

//   it("disables Next when isNextDisabled=true (any step < 4)", () => {
//     const goNext = vi.fn();
//     renderWithState({
//       currentStep: 2,
//       isNextDisabled: true,
//       goNext,
//     });

//     const nextBtn = screen.getByRole("button", { name: /next/i });
//     expect(nextBtn).toBeDisabled();

//     // Try clicking; should not call goNext
//     fireEvent.click(nextBtn);
//     expect(goNext).not.toHaveBeenCalled();
//   });

//   it("step 2: shows DoctorStep and forwards onChange; Previous enabled", () => {
//     const handleDoctorChange = vi.fn();
//     const goPrev = vi.fn();
//     renderWithState({
//       currentStep: 2,
//       handleDoctorChange,
//       goPrev,
//     });

//     expect(screen.getByTestId("doctor-step")).toBeInTheDocument();
//     const prevBtn = screen.getByRole("button", { name: /previous/i });
//     expect(prevBtn).not.toBeDisabled();
//     fireEvent.click(prevBtn);
//     expect(goPrev).toHaveBeenCalledTimes(1);

//     // onChange (inline arrow) should pass doctor through
//     fireEvent.click(screen.getByTestId("doctor-change"));
//     expect(handleDoctorChange).toHaveBeenCalledWith({
//       id: "d-1",
//       name: "Dr. Who",
//     });
//   });

//   it("step 3: shows MedicationStep and forwards onChange; both nav buttons visible", () => {
//     const handleMedicationsChange = vi.fn();
//     const goPrev = vi.fn();
//     const goNext = vi.fn();

//     renderWithState({
//       currentStep: 3,
//       handleMedicationsChange,
//       goPrev,
//       goNext,
//     });

//     expect(screen.getByTestId("medication-step")).toBeInTheDocument();
//     const prevBtn = screen.getByRole("button", { name: /previous/i });
//     const nextBtn = screen.getByRole("button", { name: /next/i });
//     expect(prevBtn).toBeInTheDocument();
//     expect(nextBtn).toBeInTheDocument();

//     fireEvent.click(prevBtn);
//     expect(goPrev).toHaveBeenCalledTimes(1);
//     fireEvent.click(nextBtn);
//     expect(goNext).toHaveBeenCalledTimes(1);

//     // Forward medications change
//     fireEvent.click(screen.getByTestId("medications-change"));
//     expect(handleMedicationsChange).toHaveBeenCalledWith([
//       { id: "m-1", name: "Amoxicillin", qty: 10 },
//       { id: "m-2", name: "Ibuprofen", qty: 20 },
//     ]);
//   });

//   it("step 4: shows ReviewStep, hides nav buttons, passes isSubmitting and onSubmit", () => {
//     const handleSubmit = vi.fn();
//     renderWithState({
//       currentStep: 4,
//       isSubmitting: true,
//       handleSubmit,
//     });

//     // Review step visible
//     expect(screen.getByTestId("review-step")).toBeInTheDocument();
//     expect(screen.getByTestId("is-submitting").textContent).toBe("true");

//     // Nav buttons hidden when step === 4
//     expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
//     expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();

//     // Submit propagates to handleSubmit
//     fireEvent.click(screen.getByTestId("submit"));
//     expect(handleSubmit).toHaveBeenCalledTimes(1);
//   });
// });
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ---- Mock the hook used by the component under test ----
import { usePrescriptionEntry } from "../hooks/usePrescriptionEntry";
vi.mock("./hooks/usePrescriptionEntry", () => ({
  usePrescriptionEntry: vi.fn(),
}));

// ---- Mock Stepper so we can assert props are passed correctly ----
vi.mock("@components/common/Stepper/Stepper", () => ({
  default: ({ currentStep, steps }: any) => (
    <div data-testid="stepper">
      Step:{currentStep} of {Array.isArray(steps) ? steps.length : 0}
    </div>
  ),
}));

// ---- Mock each individual Step component with a minimal UI ----
vi.mock("@prescription/steps/PatientStep", () => ({
  default: ({ patient, onChange }: any) => (
    <div data-testid="patient-step">
      <div>PatientStep</div>
      <div data-testid="patient-prop">{String(!!patient)}</div>
      <button
        type="button"
        onClick={() => onChange("patient-001")}
        aria-label="change-patient"
      >
        change-patient
      </button>
    </div>
  ),
}));

vi.mock("@prescription/steps/DoctorStep", () => ({
  default: ({ doctor, onChange }: any) => (
    <div data-testid="doctor-step">
      <div>DoctorStep</div>
      <div data-testid="doctor-prop">{String(!!doctor)}</div>
      <button
        type="button"
        onClick={() => onChange({ id: "doc-001", name: "Dr. Test" })}
        aria-label="change-doctor"
      >
        change-doctor
      </button>
    </div>
  ),
}));

vi.mock("@prescription/steps/MedicationStep", () => ({
  default: ({ medications, onChange }: any) => (
    <div data-testid="medication-step">
      <div>MedicationStep</div>
      <div data-testid="meds-prop">{Array.isArray(medications) ? medications.length : 0}</div>
      <button
        type="button"
        onClick={() => onChange([{ id: "m-001", name: "Med A" }])}
        aria-label="change-meds"
      >
        change-meds
      </button>
    </div>
  ),
}));

vi.mock("@prescription/steps/ReviewStep", () => ({
  default: ({ draft, onSubmit, isSubmitting }: any) => (
    <div data-testid="review-step">
      <div>ReviewStep</div>
      <div data-testid="review-prop">{String(!!draft)}</div>
      <div data-testid="submitting-flag">{String(!!isSubmitting)}</div>
      <button type="button" onClick={() => onSubmit()} aria-label="submit-review">
        submit-review
      </button>
    </div>
  ),
}));

import PrescriptionEntry from "../PrescriptionEntry";

const mockUsePrescriptionEntry = usePrescriptionEntry as unknown as vi.Mock;

// Helper to create a full hook return object; override per test as needed
function makeHookReturn(overrides: Partial<ReturnType<typeof makeHookReturn>> = {}) {
  const base = {
    currentStep: 1,
    steps: [
      { id: 1, title: "Patient" },
      { id: 2, title: "Doctor" },
      { id: 3, title: "Medications" },
      { id: 4, title: "Review" },
    ],
    draft: {
      patient: null,
      doctor: null,
      medications: [],
    },
    isSubmitting: false,
    isNextDisabled: true,
    goNext: vi.fn(),
    goPrev: vi.fn(),
    handlePatientSelected: vi.fn(),
    handleDoctorChange: vi.fn(),
    handleMedicationsChange: vi.fn(),
    handleSubmit: vi.fn(),
  };
  return { ...base, ...overrides };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("PrescriptionEntry", () => {
  it("Step 1: renders PatientStep, shows disabled Previous and Next when isNextDisabled=true; patient change triggers handler", () => {
    const goNext = vi.fn();
    const goPrev = vi.fn();
    const handlePatientSelected = vi.fn();

    mockUsePrescriptionEntry.mockReturnValue(
      makeHookReturn({
        currentStep: 1,
        isNextDisabled: true,
        goNext,
        goPrev,
        handlePatientSelected,
        draft: { patient: { id: "p-001" }, doctor: null, medications: [] },
      })
    );

    render(<PrescriptionEntry />);

    // Stepper reflects step and steps length
    expect(screen.getByTestId("stepper")).toHaveTextContent("Step:1 of 4");

    // PatientStep visible; others not
    expect(screen.getByTestId("patient-step")).toBeInTheDocument();
    expect(screen.queryByTestId("doctor-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("medication-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("review-step")).not.toBeInTheDocument();

    // Footer buttons
    const prevBtn = screen.getByRole("button", { name: /Previous/i });
    const nextBtn = screen.getByRole("button", { name: /Next/i });

    expect(prevBtn).toBeDisabled(); // isFirst
    expect(nextBtn).toBeDisabled(); // isNextDisabled

    // Clicking disabled buttons should not invoke handlers
    fireEvent.click(prevBtn);
    fireEvent.click(nextBtn);
    expect(goPrev).not.toHaveBeenCalled();
    expect(goNext).not.toHaveBeenCalled();

    // Trigger patient change
    fireEvent.click(screen.getByRole("button", { name: "change-patient" }));
    expect(handlePatientSelected).toHaveBeenCalledTimes(1);
    expect(handlePatientSelected).toHaveBeenCalledWith("patient-001");
  });

  it("Step 1: Next enabled triggers goNext", () => {
    const goNext = vi.fn();
    mockUsePrescriptionEntry.mockReturnValue(
      makeHookReturn({
        currentStep: 1,
        isNextDisabled: false,
        goNext,
      })
    );

    render(<PrescriptionEntry />);

    const nextBtn = screen.getByRole("button", { name: /Next/i });
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(goNext).toHaveBeenCalledTimes(1);
  });

  it("Step 2: renders DoctorStep; Previous enabled; doctor change triggers handleDoctorChange", () => {
    const goPrev = vi.fn();
    const handleDoctorChange = vi.fn();

    mockUsePrescriptionEntry.mockReturnValue(
      makeHookReturn({
        currentStep: 2,
        isNextDisabled: false,
        goPrev,
        handleDoctorChange,
        draft: {
          patient: { id: "p-001" },
          doctor: { id: "doc-0" },
          medications: [],
        },
      })
    );

    render(<PrescriptionEntry />);

    // Stepper
    expect(screen.getByTestId("stepper")).toHaveTextContent("Step:2 of 4");

    // DoctorStep visible only on step 2
    expect(screen.getByTestId("doctor-step")).toBeInTheDocument();
    expect(screen.queryByTestId("patient-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("medication-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("review-step")).not.toBeInTheDocument();

    // Footer: Previous enabled, Next visible
    const prevBtn = screen.getByRole("button", { name: /Previous/i });
    const nextBtn = screen.getByRole("button", { name: /Next/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(prevBtn);
    expect(goPrev).toHaveBeenCalledTimes(1);

    // Trigger doctor change via mocked step
    fireEvent.click(screen.getByRole("button", { name: "change-doctor" }));
    expect(handleDoctorChange).toHaveBeenCalledTimes(1);
    expect(handleDoctorChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "doc-001", name: "Dr. Test" })
    );
  });

  it("Step 3: renders MedicationStep; meds change triggers handleMedicationsChange", () => {
    const handleMedicationsChange = vi.fn();

    mockUsePrescriptionEntry.mockReturnValue(
      makeHookReturn({
        currentStep: 3,
        isNextDisabled: false,
        handleMedicationsChange,
        draft: {
          patient: { id: "p-001" },
          doctor: { id: "doc-001" },
          medications: [],
        },
      })
    );

    render(<PrescriptionEntry />);

    // Stepper
    expect(screen.getByTestId("stepper")).toHaveTextContent("Step:3 of 4");

    // MedicationStep visible
    expect(screen.getByTestId("medication-step")).toBeInTheDocument();
    expect(screen.queryByTestId("patient-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("doctor-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("review-step")).not.toBeInTheDocument();

    // Footer: Previous enabled, Next visible
    const prevBtn = screen.getByRole("button", { name: /Previous/i });
    const nextBtn = screen.getByRole("button", { name: /Next/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();

    // Trigger medications change
    fireEvent.click(screen.getByRole("button", { name: "change-meds" }));
    expect(handleMedicationsChange).toHaveBeenCalledTimes(1);
    expect(handleMedicationsChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "m-001" })])
    );
  });

  it("Step 4: renders ReviewStep; hides Next; Previous enabled; submit triggers handleSubmit", () => {
    const goPrev = vi.fn();
    const handleSubmit = vi.fn();

    mockUsePrescriptionEntry.mockReturnValue(
      makeHookReturn({
        currentStep: 4,
        isSubmitting: true,
        goPrev,
        handleSubmit,
        draft: {
          patient: { id: "p-001" },
          doctor: { id: "doc-001" },
          medications: [{ id: "m-001" }],
        },
      })
    );

    render(<PrescriptionEntry />);

    // Stepper
    expect(screen.getByTestId("stepper")).toHaveTextContent("Step:4 of 4");

    // ReviewStep visible only on step 4
    expect(screen.getByTestId("review-step")).toBeInTheDocument();
    expect(screen.queryByTestId("patient-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("doctor-step")).not.toBeInTheDocument();
    expect(screen.queryByTestId("medication-step")).not.toBeInTheDocument();

    // isSubmitting flag should render correctly in our mock
    expect(screen.getByTestId("submitting-flag")).toHaveTextContent("true");

    // Footer: Next hidden when isLast, Previous enabled
    const prevBtn = screen.getByRole("button", { name: /Previous/i });
    expect(prevBtn).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();

    // Clicking Previous calls goPrev
    fireEvent.click(prevBtn);
    expect(goPrev).toHaveBeenCalledTimes(1);

    // Submit from ReviewStep triggers handleSubmit
    fireEvent.click(screen.getByRole("button", { name: "submit-review" }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});