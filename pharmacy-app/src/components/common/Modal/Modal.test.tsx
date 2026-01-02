import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal from "./Modal";

describe("Modal component", () => {
  test("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>
    );

    expect(
      screen.queryByText("Content")
    ).not.toBeInTheDocument();
  });

  test("renders modal content when isOpen is true", () => {
    render(
      <Modal isOpen onClose={() => {}}>
        Modal Content
      </Modal>
    );

    expect(
      screen.getByText("Modal Content")
    ).toBeInTheDocument();
  });

  test("renders title when title prop is provided", () => {
    render(
      <Modal
        isOpen
        title="Confirm Action"
        onClose={() => {}}
      >
        Are you sure?
      </Modal>
    );

    expect(
      screen.getByText("Confirm Action")
    ).toBeInTheDocument();
  });

  test("does not render title when title prop is not provided", () => {
    render(
      <Modal isOpen onClose={() => {}}>
        Content
      </Modal>
    );

    expect(
      screen.queryByRole("heading")
    ).not.toBeInTheDocument();
  });

  test("calls onClose when Close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose}>
        Content
      </Modal>
    );

    await user.click(
      screen.getByRole("button", { name: /close/i })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
