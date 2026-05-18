import type { ProjectAnswers } from "../types.js";

export const getGlobalsCSS = (_a: ProjectAnswers): string => {
  return `@import url("./variables.css");

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
div,
span,
applet,
object,
iframe,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video,
button,
input {
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  font-size: 100%;
  vertical-align: baseline;
}

html,
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-family-text, sans-serif);
  font-weight: normal;
  font-style: normal;
  font-size: 14px;
  min-height: 100vh;
  position: relative;

  @media (width >= 600px) {
    font-size: 16px;
  }
}

html {
  height: stretch;
  scroll-behavior: smooth;
}

body {
  line-height: 1;
  min-height: 100svh;
  overflow-x: hidden;
  padding: 0;
  position: relative;
}

.draftMode {
  background-color: #60140a;
  border-radius: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  gap: 1rem;
  padding: var(--default-padding);
  position: fixed;
  right: var(--default-padding);
  bottom: var(--default-padding);
  z-index: 99;
  color: #fff;
}

.page {
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
  gap: var(--default-padding);
  margin: 0 auto;
  min-height: 100vh;
  overflow-x: hidden;
}

.page-content {
  background: var(--color-bg);
  position: relative;
  z-index: 1;
  overflow: hidden;
  flex: 1;
  padding-top: 100px;
}

img,
video {
  width: 100%;
  max-width: 100%;
  height: auto;
}

a {
  color: currentcolor;
  font-family: inherit;
  text-decoration: underline;
  font-weight: normal;

  &:hover,
  &:focus {
    outline: 0;
    color: var(--color-primary);
  }
}

[hidden],
.hidden {
  display: none;
}

strong,
b {
  font-weight: 700;
}

.container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-flow: row nowrap;
  max-width: 1660px;
  margin: 0 auto;
  gap: var(--default-padding);
  width: 100%;
  padding: 0 var(--default-padding);
  position: relative;
  z-index: 1;

  &.column {
    align-items: flex-start;
    justify-content: flex-start;
    flex-flow: column nowrap;
  }
}

.page-container {
  padding: 0 0 var(--default-padding);
  width: 100%;
}

.page-header {
  margin: auto;
  position: relative;
  z-index: 2;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--default-padding);
  width: 100%;
  max-width: 140ch;
  color: var(--color-text);
  padding-bottom: var(--default-padding);

  h1 {
    font-size: clamp(2rem, 10vw, 5rem);
    line-height: 1.1;
  }

  @media (width >= 768px) {
    padding-bottom: 4rem;
  }
}

.section-header {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  gap: var(--default-padding);
  max-width: 80ch;
  text-wrap: balance;
  margin: 0 auto 2rem;
  text-align: center;

  &.left {
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
  }

  &.right {
    align-items: flex-end;
    justify-content: flex-end;
    text-align: right;
  }

  @media screen and (width >= 768px) {
    margin-bottom: 4rem;
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: currentcolor;
  font-weight: 700;
  position: relative;
  text-wrap: balance;
  z-index: 1;
}

h1 {
  font-size: clamp(2.25rem, 5vw, 5rem);
}

h2 {
  font-size: clamp(2rem, 5vw, 4rem);
}

h3 {
  font-size: clamp(0.8rem, 3vw, 1rem);
}

p {
  color: currentcolor;
}

i {
  font-style: italic;
}

p:empty {
  display: none;
}

.grecaptcha-badge {
  visibility: hidden;
}

.skeleton {
  display: block;
  height: 1.5em;
  position: relative;
  overflow: hidden;
  background-color: lightgray;
  width: 100%;
  animation: shimmer 0.5s infinite alternate
    cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 20px;
}

::selection {
  color: var(--color-bg);
  background-color: var(--color-primary);
}

.loading-container {
  align-items: center;
  display: flex;
  height: 100vh;
  justify-content: center;
  width: 100%;
}

.loading-spinner {
  animation: spin 1s linear infinite;
  border: 2px solid transparent;
  border-top-color: currentcolor;
  border-radius: 50%;
  height: 40px;
  width: 40px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  from {
    opacity: 0.5;
  }

  to {
    opacity: 1;
  }
}
`;
};

export const getVariablesCSS = (a: ProjectAnswers): string => {
  return `:root {
  --color-primary: ${a.primaryColor};
  --color-bg: ${a.bgColor};
  --color-text: ${a.textColor};
  --font-family-text: sans-serif;
  --font-family-heading: serif;
  --default-padding: 1.25rem;
  --gap: 2rem;

  @media screen and (width >= 600px) {
    --default-padding: 2rem;
    --gap: 4rem;
  }
}
`;
};

export const getRuntimeVariablesJson = (): string => {
  return "{}\n";
};
