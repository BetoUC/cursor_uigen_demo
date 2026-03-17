"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "@ai-sdk/ui-utils";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

export function getToolLabel(
  toolName: string,
  args: Record<string, string> | undefined
): string {
  const fileName = args?.path?.split("/").pop() ?? args?.old_path?.split("/").pop();
  const command = args?.command;

  if (toolName === "file_manager") {
    return command === "delete"
      ? `Deleting ${fileName ?? "file"}`
      : `Renaming ${fileName ?? "file"}`;
  }

  if (fileName) {
    if (command === "create") return `Creating ${fileName}`;
    if (command === "str_replace" || command === "insert") return `Editing ${fileName}`;
    if (command === "view") return `Reading ${fileName}`;
  }

  return "Updating component";
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const args = toolInvocation.args as Record<string, string> | undefined;
  const label = getToolLabel(toolInvocation.toolName, args);
  const done = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      <span className="text-neutral-600">{label}</span>
    </div>
  );
}
