import type { ProjectAnswers } from "../types.js";

// ---------------------------------------------------------------------------
// src/components/Navigation/Navigation.component.tsx
// ---------------------------------------------------------------------------

export const getNavigationComponent = (a: ProjectAnswers): string => {
  return `"use client";

import classNames from "classnames";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./Navigation.module.css";

export const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  const listenScrollEvent = useCallback(() => {
    setScrolled(window.scrollY >= 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", listenScrollEvent, { passive: true });
    listenScrollEvent();

    return () => window.removeEventListener("scroll", listenScrollEvent);
  }, [listenScrollEvent]);

  return (
    <nav
      id="top"
      className={classNames(styles.navigation, { [styles.scrolled]: scrolled })}
    >
      <div className="container">
        <Link
          href="/"
          className={styles.logo}
          title="${a.siteName}"
          aria-label="${a.siteName}"
        >
          <span>${a.siteName}</span>
        </Link>
        <ul className={styles.navItemList}>
          {/* TODO: Add navigation items here */}
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
`;
};

// ---------------------------------------------------------------------------
// src/components/Navigation/Navigation.module.css
// ---------------------------------------------------------------------------

export const getNavigationCSS = (): string => {
  return `.navigation {
  background: var(--color-bg);
  position: fixed;
  width: 100%;
  z-index: 99;
  transition: background 0.25s linear;
  padding: 1.5rem 0;
}

.scrolled {
  background-color: color-mix(in srgb, var(--color-bg) 80%, transparent);
  backdrop-filter: blur(8px);
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
}

.navItemList {
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  list-style-type: none;
  gap: var(--default-padding);
  font-size: 0.9rem;
  display: flex;
  width: 100%;
}
`;
};

// ---------------------------------------------------------------------------
// src/components/Footer/Footer.component.tsx
// ---------------------------------------------------------------------------

export const getFooterComponent = (a: ProjectAnswers): string => {
  return `import styles from "./Footer.module.css";

export const Footer = () => (
  <footer className={styles.footer}>
    <div className="container">
      <span className={styles.copyright}>
        &copy; {new Date().getFullYear()} ${a.siteName}
      </span>
    </div>
  </footer>
);

export default Footer;
`;
};

// ---------------------------------------------------------------------------
// src/components/Footer/Footer.module.css
// ---------------------------------------------------------------------------

export const getFooterCSS = (): string => {
  return `.footer {
  align-items: flex-start;
  bottom: 0;
  display: flex;
  flex-flow: column nowrap;
  padding: var(--default-padding) 0;
  position: relative;
  width: 100%;
  z-index: 1;
}

.copyright {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  flex: 1;
  line-height: 1.25;
  font-size: 0.875rem;
  opacity: 0.7;
}
`;
};

// ---------------------------------------------------------------------------
// src/components/ExitDraftModeLink/ExitDraftModeLink.component.tsx
// ---------------------------------------------------------------------------

export const getExitDraftModeLink = (): string => {
  return `"use client";

import { usePathname } from "next/navigation";
import type { HTMLProps } from "react";

export const ExitDraftModeLink = (props: HTMLProps<HTMLAnchorElement>) => {
  const pathname = usePathname();

  return (
    <a href={\`/api/disable-draft?redirect=\${pathname}\`} {...props}>
      Exit Draft Mode
    </a>
  );
};

export default ExitDraftModeLink;
`;
};

// ---------------------------------------------------------------------------
// src/components/NotFoundPage/NotFoundPage.component.tsx
// ---------------------------------------------------------------------------

export const getNotFoundPageComponent = (): string => {
  return `import Link from "next/link";
import styles from "./NotFoundPage.module.css";

export const NotFoundPage = () => (
  <div className={styles.container}>
    <h1 className={styles.heading}>404</h1>
    <p className={styles.message}>
      Sorry, we couldn&apos;t find the page you were looking for.
    </p>
    <Link href="/" className={styles.link}>
      Go back home
    </Link>
  </div>
);

export default NotFoundPage;
`;
};

// ---------------------------------------------------------------------------
// src/components/NotFoundPage/NotFoundPage.module.css
// ---------------------------------------------------------------------------

export const getNotFoundPageCSS = (): string => {
  return `.container {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
  text-align: center;
}

.heading {
  font-size: clamp(4rem, 15vw, 10rem);
  font-weight: 900;
  line-height: 1;
  opacity: 0.15;
}

.message {
  font-size: 1.25rem;
  max-width: 40ch;
  line-height: 1.5;
}

.link {
  border: 1px solid currentcolor;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  text-decoration: none;

  &:hover {
    opacity: 0.8;
  }
}
`;
};

// ---------------------------------------------------------------------------
// src/components/Button/Button.component.tsx
// ---------------------------------------------------------------------------

export const getButtonComponent = (): string => {
  return `"use client";

import { Button as UIButton } from "@base-ui/react/button";
import classNames from "classnames";
import type { ComponentProps } from "react";
import styles from "./Button.module.css";

interface ButtonProps
  extends Omit<ComponentProps<typeof UIButton>, "children"> {
  children?: React.ReactNode;
  isDisabled?: boolean;
  label: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline";
}

export const Button = (props: ButtonProps) => {
  const {
    children: _children,
    disabled,
    isDisabled,
    label,
    type = "button",
    variant = "primary",
    ...rest
  } = props;

  return (
    <UIButton
      className={classNames(styles.button, {
        [styles.outline]: variant === "outline",
        [styles.secondary]: variant === "secondary",
      })}
      disabled={disabled ?? isDisabled}
      type={type}
      {...rest}
    >
      {label}
    </UIButton>
  );
};

export default Button;
`;
};

