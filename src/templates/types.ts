// ---------------------------------------------------------------------------
// src/@types/react.d.ts
// ---------------------------------------------------------------------------

export function getTypesReactDts(): string {
  return `export type PropsWithChildrenOnly = React.PropsWithChildren<unknown>;
  `;
}

// ---------------------------------------------------------------------------
// src/types/KeysMatch.ts
// ---------------------------------------------------------------------------

export function getKeysMatch(): string {
  return `export type KeysMatch<T, U> = keyof T extends keyof U
  ? keyof U extends keyof T
    ? undefined
    : never
  : never;
`;
}
