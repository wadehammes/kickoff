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
  cache?: RequestCache;
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
  cache,
  headers,
  method = FetchMethods.Post,
  authKey,
}: FetchOptions): RequestInit => {
  const authorization: Record<string, string> = authKey
    ? { Authorization: \`Bearer \${authKey}\` }
    : {};

  return {
    body,
    cache,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
      ...authorization,
      ...headers,
    },
    method,
  };
};

const fetchResponse = async <T>(endpoint: Promise<Response>): Promise<T> => {
  const res = await endpoint;

  return res.json() as Promise<T>;
};

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const fetchJsonResponse = async <T>(
  endpoint: Promise<Response>,
): Promise<T> => {
  const res = await endpoint;
  const payload = await fetchResponse<T & { error?: string }>(
    Promise.resolve(res),
  );

  if (!res.ok) {
    throw new ApiError(payload.error ?? "Request failed");
  }

  return payload;
};
`;
};

// ---------------------------------------------------------------------------
// src/api/urls.ts
// ---------------------------------------------------------------------------

export const getApiUrls = (): string => {
  return `import type {
  DeployActiveInput,
  DeployActiveResponse,
  DeployStatusInput,
  DeployStatusResponse,
  DeployTriggerInput,
  DeployTriggerResponse,
} from "src/api/deploy.types";
import { FetchMethods, fetchJsonResponse, fetchOptions } from "src/api/helpers";

const buildDeploySearchParams = (
  base: Record<string, string>,
  token?: string,
): string => {
  const params = new URLSearchParams(base);

  if (token) {
    params.set("token", token);
  }

  return params.toString();
};

export const api = {
  deploy: {
    active: ({ target, token }: DeployActiveInput) =>
      fetchJsonResponse<DeployActiveResponse>(
        fetch(
          \`/api/refresh-content/deploy/active?\${buildDeploySearchParams({ target }, token)}\`,
          fetchOptions({ cache: "no-store", method: FetchMethods.Get }),
        ),
      ),
    status: ({
      createdAt,
      deployHookId,
      projectId,
      target,
      token,
    }: DeployStatusInput) =>
      fetchJsonResponse<DeployStatusResponse>(
        fetch(
          \`/api/refresh-content/deploy/status?\${buildDeploySearchParams(
            {
              deployHookId,
              projectId,
              since: String(createdAt),
              target,
            },
            token,
          )}\`,
          fetchOptions({ cache: "no-store", method: FetchMethods.Get }),
        ),
      ),
    trigger: ({ target, token }: DeployTriggerInput) =>
      fetchJsonResponse<DeployTriggerResponse>(
        fetch(
          "/api/refresh-content/deploy",
          fetchOptions({
            body: JSON.stringify({ target, token }),
            method: FetchMethods.Post,
          }),
        ),
      ),
  },
};
`;
};
