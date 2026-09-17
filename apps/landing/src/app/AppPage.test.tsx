import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppPage } from "./AppPage";

afterEach(cleanup);

describe("/app entry", () => {
  it("mounts with the wayfinding nav and a single main landmark", () => {
    const { container } = render(<AppPage />);
    expect(screen.getByRole("link", { name: "riprap" })).toBeTruthy();
    expect(container.querySelectorAll("main").length).toBe(1);
  });
});
