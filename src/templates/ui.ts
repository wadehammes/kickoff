export const getUiReadme = (): string => {
  return `# UI primitives (\`src/ui/\`)

Shared wrappers for headless controls used by feature components in \`src/components/\`. **Base UI** (\`@base-ui/react\`) is the default headless layer.

## Conventions

- Import Base UI from **\`@base-ui/react/<module>\`** subpaths (e.g. \`@base-ui/react/dialog\`) — **never** through barrel files. See [conventions.md](../../docs/handbook/conventions.md).
- Add a folder here **only** when a primitive needs shared CSS or behavior beyond what Base UI provides out of the box.
- Style with **CSS Modules** and **design tokens** from [\`src/styles/variables.css\`](../styles/variables.css). Target Base UI **\`data-*\`** state attributes (e.g. \`[data-panel-open]\`, \`[data-disabled]\`) rather than inventing parallel state classes.
- Mark wrappers **\`"use client"\`** — Base UI components are client-only.
- **Links** — do not use Base UI \`Button\` for navigation; use \`next/link\` or styled \`<a>\` (see [Base UI Button guidelines](https://base-ui.com/react/components/button)).
- **Submit buttons** — pass \`type="submit"\` explicitly on Base UI \`Button\` (not the HTML default inside forms).

## Where things live

| Area | Import from |
|------|-------------|
| Base UI parts (\`Field\`, \`Dialog\`, \`Select\`, …) | \`@base-ui/react/<module>\` in the styled component that needs them |
| [Collapsible](./Collapsible/) | \`src/ui/Collapsible/Collapsible.component\` — panel height transition |
| [FieldErrorMessage](./Field/FieldErrorMessage.component.tsx) | Shared \`Field.Error\` wiring for form components |
| Styled forms, buttons | \`src/components/Button\`, and future form components under \`src/components/\` |

## Portal setup

Dialog and popover stacking: **\`.appRoot\`** with \`isolation: isolate\` on the layout wrapper in [\`layout.tsx\`](../app/layout.tsx).
`;
};

export const getCollapsibleComponent = (): string => {
  return `"use client";

import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import classNames from "classnames";
import type { ComponentProps } from "react";
import styles from "./Collapsible.module.css";

type RootProps = ComponentProps<typeof BaseCollapsible.Root>;
type TriggerProps = ComponentProps<typeof BaseCollapsible.Trigger>;
type PanelProps = ComponentProps<typeof BaseCollapsible.Panel>;

export const CollapsibleRoot = ({ className, ...props }: RootProps) => (
  <BaseCollapsible.Root
    className={classNames(styles.root, className)}
    {...props}
  />
);

export const CollapsibleTrigger = ({ className, ...props }: TriggerProps) => (
  <BaseCollapsible.Trigger
    className={classNames(styles.trigger, className)}
    {...props}
  />
);

export const CollapsiblePanel = ({ className, ...props }: PanelProps) => (
  <BaseCollapsible.Panel
    className={classNames(styles.panel, className)}
    {...props}
  />
);
`;
};

export const getCollapsibleCSS = (): string => {
  return `.root {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.trigger {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  gap: 1rem;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  text-align: inherit;
  width: 100%;

  &:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }

  &[data-disabled] {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.panel {
  display: flex;
  flex-direction: column;
  height: var(--collapsible-panel-height);
  overflow: hidden;
  transition: height 200ms ease-out;

  &[hidden]:not([hidden="until-found"]) {
    display: none;
  }

  &[data-starting-style],
  &[data-ending-style] {
    height: 0;
  }
}
`;
};

export const getFieldErrorMessageComponent = (): string => {
  return `"use client";

import { Field } from "@base-ui/react/field";

interface FieldErrorMessageProps {
  className?: string;
  errorMessage?: React.ReactNode;
  hasError?: { message?: string };
}

export const FieldErrorMessage = ({
  className,
  errorMessage,
  hasError,
}: FieldErrorMessageProps) => {
  if (!hasError && !errorMessage) {
    return null;
  }

  const resolvedError = errorMessage ?? hasError?.message;

  if (!resolvedError) {
    return null;
  }

  return (
    <Field.Error className={className} match={Boolean(hasError)}>
      {resolvedError}
    </Field.Error>
  );
};
`;
};
