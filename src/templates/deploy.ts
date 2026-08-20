import type { ProjectAnswers } from "../types.js";

const stagingHost = (a: ProjectAnswers): string => {
  try {
    return new URL(a.stagingUrl).host;
  } catch {
    return a.stagingUrl;
  }
};

const prodHost = (a: ProjectAnswers): string => {
  try {
    return new URL(a.prodUrl).host;
  } catch {
    return a.prodUrl;
  }
};

export const getDeployTypes = (): string => {
  return `import type { DeployTarget } from "src/lib/refreshContentAccess";
import type { DeployMonitorStatus } from "src/lib/vercelDeploymentStatus";

export interface DeployTriggerInput {
  target: DeployTarget;
  token?: string;
}

export interface DeployTriggerResponse {
  createdAt: number;
  deployHookId: string;
  ok: true;
  projectId: string;
}

export interface DeployStatusInput {
  createdAt: number;
  deployHookId: string;
  projectId: string;
  target: DeployTarget;
  token?: string;
}

export interface DeployStatusResponse {
  monitoring: boolean;
  status: DeployMonitorStatus;
}

export interface DeployActiveInput {
  target: DeployTarget;
  token?: string;
}

export type DeployActiveResponse =
  | { active: false }
  | {
      active: true;
      createdAt: number;
      deployHookId: string;
      projectId: string;
    };
`;
};

export const getRefreshContentAccess = (): string => {
  return `export const isRefreshContentAuthorized = (
  token: string | undefined,
): boolean => {
  const accessToken = process.env.REFRESH_CONTENT_ACCESS_TOKEN?.trim();

  if (!accessToken) {
    return process.env.ENVIRONMENT === "local";
  }

  return token === accessToken;
};

export type DeployTarget = "staging" | "production";

export const parseDeployTarget = (
  value: string | null | undefined,
): DeployTarget | null => {
  if (value === "staging" || value === "production") {
    return value;
  }

  return null;
};

export const parseDeployHookUrl = (
  hookUrl: string,
): { deployHookId: string; projectId: string } | null => {
  const match = hookUrl.match(/\\/integrations\\/deploy\\/([^/]+)\\/([^/?#]+)/);

  if (!match) {
    return null;
  }

  return {
    deployHookId: match[2],
    projectId: match[1],
  };
};

export const getDeployHookUrl = (target: DeployTarget): string | null => {
  if (target === "staging") {
    return process.env.VERCEL_DEPLOY_HOOK_STAGING?.trim() || null;
  }

  return process.env.VERCEL_DEPLOY_HOOK_PRODUCTION?.trim() || null;
};

export const resolveDeployHookMetadata = (
  target: DeployTarget,
): { deployHookId: string; projectId: string } | null => {
  const hookUrl = getDeployHookUrl(target);

  if (!hookUrl) {
    return null;
  }

  return parseDeployHookUrl(hookUrl);
};
`;
};

export const getRefreshContentAccessSpec = (): string => {
  return `import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import {
  getDeployHookUrl,
  isRefreshContentAuthorized,
  parseDeployHookUrl,
  parseDeployTarget,
  resolveDeployHookMetadata,
} from "src/lib/refreshContentAccess";

describe("refreshContentAccess", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isRefreshContentAuthorized", () => {
    it("allows local access when no access token is configured", () => {
      delete process.env.REFRESH_CONTENT_ACCESS_TOKEN;
      process.env.ENVIRONMENT = "local";

      expect(isRefreshContentAuthorized(undefined)).toBe(true);
    });

    it("requires a matching token when configured", () => {
      process.env.REFRESH_CONTENT_ACCESS_TOKEN = "secret-token";
      process.env.ENVIRONMENT = "staging";

      expect(isRefreshContentAuthorized("secret-token")).toBe(true);
      expect(isRefreshContentAuthorized("wrong-token")).toBe(false);
    });
  });

  describe("getDeployHookUrl", () => {
    it("reads deploy hooks from environment variables", () => {
      process.env.VERCEL_DEPLOY_HOOK_STAGING = "https://example.com/staging";
      process.env.VERCEL_DEPLOY_HOOK_PRODUCTION =
        "https://example.com/production";

      expect(getDeployHookUrl("staging")).toBe("https://example.com/staging");
      expect(getDeployHookUrl("production")).toBe(
        "https://example.com/production",
      );
    });
  });

  describe("parseDeployTarget", () => {
    it("accepts staging and production targets", () => {
      expect(parseDeployTarget("staging")).toBe("staging");
      expect(parseDeployTarget("production")).toBe("production");
      expect(parseDeployTarget("preview")).toBeNull();
    });
  });

  describe("parseDeployHookUrl", () => {
    it("extracts project and hook ids from deploy hook urls", () => {
      expect(
        parseDeployHookUrl(
          "https://api.vercel.com/v1/integrations/deploy/prj_test/KMXxoK51Xj",
        ),
      ).toEqual({
        deployHookId: "KMXxoK51Xj",
        projectId: "prj_test",
      });
    });
  });

  describe("resolveDeployHookMetadata", () => {
    it("combines hook url lookup and parsing", () => {
      process.env.VERCEL_DEPLOY_HOOK_STAGING =
        "https://api.vercel.com/v1/integrations/deploy/prj_test/hook123";

      expect(resolveDeployHookMetadata("staging")).toEqual({
        deployHookId: "hook123",
        projectId: "prj_test",
      });
    });
  });
});
`;
};

