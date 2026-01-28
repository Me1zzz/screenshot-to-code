import { create } from "zustand";
import { Commit, CommitHash, VariantStatus } from "../components/commits/types";

// Store for app-wide state
interface ProjectStore {
  // Inputs
  inputMode: "image" | "video" | "text";
  setInputMode: (mode: "image" | "video" | "text") => void;
  isImportedFromCode: boolean;
  setIsImportedFromCode: (imported: boolean) => void;
  referenceImages: string[];
  setReferenceImages: (images: string[]) => void;
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  imageSessions: ImageSession[];
  setImageSessions: (sessions: ImageSession[]) => void;
  selectedImageSessionId: string | null;
  setSelectedImageSessionId: (sessionId: string | null) => void;
  setImageSessionHead: (sessionId: string, head: CommitHash | null) => void;

  versions: VersionEntry[];
  selectedVersionId: string | null;
  addVersion: (version: VersionEntry) => void;
  setVersion: (versionId: string) => void;
  resetVersions: () => void;
  removeLastVersion: () => void;

  // Outputs
  commits: Record<string, Commit>;
  head: CommitHash | null;

  addCommit: (commit: Commit) => void;
  removeCommit: (hash: CommitHash) => void;
  resetCommits: () => void;

  appendCommitCode: (
    hash: CommitHash,
    numVariant: number,
    code: string
  ) => void;
  setCommitCode: (hash: CommitHash, numVariant: number, code: string) => void;
  setCommitArkuiCode: (
    hash: CommitHash,
    numVariant: number,
    arkuiCode: string
  ) => void;
  updateSelectedVariantIndex: (hash: CommitHash, index: number) => void;
  updateVariantStatus: (
    hash: CommitHash,
    numVariant: number,
    status: VariantStatus,
    errorMessage?: string
  ) => void;
  resizeVariants: (hash: CommitHash, count: number) => void;

  setHead: (hash: CommitHash) => void;
  resetHead: () => void;

  executionConsoles: { [key: number]: string[] };
  appendExecutionConsole: (variantIndex: number, line: string) => void;
  resetExecutionConsoles: () => void;
}

export interface ImageSession {
  id: string;
  referenceImage: string;
  head: CommitHash | null;
}

export interface VersionEntry {
  id: string;
  createdAt: Date;
  summary: string;
  type: "create" | "edit" | "code_create";
  sessionHeads: Record<string, CommitHash | null>;
  primaryHead: CommitHash | null;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  // Inputs and their setters
  inputMode: "image",
  setInputMode: (mode) => set({ inputMode: mode }),
  isImportedFromCode: false,
  setIsImportedFromCode: (imported) => set({ isImportedFromCode: imported }),
  referenceImages: [],
  setReferenceImages: (images) => set({ referenceImages: images }),
  initialPrompt: "",
  setInitialPrompt: (prompt) => set({ initialPrompt: prompt }),
  imageSessions: [],
  setImageSessions: (sessions) => set({ imageSessions: sessions }),
  selectedImageSessionId: null,
  setSelectedImageSessionId: (sessionId) =>
    set((state) => ({
      selectedImageSessionId: sessionId,
      head:
        sessionId === null
          ? null
          : state.imageSessions.find((session) => session.id === sessionId)
              ?.head ?? null,
    })),
  setImageSessionHead: (sessionId, head) =>
    set((state) => ({
      imageSessions: state.imageSessions.map((session) =>
        session.id === sessionId ? { ...session, head } : session
      ),
      head:
        state.selectedImageSessionId === sessionId ? head : state.head,
    })),

  versions: [],
  selectedVersionId: null,
  addVersion: (version) =>
    set((state) => ({
      versions: [...state.versions, version],
      selectedVersionId: version.id,
    })),
  setVersion: (versionId) =>
    set((state) => {
      const version = state.versions.find((item) => item.id === versionId);
      if (!version) return state;

      const nextImageSessions = state.imageSessions.map((session) => ({
        ...session,
        head: version.sessionHeads[session.id] ?? session.head ?? null,
      }));

      return {
        selectedVersionId: versionId,
        imageSessions: nextImageSessions,
        head: state.selectedImageSessionId
          ? version.sessionHeads[state.selectedImageSessionId] ?? null
          : version.primaryHead,
      };
    }),
  resetVersions: () => set({ versions: [], selectedVersionId: null }),
  removeLastVersion: () =>
    set((state) => ({
      versions: state.versions.slice(0, -1),
      selectedVersionId:
        state.versions.length > 1
          ? state.versions[state.versions.length - 2]?.id ?? null
          : null,
    })),

  // Outputs
  commits: {},
  head: null,

