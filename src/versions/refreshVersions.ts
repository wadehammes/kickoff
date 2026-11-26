export type PackageMetadata = {
  time: Record<string, string>;
  versions: Record<string, { deprecated?: string }>;
};

export type FetchMetadata = (name: string) => Promise<PackageMetadata>;

export type VersionSet = Record<string, string>;

export type RefreshResult<T extends VersionSet = VersionSet> = {
  failed: string[];
  newerMajors: { available: string; current: string; name: string }[];
  updated: { from: string; name: string; to: string }[];
  versions: T;
};

type Semver = {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
};

const MIN_AGE_DAYS = 7;
const DAY_MS = 86_400_000;

const parse = (version: string): Semver | null => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?$/);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  };
};

const comparePrerelease = (
  left: string | null,
  right: string | null,
): number => {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left.localeCompare(right);
};

const compare = (left: Semver, right: Semver): number =>
  left.major - right.major ||
  left.minor - right.minor ||
  left.patch - right.patch ||
  comparePrerelease(left.prerelease, right.prerelease);

const satisfiesCaret = (version: Semver, base: Semver): boolean => {
  if (compare(version, base) < 0) {
    return false;
  }

  if (base.major > 0) {
    return version.major === base.major;
  }

  if (base.minor > 0) {
    return version.major === 0 && version.minor === base.minor;
  }

  return (
    version.major === 0 && version.minor === 0 && version.patch === base.patch
  );
};

const stripRange = (range: string): string => range.replace(/^\^/, "");

const format = (version: Semver): string =>
  `${version.major}.${version.minor}.${version.patch}${version.prerelease ? `-${version.prerelease}` : ""}`;

const eligibleVersions = (metadata: PackageMetadata, now: Date): Semver[] =>
  Object.entries(metadata.versions)
    .filter(([, details]) => !details.deprecated)
    .filter(([version]) => {
      const published = metadata.time[version];

      return (
        published !== undefined &&
        now.getTime() - new Date(published).getTime() >= MIN_AGE_DAYS * DAY_MS
      );
    })
    .map(([version]) => parse(version))
    .filter((version): version is Semver => version?.prerelease === null)
    .sort(compare);

export const pickVersions = (
  metadata: PackageMetadata,
  current: string,
  now: Date,
): { inRange: string; newerMajor: string | null } => {
  const base = parse(stripRange(current));

  if (!base) {
    return { inRange: stripRange(current), newerMajor: null };
  }

  const eligible = eligibleVersions(metadata, now);
  const inRange = eligible
    .filter((version) => satisfiesCaret(version, base))
    .at(-1);
  const newest = eligible.at(-1);
  const newerMajor =
    newest && compare(newest, base) > 0 && !satisfiesCaret(newest, base)
      ? format(newest)
      : null;

  return { inRange: inRange ? format(inRange) : format(base), newerMajor };
};

export const refreshVersions = async <T extends VersionSet>({
  fetchMetadata,
  includeMajors = false,
  keep = [],
  now = new Date(),
  versions,
}: {
  fetchMetadata: FetchMetadata;
  includeMajors?: boolean;
  keep?: string[];
  now?: Date;
  versions: T;
}): Promise<RefreshResult<T>> => {
  const entries = await Promise.all(
    Object.entries(versions).map(async ([name, current]) => {
      if (keep.includes(name)) {
        return { current, name, next: current };
      }

      try {
        const { inRange, newerMajor } = pickVersions(
          await fetchMetadata(name),
          current,
          now,
        );
        const chosen = includeMajors && newerMajor ? newerMajor : inRange;
        const next = current.startsWith("^") ? `^${chosen}` : chosen;

        return {
          current,
          name,
          newerMajor: includeMajors ? null : newerMajor,
          next,
        };
      } catch (error) {
        return {
          current,
          error: error instanceof Error ? error.message : String(error),
          name,
          next: current,
        };
      }
    }),
  );

  return {
    failed: entries.flatMap((entry) =>
      "error" in entry ? [`${entry.name}: ${entry.error}`] : [],
    ),
    newerMajors: entries.flatMap((entry) =>
      "newerMajor" in entry && entry.newerMajor
        ? [
            {
              available: entry.newerMajor,
              current: entry.next,
              name: entry.name,
            },
          ]
        : [],
    ),
    updated: entries
      .filter((entry) => entry.next !== entry.current)
      .map((entry) => ({
        from: entry.current,
        name: entry.name,
        to: entry.next,
      })),
    versions: Object.fromEntries(
      entries.map((entry) => [entry.name, entry.next]),
    ) as T,
  };
};

export const resolveExtraPackages = async ({
  fetchMetadata,
  names,
  now = new Date(),
}: {
  fetchMetadata: FetchMetadata;
  names: string[];
  now?: Date;
}): Promise<{ problems: string[]; versions: VersionSet }> => {
  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const newest = eligibleVersions(await fetchMetadata(name), now).at(-1);

        return newest
          ? { name, version: `^${format(newest)}` }
          : { name, problem: "no release is at least 7 days old yet" };
      } catch (error) {
        return {
          name,
          problem: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  return {
    problems: results.flatMap((result) =>
      "problem" in result ? [`${result.name}: ${result.problem}`] : [],
    ),
    versions: Object.fromEntries(
      results.flatMap((result) =>
        "version" in result && result.version
          ? [[result.name, result.version] as const]
          : [],
      ),
    ),
  };
};

export const fetchFromNpm: FetchMetadata = async (name) => {
  const response = await fetch(
    `https://registry.npmjs.org/${name.replace("/", "%2f")}`,
    { signal: AbortSignal.timeout(20_000) },
  );

  if (!response.ok) {
    throw new Error(`registry returned ${response.status}`);
  }

  return (await response.json()) as PackageMetadata;
};