export const getDeployProgressStorage = (): string => {
  return `import type { DeployTarget } from "src/lib/refreshContentAccess";
import type { DeployMonitorStatus } from "src/lib/vercelDeploymentStatus";

const DEPLOY_STATUS_PREFIX: Record<DeployMonitorStatus, string> = {
  building: "Building",
  canceled: "Canceled",
  error: "Failed",
  pending: "Starting",
  queued: "Queued",
  ready: "Complete",
  unknown: "In progress",
};

const DEPLOY_STATUS_RANK: Record<DeployMonitorStatus, number> = {
  building: 3,
  canceled: 5,
  error: 5,
  pending: 0,
  queued: 2,
  ready: 4,
  unknown: 1,
};

export const furthestDeployStatus = (
  current: DeployMonitorStatus,
  next: DeployMonitorStatus,
): DeployMonitorStatus => {
  return DEPLOY_STATUS_RANK[next] >= DEPLOY_STATUS_RANK[current]
    ? next
    : current;
};

export const DEPLOY_POLL_TIMEOUT_MS = 20 * 60 * 1_000;
export const DEPLOY_ESTIMATED_MS = 2 * 60 * 1_000;

export interface StoredDeployProgress {
  createdAt: number;
  deployHookId: string;
  projectId: string;
  startedAt: number;
  target: DeployTarget;
}

const storageKey = (target: DeployTarget): string =>
  \`refresh-content-deploy:\${target}\`;

const isStoredDeployProgress = (
  value: unknown,
): value is StoredDeployProgress => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as StoredDeployProgress;

  return (
    typeof record.createdAt === "number" &&
    typeof record.deployHookId === "string" &&
    typeof record.projectId === "string" &&
    typeof record.startedAt === "number" &&
    (record.target === "staging" || record.target === "production")
  );
};

export const isDeployProgressExpired = (
  startedAt: number,
  timeoutMs = DEPLOY_POLL_TIMEOUT_MS,
): boolean => {
  return Date.now() - startedAt >= timeoutMs;
};

export const formatDeployElapsed = (elapsedMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return \`\${minutes}:\${String(seconds).padStart(2, "0")}\`;
};

export const formatDeployProgressLabel = (
  elapsedMs: number,
  status: DeployMonitorStatus,
): string => {
  return \`\${DEPLOY_STATUS_PREFIX[status]} (\${formatDeployElapsed(elapsedMs)})\`;
};

export const readDeployProgress = (
  target: DeployTarget,
): StoredDeployProgress | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedProgressJson = window.localStorage.getItem(storageKey(target));

    if (!storedProgressJson) {
      return null;
    }

    const storedProgress: unknown = JSON.parse(storedProgressJson);

    if (
      !isStoredDeployProgress(storedProgress) ||
      storedProgress.target !== target
    ) {
      return null;
    }

    if (isDeployProgressExpired(storedProgress.startedAt)) {
      window.localStorage.removeItem(storageKey(target));
      return null;
    }

    return storedProgress;
  } catch {
    return null;
  }
};

export const writeDeployProgress = (progress: StoredDeployProgress): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey(progress.target),
    JSON.stringify(progress),
  );
};

export const clearDeployProgress = (target: DeployTarget): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey(target));
};
`;
};

