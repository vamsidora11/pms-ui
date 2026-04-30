/**
 * Unit tests for patientFormRules.ts
 *
 * This file tests the logic that governs patient form input:
 *
 * 1. applyPatientRule()
 *    - Applies light sanitization and typing warnings for each field.
 *    - Ensures soft guidance is shown for invalid input while typing.
 *
 * 2. validatePatientForm()
 *    - Performs hard validation on submit.
 *    - Returns error messages for missing or invalid values.
 *
 * Fields tested:
 * - fullName: required, alphabets only, warns if numbers/symbols while typing
 * - dob: required, valid date, cannot be in the future
 * - phone: required, must follow E.164 format, warns for invalid characters
 * - email: optional, must be valid format if provided
 * - address: max 50 characters
 
 */

import { describe, it, expect } from "vitest";
import {
  applyPatientRule,
  validatePatientForm,
  type PatientFormLike,
} from "../utils/patientFormRules";

describe("patientFormRules", () => {
  const validForm: PatientFormLike = {
    fullName: "John Doe",
    dob: "1990-05-15",
    phone: "+14155552671",
    email: "john.doe@example.com",
    address: "123 Main Street",
  };

  /* ================= APPLY RULE TESTS ================= */
  describe("applyPatientRule", () => {
    it("returns empty warning for valid fullName", () => {
      const result = applyPatientRule("fullName", "John Doe", validForm);
      expect(result.warning).toBe("");
      expect(result.value).toBe("John Doe");
    });

    it("warns when fullName has numbers", () => {
      const result = applyPatientRule("fullName", "John123", validForm);
      expect(result.warning).toBe("Only alphabets and spaces are allowed.");
    });

    it("warns when phone is invalid while typing", () => {
      const result = applyPatientRule("phone", "123abc", validForm);
      expect(result.warning).toBe(
        "Phone should contain only numbers and '+' (country code)"
      );
    });

    it("warns when email format is invalid", () => {
      const result = applyPatientRule("email", "invalid-email", validForm);
      expect(result.warning).toBe("Email format is invalid");
    });

    it("warns when address is too long", () => {
      const longAddress = "A".repeat(51);
      const result = applyPatientRule("address", longAddress, validForm);
      expect(result.warning).toBe("Address cannot exceed 50 characters");
    });
  });

  /* ================= VALIDATE FORM TESTS ================= */
  describe("validatePatientForm", () => {
    it("returns no errors for a valid form", () => {
      const errors = validatePatientForm(validForm);
      expect(errors).toEqual({});
    });

    it("validates fullName required", () => {
      const errors = validatePatientForm({ ...validForm, fullName: "" });
      expect(errors.fullName).toBe("Full Name is required");
    });

    it("validates fullName only alphabets", () => {
      const errors = validatePatientForm({ ...validForm, fullName: "John123" });
      expect(errors.fullName).toBe(
        "Full Name can contain only alphabets and spaces"
      );
    });

    it("validates dob is required", () => {
      const errors = validatePatientForm({ ...validForm, dob: "" });
      expect(errors.dob).toBe("Date of Birth is required");
    });

    it("validates dob not in the future", () => {
      const futureDate = "2999-01-01";
      const errors = validatePatientForm({ ...validForm, dob: futureDate });
      expect(errors.dob).toBe("Date of Birth cannot be in the future");
    });

    it("validates phone required", () => {
      const errors = validatePatientForm({ ...validForm, phone: "" });
      expect(errors.phone).toBe("Phone number is required");
    });

    it("validates phone must be E.164 format", () => {
      const errors = validatePatientForm({ ...validForm, phone: "12345" });
      expect(errors.phone).toBe(
        "Enter a valid international phone number (E.164), e.g., +919876543210"
      );
    });

    it("validates email format", () => {
      const errors = validatePatientForm({ ...validForm, email: "bad-email" });
      expect(errors.email).toBe("Enter a valid email address");
    });

    it("validates address length", () => {
      const errors = validatePatientForm({
        ...validForm,
        address: "A".repeat(51),
      });
      expect(errors.address).toBe("Address cannot exceed 50 characters");
    });
  });
});
