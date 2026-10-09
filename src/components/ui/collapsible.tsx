import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ResultExport, useClinicalExport } from "@/components/ResultExport";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ children, ...props }, ref) => {
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const clinicalExport = useClinicalExport();
  return (
    <CollapsiblePrimitive.Content {...props} ref={(node) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }}>
      {clinicalExport && <ResultExport getRoot={() => localRef.current} />}
      {children}
    </CollapsiblePrimitive.Content>
  );
});
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