export const getDeployProgressStorageSpec = (): string => {
  return `import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import {
  clearDeployProgress,
  DEPLOY_POLL_TIMEOUT_MS,
  formatDeployElapsed,
  formatDeployProgressLabel,
  furthestDeployStatus,
  readDeployProgress,
  writeDeployProgress,
} from "src/lib/deployProgressStorage";

describe("deployProgressStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("persists and reads deploy progress per target", () => {
    writeDeployProgress({
      createdAt: 1_000,
      deployHookId: "hook-b",
      projectId: "prj_test",
      startedAt: Date.now(),
      target: "staging",
    });

    expect(readDeployProgress("staging")).toEqual(
      expect.objectContaining({
        deployHookId: "hook-b",
        target: "staging",
      }),
    );
    expect(readDeployProgress("production")).toBeNull();
  });

  it("clears expired deploy progress", () => {
    writeDeployProgress({
      createdAt: 1_000,
      deployHookId: "hook-b",
      projectId: "prj_test",
      startedAt: Date.now() - DEPLOY_POLL_TIMEOUT_MS - 1,
      target: "staging",
    });

    expect(readDeployProgress("staging")).toBeNull();
  });

  it("clears stored deploy progress", () => {
    writeDeployProgress({
      createdAt: 1_000,
      deployHookId: "hook-b",
      projectId: "prj_test",
      startedAt: Date.now(),
      target: "production",
    });

    clearDeployProgress("production");

    expect(readDeployProgress("production")).toBeNull();
  });

  it("formats elapsed deploy time as m:ss", () => {
    expect(formatDeployElapsed(0)).toBe("0:00");
    expect(formatDeployElapsed(65_000)).toBe("1:05");
  });

  it("formats deploy progress labels from vercel status", () => {
    expect(formatDeployProgressLabel(65_000, "building")).toBe(
      "Building (1:05)",
    );
    expect(formatDeployProgressLabel(0, "pending")).toBe("Starting (0:00)");
    expect(formatDeployProgressLabel(1_000, "unknown")).toBe(
      "In progress (0:01)",
    );
  });

  it("advances deploy status monotonically", () => {
    expect(furthestDeployStatus("pending", "building")).toBe("building");
    expect(furthestDeployStatus("building", "queued")).toBe("building");
    expect(furthestDeployStatus("building", "unknown")).toBe("building");
    expect(furthestDeployStatus("pending", "unknown")).toBe("unknown");
  });
});
`;
};

export const getVercelDeploymentStatus = (): string => {
  return `export type DeployMonitorStatus =
  | "pending"
  | "queued"
  | "building"
  | "ready"
  | "error"
  | "canceled"
  | "unknown";

interface VercelDeploymentSummary {
  createdAt?: number;
  meta?: {
    deployHookId?: string;
  };
  readyState?: string;
  url?: string;
}

interface VercelDeploymentsResponse {
  deployments?: VercelDeploymentSummary[];
}

const IN_PROGRESS_READY_STATES = new Set([
  "BUILDING",
  "INITIALIZING",
  "QUEUED",
]);

const listProjectDeployments = async (
  projectId: string,
  token: string,
): Promise<VercelDeploymentSummary[]> => {
  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("limit", "20");

  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  const teamSlug = process.env.VERCEL_TEAM_SLUG?.trim();

  if (teamId) {
    url.searchParams.set("teamId", teamId);
  } else if (teamSlug) {
    url.searchParams.set("slug", teamSlug);
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as VercelDeploymentsResponse;

  return payload.deployments ?? [];
};

const getVercelApiToken = (): string | null =>
  process.env.VERCEL_API_TOKEN?.trim() || null;

export const mapVercelReadyState = (
  readyState: string | undefined,
): DeployMonitorStatus => {
  switch (readyState) {
    case "QUEUED":
    case "INITIALIZING":
      return "queued";
    case "BUILDING":
      return "building";
    case "READY":
      return "ready";
    case "ERROR":
    case "BLOCKED":
      return "error";
    case "CANCELED":
    case "DELETED":
      return "canceled";
    default:
      return "pending";
  }
};

export const findMatchingDeployment = (
  deployments: VercelDeploymentSummary[],
  deployHookId: string,
  since: number,
): VercelDeploymentSummary | null => {
  const sinceThreshold = since - 60_000;

  return (
    deployments.find((deployment) => {
      if (deployment.meta?.deployHookId !== deployHookId) {
        return false;
      }

      if (typeof deployment.createdAt !== "number") {
        return false;
      }

      return deployment.createdAt >= sinceThreshold;
    }) ?? null
  );
};

export const findActiveDeployment = (
  deployments: VercelDeploymentSummary[],
  deployHookId: string,
): VercelDeploymentSummary | null => {
  return (
    deployments.find((deployment) => {
      if (deployment.meta?.deployHookId !== deployHookId) {
        return false;
      }

      if (!deployment.readyState) {
        return false;
      }

      return IN_PROGRESS_READY_STATES.has(deployment.readyState);
    }) ?? null
  );
};

export type ActiveDeployProgress =
  | { active: false }
  | {
      active: true;
      createdAt: number;
      deployHookId: string;
      projectId: string;
    };

export const fetchActiveDeployProgress = async (options: {
  deployHookId: string;
  projectId: string;
}): Promise<ActiveDeployProgress> => {
  const token = getVercelApiToken();

  if (!token) {
    return { active: false };
  }

  const deployments = await listProjectDeployments(options.projectId, token);
  const deployment = findActiveDeployment(deployments, options.deployHookId);

  if (!deployment || typeof deployment.createdAt !== "number") {
    return { active: false };
  }

  return {
    active: true,
    createdAt: deployment.createdAt,
    deployHookId: options.deployHookId,
    projectId: options.projectId,
  };
};

export const fetchDeploymentStatus = async (options: {
  deployHookId: string;
  projectId: string;
  since: number;
}): Promise<{
  monitoring: boolean;
  status: DeployMonitorStatus;
}> => {
  const token = getVercelApiToken();

  if (!token) {
    return { monitoring: false, status: "unknown" };
  }

  const deployments = await listProjectDeployments(options.projectId, token);
  const deployment = findMatchingDeployment(
    deployments,
    options.deployHookId,
    options.since,
  );

  if (!deployment) {
    return { monitoring: true, status: "pending" };
  }

  const status = mapVercelReadyState(deployment.readyState);

  return {
    monitoring: true,
    status,
  };
};
`;
};

