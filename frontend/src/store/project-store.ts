import { defineStore } from "pinia";
import type { Commit, CommitHash, VariantStatus } from "../components/commits/types";

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

export interface ProjectStoreState {
  inputMode: "image" | "video" | "text";
  isImportedFromCode: boolean;
  referenceImages: string[];
  initialPrompt: string;
  imageSessions: ImageSession[];
  selectedImageSessionId: string | null;
  versions: VersionEntry[];
  selectedVersionId: string | null;
  commits: Record<string, Commit>;
  head: CommitHash | null;
  executionConsoles: { [key: number]: string[] };
}

export const useProjectStore = defineStore("project", {
  state: (): ProjectStoreState => ({
    inputMode: "image",
    isImportedFromCode: false,
    referenceImages: [],
    initialPrompt: "",
    imageSessions: [],
    selectedImageSessionId: null,
    versions: [],
    selectedVersionId: null,
    commits: {},
    head: null,
    executionConsoles: {},
  }),
  actions: {
    setInputMode(mode: "image" | "video" | "text") {
      this.inputMode = mode;
    },
    setIsImportedFromCode(imported: boolean) {
      this.isImportedFromCode = imported;
    },
    setReferenceImages(images: string[]) {
      this.referenceImages = images;
    },
    setInitialPrompt(prompt: string) {
      this.initialPrompt = prompt;
    },
    setImageSessions(sessions: ImageSession[]) {
      this.imageSessions = sessions;
    },
    setSelectedImageSessionId(sessionId: string | null) {
      this.selectedImageSessionId = sessionId;
      this.head =
        sessionId === null
          ? null
          : this.imageSessions.find((session) => session.id === sessionId)
              ?.head ?? null;
    },
    setImageSessionHead(sessionId: string, head: CommitHash | null) {
      this.imageSessions = this.imageSessions.map((session) =>
        session.id === sessionId ? { ...session, head } : session
      );
      if (this.selectedImageSessionId === sessionId) {
        this.head = head;
      }
    },
    addVersion(version: VersionEntry) {
      this.versions = [...this.versions, version];
      this.selectedVersionId = version.id;
    },
    setVersion(versionId: string) {
      const version = this.versions.find((item) => item.id === versionId);
      if (!version) return;

      const nextImageSessions = this.imageSessions.map((session) => ({
        ...session,
        head: version.sessionHeads[session.id] ?? session.head ?? null,
      }));

      this.selectedVersionId = versionId;
      this.imageSessions = nextImageSessions;
      this.head = this.selectedImageSessionId
        ? version.sessionHeads[this.selectedImageSessionId] ?? null
        : version.primaryHead;
    },
    resetVersions() {
      this.versions = [];
      this.selectedVersionId = null;
    },
    removeLastVersion() {
      this.versions = this.versions.slice(0, -1);
      this.selectedVersionId =
        this.versions.length > 0
          ? this.versions[this.versions.length - 1]?.id ?? null
          : null;
    },
    addCommit(commit: Commit) {
      const commitsWithStatus = {
        ...commit,
        variants: commit.variants.map((variant) => ({
          ...variant,
          status: variant.status || ("generating" as VariantStatus),
        })),
      };

      const nextCommits = {
        ...this.commits,
        [commitsWithStatus.hash]: commitsWithStatus,
      };

      if (commit.parentHash && nextCommits[commit.parentHash]) {
        nextCommits[commit.parentHash] = {
          ...nextCommits[commit.parentHash],
          isCommitted: true,
        };
      }

      this.commits = nextCommits;
    },
    removeCommit(hash: CommitHash) {
      const newCommits = { ...this.commits };
      delete newCommits[hash];
      this.commits = newCommits;
    },
    resetCommits() {
      this.commits = {};
    },
    appendCommitCode(hash: CommitHash, numVariant: number, code: string) {
      const commit = this.commits[hash];
      if (commit.isCommitted) {
        throw new Error("Attempted to append code to a committed commit");
      }
      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          variants: commit.variants.map((variant, index) =>
            index === numVariant
              ? { ...variant, code: variant.code + code }
              : variant
          ),
        },
      };
    },
    setCommitCode(hash: CommitHash, numVariant: number, code: string) {
      const commit = this.commits[hash];
      if (commit.isCommitted) {
        throw new Error("Attempted to set code of a committed commit");
      }
      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          variants: commit.variants.map((variant, index) =>
            index === numVariant ? { ...variant, code } : variant
          ),
        },
      };
    },
    setCommitArkuiCode(
      hash: CommitHash,
      numVariant: number,
      arkuiCode: string
    ) {
      const commit = this.commits[hash];
      if (commit.isCommitted) {
        throw new Error("Attempted to set ArkUI code of a committed commit");
      }
      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          variants: commit.variants.map((variant, index) =>
            index === numVariant ? { ...variant, arkuiCode } : variant
          ),
        },
      };
    },
    updateSelectedVariantIndex(hash: CommitHash, index: number) {
      const commit = this.commits[hash];
      if (commit.isCommitted) {
        throw new Error(
          "Attempted to update selected variant index of a committed commit"
        );
      }
      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          selectedVariantIndex: index,
        },
      };
    },
    updateVariantStatus(
      hash: CommitHash,
      numVariant: number,
      status: VariantStatus,
      errorMessage?: string
    ) {
      const commit = this.commits[hash];
      if (!commit) return;

      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          variants: commit.variants.map((variant, index) =>
            index === numVariant
              ? {
                  ...variant,
                  status,
                  errorMessage: status === "error" ? errorMessage : undefined,
                }
              : variant
          ),
        },
      };
    },
    resizeVariants(hash: CommitHash, count: number) {
      const commit = this.commits[hash];
      if (!commit) return;

      const currentVariants = commit.variants;
      const newVariants = Array(count)
        .fill(null)
        .map((_, index) =>
          currentVariants[index] || {
            code: "",
            arkuiCode: "",
            status: "generating" as VariantStatus,
          }
        );

      this.commits = {
        ...this.commits,
        [hash]: {
          ...commit,
          variants: newVariants,
          selectedVariantIndex: Math.min(commit.selectedVariantIndex, count - 1),
        },
      };
    },
    setHead(hash: CommitHash) {
      this.head = hash;
      if (this.selectedImageSessionId) {
        this.imageSessions = this.imageSessions.map((session) =>
          session.id === this.selectedImageSessionId
            ? { ...session, head: hash }
            : session
        );
      }
    },
    resetHead() {
      this.head = null;
    },
    appendExecutionConsole(variantIndex: number, line: string) {
      this.executionConsoles = {
        ...this.executionConsoles,
        [variantIndex]: [...(this.executionConsoles[variantIndex] || []), line],
      };
    },
    resetExecutionConsoles() {
      this.executionConsoles = {};
    },
  },
});
