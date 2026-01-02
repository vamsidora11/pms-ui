import { render, screen } from "@testing-library/react";
import ScrollArea from "./ScrollArea";

describe("ScrollArea component", () => {
  test("renders children correctly", () => {
    render(
      <ScrollArea>
        <div>Scrollable Content</div>
      </ScrollArea>
    );

    expect(
      screen.getByText("Scrollable Content")
    ).toBeInTheDocument();
  });

  test("applies default height and width classes", () => {
    const { container } = render(
      <ScrollArea>
        Content
      </ScrollArea>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("h-full");
    expect(wrapper.className).toContain("w-full");
  });

  test("applies custom height and width classes", () => {
    const { container } = render(
      <ScrollArea height="h-64" width="w-64">
        Content
      </ScrollArea>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("h-64");
    expect(wrapper.className).toContain("w-64");
  });

  test("includes base scroll classes", () => {
    const { container } = render(
      <ScrollArea>
        Content
      </ScrollArea>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("overflow-auto");
    expect(wrapper.className).toContain("relative");
  });

  test("applies custom className", () => {
    const { container } = render(
      <ScrollArea className="custom-scroll">
        Content
      </ScrollArea>
    );

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toContain("custom-scroll");
  });
});