export const getVercelDeploymentStatusSpec = (): string => {
  return `import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import {
  findActiveDeployment,
  findMatchingDeployment,
  mapVercelReadyState,
} from "src/lib/vercelDeploymentStatus";

describe("vercelDeploymentStatus", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("mapVercelReadyState", () => {
    it("maps vercel deployment states to monitor statuses", () => {
      expect(mapVercelReadyState("QUEUED")).toBe("queued");
      expect(mapVercelReadyState("BUILDING")).toBe("building");
      expect(mapVercelReadyState("READY")).toBe("ready");
      expect(mapVercelReadyState("ERROR")).toBe("error");
      expect(mapVercelReadyState("CANCELED")).toBe("canceled");
    });
  });

  describe("findMatchingDeployment", () => {
    it("finds the deployment created after the hook trigger", () => {
      const deployments = [
        {
          createdAt: 100,
          meta: { deployHookId: "hook-a" },
          readyState: "READY",
        },
        {
          createdAt: 1_000,
          meta: { deployHookId: "hook-b" },
          readyState: "BUILDING",
        },
      ];

      expect(findMatchingDeployment(deployments, "hook-b", 950)).toEqual(
        deployments[1],
      );
    });

    it("finds hook deployments when the job timestamp is after deployment createdAt", () => {
      const deployments = [
        {
          createdAt: 1_000,
          meta: { deployHookId: "hook-b" },
          readyState: "READY",
        },
      ];

      expect(findMatchingDeployment(deployments, "hook-b", 12_000)).toEqual(
        deployments[0],
      );
    });
  });

  describe("findActiveDeployment", () => {
    it("finds in-progress deployments for a deploy hook", () => {
      const deployments = [
        {
          createdAt: 100,
          meta: { deployHookId: "hook-a" },
          readyState: "READY",
        },
        {
          createdAt: 1_000,
          meta: { deployHookId: "hook-b" },
          readyState: "BUILDING",
        },
      ];

      expect(findActiveDeployment(deployments, "hook-b")).toEqual(
        deployments[1],
      );
    });
  });
});
`;
};

export const getDeployQueryKeys = (): string => {
  return `import type { StoredDeployProgress } from "src/lib/deployProgressStorage";
import type { DeployTarget } from "src/lib/refreshContentAccess";

export const deployQueryKeys = {
  active: (target: DeployTarget, accessToken?: string) =>
    [...deployQueryKeys.all, "active", target, accessToken ?? ""] as const,
  all: ["deploy"] as const,
  status: (target: DeployTarget, progress: StoredDeployProgress | null) =>
    progress
      ? ([
          ...deployQueryKeys.all,
          "status",
          target,
          progress.startedAt,
          progress.deployHookId,
        ] as const)
      : ([...deployQueryKeys.all, "status", target, "idle"] as const),
};
`;
};

export const getUseTriggerDeployMutation = (): string => {
  return `import { useMutation } from "@tanstack/react-query";
import type { DeployTriggerInput } from "src/api/deploy.types";
import { api } from "src/api/urls";

export const useTriggerDeployMutation = () => {
  return useMutation({
    mutationFn: (input: DeployTriggerInput) => api.deploy.trigger(input),
  });
};
`;
};

