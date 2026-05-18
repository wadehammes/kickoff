// ---------------------------------------------------------------------------
// src/api/helpers.ts
// ---------------------------------------------------------------------------

export const getApiHelpers = (): string => {
  return `export const FetchMethods = {
  Get: "GET",
  Post: "POST",
  Put: "PUT",
  Patch: "PATCH",
  Delete: "DELETE",
} as const;
export type FetchMethod = (typeof FetchMethods)[keyof typeof FetchMethods];

export interface FetchOptions {
  body?: string;
  method?: FetchMethod;
  headers?: Record<string, string>;
  authKey?: string;
}

export interface PaginationResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const fetchOptions = ({
  body,
  headers,
  method = FetchMethods.Post,
  authKey,
}: FetchOptions): RequestInit => {
  const authorization: Record<string, string> = authKey
    ? { Authorization: \`Bearer \${authKey}\` }
    : {};

  return {
    body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
      ...authorization,
      ...headers,
    },
    method,
  };
};

export const fetchResponse = async <T>(
  endpoint: Promise<Response>,
): Promise<T> => {
  const res = await endpoint;

  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  }

  return res.json() as Promise<T>;
};
`;
};

// ---------------------------------------------------------------------------
// src/api/urls.ts
// ---------------------------------------------------------------------------

export const getApiUrls = (): string => {
  return `// Define your API URL helpers here.
// Example:
//
// import { fetchOptions, fetchResponse, FetchMethods } from "src/api/helpers";
//
// export const api = {
//   exampleGet: (id: string) =>
//     fetchResponse<{ id: string }>(
//       fetch(\`/api/example/\${id}\`, fetchOptions({ method: FetchMethods.Get })),
//     ),
// };
`;
};
