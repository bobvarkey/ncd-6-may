import { cn } from "@/lib/utils";

/**
 * Layout classes for custom header tab strips.
 * Colour (peach / amber / magenta / teal / violet) comes from index.css
 * via .header-tablist > .header-tab and data-active="true".
 */
export const headerTabListClass =
  "header-tablist flex w-full max-w-full min-w-0 flex-wrap items-center gap-1.5";

export function headerTabClass(className?: string) {
  return cn(
    "header-tab inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    className,
  );
}