export const getUseDeployMonitor = (): string => {
  return `"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ApiError } from "src/api/helpers";
import { api } from "src/api/urls";
import { useTriggerDeployMutation } from "src/hooks/mutations/useTriggerDeploy.mutation";
import { deployQueryKeys } from "src/hooks/queries/deployQueryKeys";
import {
  clearDeployProgress,
  DEPLOY_ESTIMATED_MS,
  formatDeployProgressLabel,
  furthestDeployStatus,
  isDeployProgressExpired,
  readDeployProgress,
  type StoredDeployProgress,
  writeDeployProgress,
} from "src/lib/deployProgressStorage";
import type { DeployTarget } from "src/lib/refreshContentAccess";
import type { DeployMonitorStatus } from "src/lib/vercelDeploymentStatus";

const POLL_INTERVAL_MS = 5_000;

const TERMINAL_DEPLOY_STATUSES = new Set<DeployMonitorStatus>([
  "canceled",
  "error",
  "ready",
]);

interface UseDeployMonitorOptions {
  accessToken?: string;
  target: DeployTarget;
}

const deployToastId = (target: DeployTarget): string => \`deploy-\${target}\`;

const deployToastHandlers = {
  error: toast.error,
  success: toast.success,
  warning: toast.warning,
} as const;

const showDeployToast = (
  target: DeployTarget,
  message: string,
  type: keyof typeof deployToastHandlers,
) => {
  deployToastHandlers[type](message, { id: deployToastId(target) });
};

export const useDeployMonitor = ({
  accessToken,
  target,
}: UseDeployMonitorOptions) => {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<StoredDeployProgress | null>(() =>
    readDeployProgress(target),
  );
  const terminalNotificationRef = useRef<string | null>(null);
  const pendingStartedAtRef = useRef<number | null>(null);
  const progressRef = useRef<StoredDeployProgress | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [displayStatus, setDisplayStatus] =
    useState<DeployMonitorStatus>("pending");
  const triggerDeployMutation = useTriggerDeployMutation();

  progressRef.current = progress;

  const clearProgress = useCallback(() => {
    setProgress(null);
    setDisplayStatus("pending");
    pendingStartedAtRef.current = null;
    clearDeployProgress(target);
    queryClient.removeQueries({
      queryKey: deployQueryKeys.status(target, null),
    });
  }, [queryClient, target]);

  const saveProgress = useCallback((nextProgress: StoredDeployProgress) => {
    setProgress(nextProgress);
    writeDeployProgress(nextProgress);
    terminalNotificationRef.current = null;
  }, []);

  useLayoutEffect(() => {
    setProgress(readDeployProgress(target));
  }, [target]);

  const activeDeployQuery = useQuery({
    enabled: progress === null,
    queryFn: () => api.deploy.active({ target, token: accessToken }),
    queryKey: deployQueryKeys.active(target, accessToken),
    staleTime: 0,
  });

  useEffect(() => {
    const activeDeploy = activeDeployQuery.data;

    if (!activeDeploy?.active || progress) {
      return;
    }

    saveProgress({
      createdAt: activeDeploy.createdAt,
      deployHookId: activeDeploy.deployHookId,
      projectId: activeDeploy.projectId,
      startedAt: activeDeploy.createdAt,
      target,
    });
  }, [activeDeployQuery.data, progress, saveProgress, target]);

  const deployStatusQuery = useQuery({
    enabled: progress !== null,
    queryFn: () => {
      if (!progress) {
        throw new Error("Deploy progress is required");
      }

      return api.deploy.status({
        createdAt: progress.startedAt,
        deployHookId: progress.deployHookId,
        projectId: progress.projectId,
        target,
        token: accessToken,
      });
    },
    queryKey: deployQueryKeys.status(target, progress),
    refetchInterval: (query) => {
      const currentProgress = progressRef.current;

      if (!currentProgress) {
        return false;
      }

      if (isDeployProgressExpired(currentProgress.startedAt)) {
        return false;
      }

      const statusPayload = query.state.data;

      if (statusPayload && !statusPayload.monitoring) {
        return false;
      }

      if (statusPayload && TERMINAL_DEPLOY_STATUSES.has(statusPayload.status)) {
        return false;
      }

      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    const polledStatus = deployStatusQuery.data?.status;

    if (!progress || polledStatus === undefined) {
      return;
    }

    setDisplayStatus((current) => furthestDeployStatus(current, polledStatus));
  }, [deployStatusQuery.data?.status, progress]);

  useEffect(() => {
    if (!progress) {
      return;
    }

    const statusPayload = deployStatusQuery.data;

    if (isDeployProgressExpired(progress.startedAt)) {
      if (terminalNotificationRef.current !== "timeout") {
        terminalNotificationRef.current = "timeout";
        clearProgress();
        showDeployToast(
          target,
          "Deploy is taking longer than expected. Check the Vercel dashboard.",
          "warning",
        );
      }

      return;
    }

    if (
      deployStatusQuery.isSuccess &&
      statusPayload?.status === "ready" &&
      terminalNotificationRef.current !== "ready"
    ) {
      terminalNotificationRef.current = "ready";
      clearProgress();
      showDeployToast(target, "Refresh complete", "success");
      return;
    }

    if (
      deployStatusQuery.isSuccess &&
      statusPayload &&
      (statusPayload.status === "error" ||
        statusPayload.status === "canceled") &&
      terminalNotificationRef.current !== "failed"
    ) {
      terminalNotificationRef.current = "failed";
      clearProgress();
      showDeployToast(
        target,
        "Deploy failed. Check the Vercel dashboard.",
        "error",
      );
      return;
    }

    if (
      elapsedMs >= DEPLOY_ESTIMATED_MS &&
      (!deployStatusQuery.isSuccess ||
        !statusPayload?.monitoring ||
        statusPayload.status === "unknown") &&
      terminalNotificationRef.current !== "estimated"
    ) {
      terminalNotificationRef.current = "estimated";
      clearProgress();
      showDeployToast(target, "Refresh may be complete", "success");
    }
  }, [
    clearProgress,
    deployStatusQuery.data,
    deployStatusQuery.dataUpdatedAt,
    deployStatusQuery.isSuccess,
    elapsedMs,
    progress,
    target,
  ]);

  const startedAt = progress?.startedAt ?? pendingStartedAtRef.current ?? null;

  useEffect(() => {
    if (startedAt === null) {
      setElapsedMs(0);
      return undefined;
    }

    const updateElapsed = () => {
      setElapsedMs(Date.now() - startedAt);
    };

    updateElapsed();

    const intervalId = window.setInterval(updateElapsed, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startedAt]);

  const triggerDeploy = useCallback(() => {
    if (progress || triggerDeployMutation.isPending) {
      return;
    }

    pendingStartedAtRef.current = Date.now();
    setDisplayStatus("pending");

    triggerDeployMutation.mutate(
      { target, token: accessToken },
      {
        onError: (error) => {
          pendingStartedAtRef.current = null;
          const message =
            error instanceof ApiError ? error.message : "Failed to refresh";
          showDeployToast(target, message, "error");
        },
        onSuccess: (triggerResponse) => {
          const clickStartedAt = pendingStartedAtRef.current ?? Date.now();
          pendingStartedAtRef.current = null;
          saveProgress({
            createdAt: triggerResponse.createdAt,
            deployHookId: triggerResponse.deployHookId,
            projectId: triggerResponse.projectId,
            startedAt: clickStartedAt,
            target,
          });
        },
      },
    );
  }, [accessToken, progress, saveProgress, target, triggerDeployMutation]);

  return {
    inProgressLabel: formatDeployProgressLabel(elapsedMs, displayStatus),
    isInProgress: progress !== null || triggerDeployMutation.isPending,
    triggerDeploy,
  };
};
`;
};

