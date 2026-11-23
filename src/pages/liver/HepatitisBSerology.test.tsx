import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LiverMiniApp, {
  HEPATITIS_B_SEROLOGY_ALT,
  HEPATITIS_B_SEROLOGY_CAPTION,
  HEPATITIS_B_SEROLOGY_ID,
} from "./LiverMiniApp";

afterEach(() => {
  window.location.hash = "";
});

describe("hepatitis B serology chart", () => {
  it("renders the chart inside viral hepatitis, on a white card, with enlarge", () => {
    render(<LiverMiniApp />);

    const anchors = document.querySelectorAll(`#${HEPATITIS_B_SEROLOGY_ID}`);
    expect(anchors).toHaveLength(1);
    const anchor = anchors[0] as HTMLElement;
    expect(anchor.parentElement).toHaveTextContent("Viral hepatitis");
    expect(anchor.parentElement).toHaveTextContent("Hepatitis B");

    const image = screen.getByRole("img", { name: HEPATITIS_B_SEROLOGY_ALT });
    expect(image).toHaveAttribute("alt", HEPATITIS_B_SEROLOGY_ALT);
    expect(image.getAttribute("src")).toMatch(/hepatitis-b-serology\.webp/);
    expect(image.className).toContain("w-full");
    expect(image.className).toContain("bg-white");
    expect(image.className).not.toMatch(/dark:invert|invert/);
    expect(anchor).toContainElement(image);

    const card = image.parentElement;
    expect(card?.className).toContain("bg-white");
    expect(card?.className).toContain("w-full");

    expect(screen.getByText(HEPATITIS_B_SEROLOGY_CAPTION)).toBeInTheDocument();
    expect(screen.queryByText(/tap to enlarge/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Zoom: ${HEPATITIS_B_SEROLOGY_ALT}` }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector("img")).toHaveAttribute("alt", HEPATITIS_B_SEROLOGY_ALT);
    expect(dialog.querySelector("img")).toHaveAttribute("src", image.getAttribute("src"));
  });

  it("scrolls the serology anchor into view when the hash is set", async () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = `#${HEPATITIS_B_SEROLOGY_ID}`;

    render(<LiverMiniApp />);

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
    expect(document.getElementById(HEPATITIS_B_SEROLOGY_ID)).not.toBeNull();
    Element.prototype.scrollIntoView = original;
  });
});