  addCommit: (commit: Commit) => {
    // Initialize variant statuses as 'generating'
    const commitsWithStatus = {
      ...commit,
      variants: commit.variants.map((variant) => ({
        ...variant,
        status: variant.status || ("generating" as VariantStatus),
      })),
    };

    set((state) => {
      const nextCommits = {
        ...state.commits,
        [commitsWithStatus.hash]: commitsWithStatus,
      };

      if (commit.parentHash && nextCommits[commit.parentHash]) {
        nextCommits[commit.parentHash] = {
          ...nextCommits[commit.parentHash],
          isCommitted: true,
        };
      }

      return { commits: nextCommits };
    });
  },
  removeCommit: (hash: CommitHash) => {
    set((state) => {
      const newCommits = { ...state.commits };
      delete newCommits[hash];
      return { commits: newCommits };
    });
  },
  resetCommits: () => set({ commits: {} }),

  appendCommitCode: (hash: CommitHash, numVariant: number, code: string) =>
    set((state) => {
      const commit = state.commits[hash];
      // Don't update if the commit is already committed
      if (commit.isCommitted) {
        throw new Error("Attempted to append code to a committed commit");
      }
      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            variants: commit.variants.map((variant, index) =>
              index === numVariant
                ? { ...variant, code: variant.code + code }
                : variant
            ),
          },
        },
      };
    }),
  setCommitCode: (hash: CommitHash, numVariant: number, code: string) =>
    set((state) => {
      const commit = state.commits[hash];
      // Don't update if the commit is already committed
      if (commit.isCommitted) {
        throw new Error("Attempted to set code of a committed commit");
      }
      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            variants: commit.variants.map((variant, index) =>
              index === numVariant ? { ...variant, code } : variant
            ),
          },
        },
      };
    }),
  setCommitArkuiCode: (hash: CommitHash, numVariant: number, arkuiCode: string) =>
    set((state) => {
      const commit = state.commits[hash];
      // Don't update if the commit is already committed
      if (commit.isCommitted) {
        throw new Error("Attempted to set ArkUI code of a committed commit");
      }
      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            variants: commit.variants.map((variant, index) =>
              index === numVariant ? { ...variant, arkuiCode } : variant
            ),
          },
        },
      };
    }),
  updateSelectedVariantIndex: (hash: CommitHash, index: number) =>
    set((state) => {
      const commit = state.commits[hash];
      // Don't update if the commit is already committed
      if (commit.isCommitted) {
        throw new Error(
          "Attempted to update selected variant index of a committed commit"
        );
      }

      // Just update the selected variant index without canceling other variants
      // This allows users to switch between variants even while they're still generating
      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            selectedVariantIndex: index,
          },
        },
      };
    }),
  updateVariantStatus: (
    hash: CommitHash,
    numVariant: number,
    status: VariantStatus,
    errorMessage?: string
  ) =>
    set((state) => {
      const commit = state.commits[hash];
      if (!commit) return state; // No change if commit doesn't exist

      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            variants: commit.variants.map((variant, index) =>
              index === numVariant 
                ? { ...variant, status, errorMessage: status === 'error' ? errorMessage : undefined } 
                : variant
            ),
          },
        },
      };
    }),
  resizeVariants: (hash: CommitHash, count: number) =>
    set((state) => {
      const commit = state.commits[hash];
      if (!commit) return state; // No change if commit doesn't exist

      // Resize variants array to match backend count
      const currentVariants = commit.variants;
      const newVariants = Array(count).fill(null).map((_, index) => 
        currentVariants[index] || {
          code: "",
          arkuiCode: "",
          status: "generating" as VariantStatus,
        }
      );

      return {
        commits: {
          ...state.commits,
          [hash]: {
            ...commit,
            variants: newVariants,
            selectedVariantIndex: Math.min(commit.selectedVariantIndex, count - 1),
          },
        },
      };
    }),

  setHead: (hash: CommitHash) =>
    set((state) => ({
      head: hash,
      imageSessions: state.selectedImageSessionId
        ? state.imageSessions.map((session) =>
            session.id === state.selectedImageSessionId
              ? { ...session, head: hash }
              : session
          )
        : state.imageSessions,
    })),
  resetHead: () => set({ head: null }),

  executionConsoles: {},
  appendExecutionConsole: (variantIndex: number, line: string) =>
    set((state) => ({
      executionConsoles: {
        ...state.executionConsoles,
        [variantIndex]: [
          ...(state.executionConsoles[variantIndex] || []),
          line,
        ],
      },
    })),
  resetExecutionConsoles: () => set({ executionConsoles: {} }),
}));