export const getDeployPageComponent = (a: ProjectAnswers): string => {
  return `import { DeployButton } from "src/components/DeployButton/DeployButton.component";
import styles from "src/components/DeployPage/DeployPage.module.css";

interface DeployPageProps {
  accessToken?: string;
}

export const DeployPage = ({ accessToken }: DeployPageProps) => {
  return (
    <div className={styles.deployPage} data-testid="rhDeployPage">
      <header className={styles.deployPageHeader}>
        <h1 className={styles.deployPageTitle}>Refresh Site Content</h1>
        <p>
          Publish your latest content from the CMS to the live site. This only
          updates content—no code changes, so you can use without fear!
        </p>
      </header>
      <div className={styles.buttonGroup}>
        <DeployButton
          accessToken={accessToken}
          label="Refresh ${stagingHost(a)}"
          target="staging"
        />
        <DeployButton
          accessToken={accessToken}
          label="Refresh ${prodHost(a)}"
          target="production"
        />
      </div>
    </div>
  );
};

export default DeployPage;
`;
};

export const getDeployPageCSS = (): string => {
  return `.deployPage {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  height: 10vh;
  min-height: 300px;
  padding: var(--default-padding) var(--default-padding) 5rem;
  color: var(--color-text);
  text-align: center;
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-bg);
}

.deployPageHeader {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 76ch;
}

.deployPageTitle {
  font-size: clamp(2.125rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}

.buttonGroup {
  display: flex;
  flex-flow: row wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}
`;
};

export const getDeployButtonComponent = (): string => {
  return `"use client";

import { Button } from "src/components/Button/Button.component";
import { useDeployMonitor } from "src/hooks/useDeployMonitor";
import type { DeployTarget } from "src/lib/refreshContentAccess";

interface DeployButtonProps {
  accessToken?: string;
  label: string;
  target: DeployTarget;
}

export const DeployButton = (props: DeployButtonProps) => {
  const { accessToken, label, target } = props;
  const { inProgressLabel, isInProgress, triggerDeploy } = useDeployMonitor({
    accessToken,
    target,
  });

  return (
    <Button
      disabled={isInProgress}
      label={isInProgress ? inProgressLabel : label}
      onClick={triggerDeploy}
      variant={isInProgress ? "primary" : "secondary"}
    />
  );
};

export default DeployButton;
`;
};

export const getDeployButtonPO = (): string => {
  return `import { BasePageObject } from "src/tests/basePageObject.po";
import { render } from "src/tests/test-utils";
import { DeployButton } from "./DeployButton.component";

export interface DeployButtonProps {
  accessToken?: string;
  label: string;
  target: "staging" | "production";
}

export class DeployButtonPO extends BasePageObject {
  setupApiMocks() {
    return undefined;
  }

  render(props?: Partial<DeployButtonProps>) {
    const mergedProps = { ...this.defaultProps, ...props };
    return render(<DeployButton {...mergedProps} />);
  }

  private defaultProps: DeployButtonProps = {
    label: "Deploy Test",
    target: "staging",
  };
}
`;
};

