"use client";

import { forwardRef } from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

const Collapsible = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>((props, ref) => {
  return <CollapsiblePrimitive.Root ref={ref} data-slot="collapsible" {...props} />;
});

Collapsible.displayName = "Collapsible";

const CollapsibleTrigger = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger>
>((props, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      ref={ref}
      data-slot="collapsible-trigger"
      {...props}
    />
  );
});

CollapsibleTrigger.displayName = "CollapsibleTrigger";

const CollapsibleContent = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>((props, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      ref={ref}
      data-slot="collapsible-content"
      {...props}
    />
  );
});

CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