// ---------------------------------------------------------------------------
// src/components/Button/Button.module.css
// ---------------------------------------------------------------------------

export const getButtonCSS = (): string => {
  return `.button {
  align-items: center;
  background-color: var(--color-primary);
  border: 1px solid transparent;
  border-radius: 1000px;
  color: var(--color-bg);
  display: flex;
  flex-flow: row nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.05em;
  outline: 1px solid transparent;
  outline-offset: 1px;
  padding: 1rem 1.75rem;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
  transition: all 0.2s ease-in-out;

  &[disabled] {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }

  &:hover,
  &:focus {
    cursor: pointer;
    outline: 1px solid var(--color-primary);
    outline-offset: 2px;
  }

  &.outline {
    background-color: transparent;
    border-color: var(--color-text);
    color: var(--color-text);

    &:hover {
      background-color: var(--color-bg);
      color: var(--color-text);
    }
  }

  &.secondary {
    background-color: var(--color-bg);
    border-color: var(--color-primary);
    color: var(--color-text);

    &:hover {
      background-color: var(--color-primary);
      color: var(--color-bg);
    }
  }
}
`;
};

// ---------------------------------------------------------------------------
// src/lib/toast/appToast.ts
// ---------------------------------------------------------------------------

export const getAppToast = (): string => {
  return `import { Toast } from "@base-ui/react/toast";

export const APP_TOAST_LIMIT = 3;
export const APP_TOAST_TIMEOUT_MS = 5_000;

export const appToastManager = Toast.createToastManager();

type AppToastOptions = {
  id?: string;
};

type AppToastType = "error" | "success" | "warning";

const showAppToast = (
  type: AppToastType,
  message: string,
  options?: AppToastOptions,
) =>
  appToastManager.add({
    id: options?.id,
    priority: type === "error" ? "high" : "low",
    title: message,
    type,
  });

export const appToast = {
  error: (message: string, options?: AppToastOptions) =>
    showAppToast("error", message, options),
  success: (message: string, options?: AppToastOptions) =>
    showAppToast("success", message, options),
  warning: (message: string, options?: AppToastOptions) =>
    showAppToast("warning", message, options),
};
`;
};

// ---------------------------------------------------------------------------
// src/components/Toast/ToastHost.component.tsx
// ---------------------------------------------------------------------------

export const getToastHostComponent = (): string => {
  return `"use client";

import { Toast } from "@base-ui/react/toast";
import type { PropsWithChildrenOnly } from "src/@types/react";
import styles from "src/components/Toast/ToastHost.module.css";
import {
  APP_TOAST_LIMIT,
  APP_TOAST_TIMEOUT_MS,
  appToastManager,
} from "src/lib/toast/appToast";

const ToastList = () => {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toastItem) => (
    <Toast.Root
      className={styles.toast}
      key={toastItem.id}
      swipeDirection={["down", "right"]}
      toast={toastItem}
    >
      <Toast.Content className={styles.content}>
        <Toast.Title className={styles.title} />
        <Toast.Close aria-label="Close notification" className={styles.close} />
      </Toast.Content>
    </Toast.Root>
  ));
};

export const ToastHost = ({ children }: PropsWithChildrenOnly) => (
  <Toast.Provider
    limit={APP_TOAST_LIMIT}
    timeout={APP_TOAST_TIMEOUT_MS}
    toastManager={appToastManager}
  >
    {children}
    <Toast.Portal>
      <Toast.Viewport className={styles.viewport}>
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  </Toast.Provider>
);

export default ToastHost;
`;
};

export const getToastHostCSS = (): string => {
  return `.viewport {
  position: fixed;
  top: var(--toast-offset);
  left: 50%;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: var(--toast-width);
  max-width: calc(100vw - 2rem);
  padding: 0;
  margin: 0;
  pointer-events: none;
  list-style: none;
  transform: translateX(-50%);
}

.toast {
  --toast-bg: var(--color-toast-default-bg);
  --toast-text: var(--color-toast-default-text);

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.625rem 2rem;
  font-family: var(--font-family-text);
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.35;
  color: var(--toast-text);
  pointer-events: auto;
  background-color: var(--toast-bg);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--color-toast-shadow);
}

.toast[data-type="success"] {
  --toast-bg: var(--color-toast-success-bg);
  --toast-text: var(--color-toast-success-text);
}

.toast[data-type="error"] {
  --toast-bg: var(--color-toast-error-bg);
  --toast-text: var(--color-toast-error-text);
}

.toast[data-type="warning"] {
  --toast-bg: var(--color-toast-warning-bg);
  --toast-text: var(--color-toast-warning-text);
}

.content {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.title {
  margin: 0;
  font: inherit;
  text-align: center;
  text-wrap: balance;
}

.close {
  position: absolute;
  top: 50%;
  right: 0.375rem;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  color: var(--toast-text);
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 4px;
  opacity: 0.65;
  transform: translateY(-50%);
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 1px solid rgb(255 255 255 / 35%);
    outline-offset: 1px;
    opacity: 1;
  }
}
`;
};