export const getDeployButtonTest = (): string => {
  return `import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "src/tests/test-utils";
import { DeployButtonPO } from "./DeployButton.po";

describe("DeployButton", () => {
  let po: DeployButtonPO;
  let user: ReturnType<typeof userEvent.setup>;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    window.localStorage.clear();
    po = new DeployButtonPO();
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    jest.useRealTimers();
    window.localStorage.clear();
  });

  it("renders with initial state", async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({ active: false }),
      ok: true,
    } as Response);

    po.setupApiMocks();
    po.render();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /deploy test/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /deploy test/i }),
    ).not.toBeDisabled();
  });

  it("restores in-progress state from localStorage on load", async () => {
    window.localStorage.setItem(
      "refresh-content-deploy:staging",
      JSON.stringify({
        createdAt: 1_000,
        deployHookId: "hook-b",
        projectId: "prj_test",
        startedAt: Date.now(),
        target: "staging",
      }),
    );

    mockFetch.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: true,
            status: "building",
          }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({ active: false }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /building/i })).toBeDisabled();
    });
  });

  it("preserves elapsed time when the deploy trigger completes", async () => {
    jest.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const startedAt = Date.now();

    mockFetch.mockImplementation(async (input, init) => {
      const url = String(input);

      if (
        url.endsWith("/api/refresh-content/deploy") &&
        (init as RequestInit | undefined)?.method === "POST"
      ) {
        await new Promise((resolve) => {
          setTimeout(resolve, 3_000);
        });

        return {
          json: async () => ({
            createdAt: startedAt,
            deployHookId: "hook-b",
            ok: true,
            projectId: "prj_test",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: true,
            status: "building",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/active")) {
        return {
          json: async () => ({ active: false }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({ active: false }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    await act(async () => {
      jest.advanceTimersByTime(3_000);
    });

    await waitFor(() => {
      const storedProgress = window.localStorage.getItem(
        "refresh-content-deploy:staging",
      );
      expect(storedProgress).toContain("hook-b");
      expect(JSON.parse(storedProgress ?? "{}").startedAt).toBe(startedAt);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /building \\(0:03\\)/i }),
      ).toBeDisabled();
    });

    jest.setSystemTime(new Date());
  });

  it("shows in-progress immediately and persists after deploy trigger", async () => {
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: false,
            status: "unknown",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/active")) {
        return {
          json: async () => ({ active: false }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({
          createdAt: 1_000,
          deployHookId: "hook-b",
          ok: true,
          projectId: "prj_test",
        }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    expect(screen.getByRole("button", { name: /starting/i })).toBeDisabled();

    await waitFor(() => {
      expect(
        window.localStorage.getItem("refresh-content-deploy:staging"),
      ).toContain("hook-b");
    });
  });

  it("keeps in-progress state when monitoring is unavailable", async () => {
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: false,
            status: "unknown",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/active")) {
        return {
          json: async () => ({ active: false }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({
          createdAt: 1_000,
          deployHookId: "hook-b",
          ok: true,
          projectId: "prj_test",
        }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /in progress/i }),
      ).toBeDisabled();
    });

    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(screen.getByRole("button", { name: /in progress/i })).toBeDisabled();
  });

  it("clears in-progress state when deployment becomes ready", async () => {
    jest.useRealTimers();
    user = userEvent.setup();

    mockFetch.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: true,
            status: "ready",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/active")) {
        return {
          json: async () => ({ active: false }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({
          createdAt: 9_999,
          deployHookId: "hook-ready",
          ok: true,
          projectId: "prj_ready",
        }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /deploy test/i }),
      ).not.toBeDisabled();
    });

    expect(
      window.localStorage.getItem("refresh-content-deploy:staging"),
    ).toBeNull();
  });

  it("handles deployment failure", async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ active: false }),
      ok: true,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ error: "Failed to refresh" }),
      ok: false,
    } as Response);

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /deploy test/i }),
      ).not.toBeDisabled();
    });
  });

  it("prevents multiple clicks during deployment", async () => {
    mockFetch.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes("/api/refresh-content/deploy/status")) {
        return {
          json: async () => ({
            monitoring: true,
            status: "pending",
          }),
          ok: true,
        } as Response;
      }

      if (url.includes("/api/refresh-content/deploy/active")) {
        return {
          json: async () => ({ active: false }),
          ok: true,
        } as Response;
      }

      return {
        json: async () => ({
          createdAt: 1_000,
          deployHookId: "hook-b",
          ok: true,
          projectId: "prj_test",
        }),
        ok: true,
      } as Response;
    });

    po.setupApiMocks();
    po.render();
    const deployButton = screen.getByRole("button", { name: /deploy test/i });

    await user.click(deployButton);

    expect(screen.getByRole("button", { name: /starting/i })).toBeDisabled();

    expect(
      mockFetch.mock.calls.filter(
        ([requestUrl, init]) =>
          String(requestUrl).endsWith("/api/refresh-content/deploy") &&
          (init as RequestInit | undefined)?.method === "POST",
      ),
    ).toHaveLength(1);
  });
});
`;
};

