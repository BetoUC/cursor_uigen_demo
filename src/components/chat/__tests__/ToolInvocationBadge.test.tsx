import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolInvocationBadge } from "../ToolInvocationBadge";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
}));

afterEach(() => {
  cleanup();
});

// getToolLabel unit tests

test("getToolLabel: no args returns default", () => {
  expect(getToolLabel("str_replace_editor", undefined)).toBe("Updating component");
});

test("getToolLabel: empty args returns default", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("Updating component");
});

test("getToolLabel: path without command returns default", () => {
  expect(getToolLabel("str_replace_editor", { path: "src/App.tsx" })).toBe("Updating component");
});

test("getToolLabel: create command", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "src/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace command", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: insert command", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: view command", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "src/config.ts" })).toBe("Reading config.ts");
});

test("getToolLabel: deeply nested path uses only filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "deeply/nested/Component.tsx" })).toBe("Creating Component.tsx");
});

test("getToolLabel: old_path fallback", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", old_path: "src/legacy.ts" })).toBe("Editing legacy.ts");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "src/Button.tsx" })).toBe("Deleting Button.tsx");
});

test("getToolLabel: file_manager delete without path", () => {
  expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getToolLabel: file_manager rename with old_path", () => {
  expect(getToolLabel("file_manager", { command: "rename", old_path: "src/Old.tsx" })).toBe("Renaming Old.tsx");
});

test("getToolLabel: file_manager rename without path", () => {
  expect(getToolLabel("file_manager", { command: "rename" })).toBe("Renaming file");
});

// ToolInvocationBadge render tests

test("ToolInvocationBadge: state=call shows loader", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "src/Button.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByTestId("loader-icon")).toBeDefined();
  expect(screen.queryByRole("presentation")).toBeNull();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge: state=partial-call shows loader", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {},
        state: "partial-call",
      }}
    />
  );

  expect(screen.getByTestId("loader-icon")).toBeDefined();
});

test("ToolInvocationBadge: state=result with truthy result shows green dot", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "src/Button.tsx" },
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(screen.queryByTestId("loader-icon")).toBeNull();
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge: state=result with null result shows loader", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {},
        state: "result",
        result: null,
      }}
    />
  );

  expect(screen.getByTestId("loader-icon")).toBeDefined();
});

test("ToolInvocationBadge: label is rendered in DOM", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "src/Button.tsx" },
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge: container has correct classes", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: {},
        state: "call",
      }}
    />
  );

  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.className).toContain("inline-flex");
  expect(wrapper.className).toContain("bg-neutral-50");
  expect(wrapper.className).toContain("rounded-lg");
});
