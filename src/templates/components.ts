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
        <Link href="/" className={styles.logo} title="${a.siteName}" aria-label="${a.siteName}">
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