export const getRefreshContentPage = (a: ProjectAnswers): string => {
  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeployPage } from "src/components/DeployPage/DeployPage.component";
import { isRefreshContentAuthorized } from "src/lib/refreshContentAccess";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Refresh Site Content | ${a.siteName}",
};

export default async function RefreshContent({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const { token } = (await searchParams) ?? {};

  if (!isRefreshContentAuthorized(token)) {
    return notFound();
  }

  return <DeployPage accessToken={token} />;
}
`;
};

export const getDeployRoute = (): string => {
  return `import { NextResponse } from "next/server";
import {
  getDeployHookUrl,
  isRefreshContentAuthorized,
  parseDeployHookUrl,
  parseDeployTarget,
} from "src/lib/refreshContentAccess";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      target?: string;
      token?: string;
    };

    if (!isRefreshContentAuthorized(body.token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = parseDeployTarget(body.target);

    if (!target) {
      return NextResponse.json(
        { error: "Invalid deploy target" },
        { status: 400 },
      );
    }

    const deployHook = getDeployHookUrl(target);

    if (!deployHook) {
      return NextResponse.json(
        { error: "Deploy hook not configured" },
        { status: 503 },
      );
    }

    const hookMetadata = parseDeployHookUrl(deployHook);

    if (!hookMetadata) {
      return NextResponse.json(
        { error: "Deploy hook URL is invalid" },
        { status: 503 },
      );
    }

    const response = await fetch(deployHook, { method: "POST" });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Deploy hook request failed" },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      job?: {
        createdAt?: number;
      };
    };

    const createdAt = payload.job?.createdAt ?? Date.now();

    return NextResponse.json({
      createdAt,
      deployHookId: hookMetadata.deployHookId,
      ok: true,
      projectId: hookMetadata.projectId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to trigger deploy" },
      { status: 500 },
    );
  }
}
`;
};

export const getDeployStatusRoute = (): string => {
  return `import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  isRefreshContentAuthorized,
  parseDeployTarget,
  resolveDeployHookMetadata,
} from "src/lib/refreshContentAccess";
import { fetchDeploymentStatus } from "src/lib/vercelDeploymentStatus";

const parseSince = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const since = Number(value);

  if (!Number.isFinite(since) || since <= 0) {
    return null;
  }

  return since;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? undefined;
    const target = parseDeployTarget(searchParams.get("target"));
    const since = parseSince(searchParams.get("since"));
    const deployHookId = searchParams.get("deployHookId")?.trim();
    const projectId = searchParams.get("projectId")?.trim();

    if (!isRefreshContentAuthorized(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!target) {
      return NextResponse.json(
        { error: "Invalid deploy target" },
        { status: 400 },
      );
    }

    if (since === null) {
      return NextResponse.json(
        { error: "Invalid since timestamp" },
        { status: 400 },
      );
    }

    const hookMetadata =
      projectId && deployHookId
        ? { deployHookId, projectId }
        : resolveDeployHookMetadata(target);

    if (!hookMetadata) {
      return NextResponse.json(
        { error: "Deploy hook not configured" },
        { status: 503 },
      );
    }

    const result = await fetchDeploymentStatus({
      deployHookId: hookMetadata.deployHookId,
      projectId: hookMetadata.projectId,
      since,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch deploy status" },
      { status: 500 },
    );
  }
}
`;
};

export const getDeployActiveRoute = (): string => {
  return `import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import {
  isRefreshContentAuthorized,
  parseDeployTarget,
  resolveDeployHookMetadata,
} from "src/lib/refreshContentAccess";
import { fetchActiveDeployProgress } from "src/lib/vercelDeploymentStatus";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? undefined;
    const target = parseDeployTarget(searchParams.get("target"));

    if (!isRefreshContentAuthorized(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!target) {
      return NextResponse.json(
        { error: "Invalid deploy target" },
        { status: 400 },
      );
    }

    const hookMetadata = resolveDeployHookMetadata(target);

    if (!hookMetadata) {
      return NextResponse.json(
        { error: "Deploy hook not configured" },
        { status: 503 },
      );
    }

    const result = await fetchActiveDeployProgress({
      deployHookId: hookMetadata.deployHookId,
      projectId: hookMetadata.projectId,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch active deploy" },
      { status: 500 },
    );
  }
}
`;
};
