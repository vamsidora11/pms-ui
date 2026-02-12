import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "../components/Modal";

describe("Modal", () => {
  it("does not render when open is false", () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders when open is true", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test Title">
        Modal Content
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();

    const { container } = render(
      <Modal open onClose={onClose} title="Test">
        Content
      </Modal>
    );

    // backdrop is first child div inside fixed container
    const backdrop = container.querySelector(".absolute.inset-0");
    fireEvent.click(backdrop as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Test">
        Content
      </Modal>
    );

    fireEvent.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders footer when provided", () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Test"
        footer={<button>Confirm</button>}
      >
        Content
      </Modal>
    );

    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("does not render footer when not provided", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test">
        Content
      </Modal>
    );

    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });
});
