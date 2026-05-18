// ---------------------------------------------------------------------------
// src/@types/react.d.ts
// ---------------------------------------------------------------------------

export const getTypesReactDts = (): string => {
  return `export type PropsWithChildrenOnly = React.PropsWithChildren<unknown>;
  `;
};

// ---------------------------------------------------------------------------
// src/types/KeysMatch.ts
// ---------------------------------------------------------------------------

export const getKeysMatch = (): string => {
  return `export type KeysMatch<T, U> = keyof T extends keyof U
  ? keyof U extends keyof T
    ? undefined
    : never
  : never;
`;
};
