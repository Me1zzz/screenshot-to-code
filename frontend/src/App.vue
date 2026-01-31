<template>
  <div class="mt-2 dark:bg-black dark:text-white">
    <PicoBadge v-if="isRunningOnCloud" />
    <TermsOfServiceDialog
      v-if="isRunningOnCloud"
      :open="!settings.isTermOfServiceAccepted"
      @open-change="handleTermDialogOpenChange"
    />

    <div class="lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-96 lg:flex-col">
      <div
        class="flex grow flex-col gap-y-2 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:bg-zinc-950 dark:text-white"
      >
        <div class="flex items-center justify-between mt-10 mb-2">
          <h1 class="text-2xl">截图生成代码</h1>
          <SettingsDialog :settings="settings" @update-settings="setSettings" />
        </div>

        <GenerationSettings :settings="settings" @update-settings="setSettings" />

        <OnboardingNote v-if="isRunningOnCloud && !settings.openAiApiKey" />

        <GenerateFromText
          v-if="appState === AppState.INITIAL"
          @create-from-text="doCreateFromText"
        />

        <Sidebar
          v-if="appState === AppState.CODING || appState === AppState.CODE_READY"
          :show-select-and-edit-feature="showSelectAndEditFeature"
          :do-update="doUpdate"
          :regenerate="regenerate"
          :cancel-code-generation="cancelCodeGeneration"
        />
      </div>
    </div>

    <main class="py-2 lg:pl-96">
      <StartPane
        v-if="appState === AppState.INITIAL"
        :do-create="doCreate"
        :import-from-code="importFromCode"
        :settings="settings"
        @update-settings="setSettings"
      />

      <PreviewPane
        v-if="appState === AppState.CODING || appState === AppState.CODE_READY"
        :do-update="doUpdate"
        :reset="reset"
        :settings="settings"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useToast } from "vue-toastification";
import { generateCode } from "./generateCode";
import SettingsDialog from "./components/settings/SettingsDialog.vue";
import { AppState, EditorTheme, type CodeGenerationParams, type Settings } from "./types";
import { IS_RUNNING_ON_CLOUD } from "./config";
import PicoBadge from "./components/messages/PicoBadge.vue";
import OnboardingNote from "./components/messages/OnboardingNote.vue";
import { usePersistedState } from "./composables/usePersistedState";
import TermsOfServiceDialog from "./components/TermsOfServiceDialog.vue";
import { USER_CLOSE_WEB_SOCKET_CODE } from "./constants";
import { extractHistory } from "./components/history/utils";
import { Stack } from "./lib/stacks";
import { CodeGenerationModel } from "./lib/models";
import { useBrowserTabIndicator } from "./composables/useBrowserTabIndicator";
import { useAppStore } from "./store/app-store";
import { useProjectStore, type ImageSession } from "./store/project-store";
import Sidebar from "./components/sidebar/Sidebar.vue";
import PreviewPane from "./components/preview/PreviewPane.vue";
import GenerationSettings from "./components/settings/GenerationSettings.vue";
import StartPane from "./components/start-pane/StartPane.vue";
import { type Commit, type CommitHash } from "./components/commits/types";
import { createCommit } from "./components/commits/utils";
import GenerateFromText from "./components/generate-from-text/GenerateFromText.vue";
import { nanoid } from "nanoid";

const toast = useToast();
const isRunningOnCloud = IS_RUNNING_ON_CLOUD;

const projectStore = useProjectStore();
const appStore = useAppStore();

const {
  inputMode,
  isImportedFromCode,
  referenceImages,
  initialPrompt,
  imageSessions,
  selectedImageSessionId,
  head,
  commits,
} = storeToRefs(projectStore);

const {
  setInputMode,
  setIsImportedFromCode,
  setReferenceImages,
  setInitialPrompt,
  setImageSessions,
  setSelectedImageSessionId,
  setImageSessionHead,
  addVersion,
  resetVersions,
  removeLastVersion,
  addCommit,
  removeCommit,
  setHead,
  appendCommitCode,
  setCommitCode,
  setCommitArkuiCode,
  resetCommits,
  resetHead,
  updateVariantStatus,
  resizeVariants,
  appendExecutionConsole,
  resetExecutionConsoles,
} = projectStore;

const { appState, updateImages } = storeToRefs(appStore);
const {
  disableInSelectAndEditMode,
  setUpdateInstruction,
  setUpdateImages,
  setAppState,
} = appStore;

const { state: settings, setState: setSettings } = usePersistedState<Settings>(
  {
    openAiApiKey: null,
    openAiBaseURL: null,
    anthropicApiKey: null,
    screenshotOneApiKey: null,
    isImageGenerationEnabled: true,
    isEngineeringVariantEnabled: true,
    isDeepThinkingEnabled: true,
    isBlockUpdateEnabled: false,
    engineeringOpenAiApiKey: null,
    engineeringOpenAiBaseURL: null,
    engineeringOpenAiModel: "gpt-4o-mini",
    vlmTemperature: 0.2,
    editorTheme: EditorTheme.COBALT,
    generatedCodeConfig: Stack.HTML_TAILWIND,
    codeGenerationModel: CodeGenerationModel.CLAUDE_4_5_SONNET_2025_09_29,
    isTermOfServiceAccepted: false,
  },
  "setting"
);

const wsRefs = ref(new Set<WebSocket>());

const showSelectAndEditFeature = computed(() =>
  [Stack.HTML_TAILWIND, Stack.HTML_CSS].includes(settings.value.generatedCodeConfig)
);

useBrowserTabIndicator(() => appState.value === AppState.CODING);

watch(
  () => settings.value.generatedCodeConfig,
  (value) => {
    if (!value) {
      setSettings((prev) => ({ ...prev, generatedCodeConfig: Stack.HTML_TAILWIND }));
    }
  },
  { immediate: true }
);

watch(
  () => settings.value.isEngineeringVariantEnabled,
  (value) => {
    if (typeof value !== "boolean") {
      const defaultValue =
        settings.value.generatedCodeConfig === Stack.HTML_TAILWIND ||
        settings.value.generatedCodeConfig === Stack.HTML_CSS;
      setSettings((prev) => ({ ...prev, isEngineeringVariantEnabled: defaultValue }));
    }
  },
  { immediate: true }
);

watch(
  () => settings.value.isDeepThinkingEnabled,
  (value) => {
    if (typeof value !== "boolean") {
      setSettings((prev) => ({ ...prev, isDeepThinkingEnabled: true }));
    }
  },
  { immediate: true }
);

watch(
  () => settings.value.isBlockUpdateEnabled,
  (value) => {
    if (typeof value !== "boolean") {
      setSettings((prev) => ({ ...prev, isBlockUpdateEnabled: false }));
    }
  },
  { immediate: true }
);

watch(
  () => settings.value.engineeringOpenAiModel,
  (value) => {
    if (!value) {
      setSettings((prev) => ({ ...prev, engineeringOpenAiModel: "gpt-4o-mini" }));
    }
  },
  { immediate: true }
);

watch(
  () => settings.value.vlmTemperature,
  (value) => {
    if (typeof value !== "number") {
      setSettings((prev) => ({ ...prev, vlmTemperature: 0.2 }));
    }
  },
  { immediate: true }
);

const reset = () => {
  setAppState(AppState.INITIAL);
  setUpdateInstruction("");
  setUpdateImages([]);
  disableInSelectAndEditMode();
  resetExecutionConsoles();

  resetCommits();
  resetHead();
  resetVersions();
  setImageSessions([]);
  setSelectedImageSessionId(null);

  setInputMode("image");
  setReferenceImages([]);
  setIsImportedFromCode(false);
};

const regenerate = () => {
  if (head.value === null) {
    toast.error("没有当前版本。请通过聊天或 Github 联系支持。");
    throw new Error("Regenerate called with no head");
  }

  const currentCommit = commits.value[head.value];
  if (currentCommit.type !== "ai_create") {
    toast.error("只能重新生成第一个版本。");
    return;
  }

  if (inputMode.value === "image" || inputMode.value === "video") {
    doCreate(referenceImages.value, inputMode.value);
  } else {
    doCreateFromText(initialPrompt.value);
  }
};

const cancelCodeGeneration = () => {
  wsRefs.value.forEach((socket) => {
    socket.close?.(USER_CLOSE_WEB_SOCKET_CODE);
  });
  wsRefs.value.clear();
};

const cancelCodeGenerationAndReset = (commit: Commit) => {
  if (commit.type === "ai_create") {
    reset();
  } else {
    removeCommit(commit.hash);
    removeLastVersion();

    const parentCommitHash = commit.parentHash;
    if (parentCommitHash) {
      setHead(parentCommitHash);
    } else {
      throw new Error("Parent commit not found");
    }

    setAppState(AppState.CODE_READY);
  }
};

const selectedImageSession = computed(() =>
  selectedImageSessionId.value === null
    ? null
    : imageSessions.value.find((session) => session.id === selectedImageSessionId.value) ?? null
);

const doGenerateCode = (
  params: CodeGenerationParams,
  options?: {
    sessionId?: string | null;
    shouldResetExecutionConsole?: boolean;
    shouldSetAppState?: boolean;
    onComplete?: () => void;
    onCancel?: () => void;
  }
): CommitHash => {
  const shouldResetExecutionConsole = options?.shouldResetExecutionConsole ?? true;
  const shouldSetAppState = options?.shouldSetAppState ?? true;
  const sessionId = options?.sessionId ?? selectedImageSessionId.value;

  if (shouldResetExecutionConsole) {
    resetExecutionConsoles();
  }

  if (shouldSetAppState) {
    setAppState(AppState.CODING);
  }

  const updatedParams = { ...params, ...settings.value };

  const previousCommit = head.value ? commits.value[head.value] : null;
  const baseCommitObject = {
    variants: Array(4)
      .fill(null)
      .map((_, index) => ({
        code: "",
        arkuiCode:
          params.generationType === "update"
            ? previousCommit?.variants[index]?.arkuiCode ?? ""
            : "",
      })),
  };

  const commitInputObject =
    params.generationType === "create"
      ? {
          ...baseCommitObject,
          type: "ai_create" as const,
          parentHash: null,
          inputs: params.prompt,
        }
      : {
          ...baseCommitObject,
          type: "ai_edit" as const,
          parentHash: head.value,
          inputs: params.history
            ? params.history[params.history.length - 1]
            : { text: "", images: [] },
        };

  const commit = createCommit(commitInputObject);
  addCommit(commit);
  if (sessionId) {
    setImageSessionHead(sessionId, commit.hash);
  } else {
    setHead(commit.hash);
  }

  const localWsRef = { current: null as WebSocket | null };
  let trackedSocket: WebSocket | null = null;

  generateCode(localWsRef, updatedParams, {
    onChange: (token, variantIndex) => {
      appendCommitCode(commit.hash, variantIndex, token);
    },
    onSetCode: (code, variantIndex, _pageIndex, arkuiCode) => {
      setCommitCode(commit.hash, variantIndex, code);
      if (arkuiCode && arkuiCode.length > 0) {
        setCommitArkuiCode(commit.hash, variantIndex, arkuiCode);
      }
    },
    onStatusUpdate: (line, variantIndex) => appendExecutionConsole(variantIndex, line),
    onVariantComplete: (variantIndex) => {
      updateVariantStatus(commit.hash, variantIndex, "complete");
    },
    onVariantError: (variantIndex, error) => {
      updateVariantStatus(commit.hash, variantIndex, "error", error);
    },
    onVariantCount: (count) => {
      resizeVariants(commit.hash, count);
    },
    onCancel: () => {
      cancelCodeGenerationAndReset(commit);
      if (trackedSocket) {
        wsRefs.value.delete(trackedSocket);
      }
      options?.onCancel?.();
    },
    onComplete: () => {
      if (shouldSetAppState) {
        setAppState(AppState.CODE_READY);
      }
      if (trackedSocket) {
        wsRefs.value.delete(trackedSocket);
      }
      options?.onComplete?.();
    },
  });

  trackedSocket = localWsRef.current;
  if (trackedSocket) {
    wsRefs.value.add(trackedSocket);
  }

  return commit.hash;
};

const doCreate = (
  referenceImagesInput: string[],
  mode: "image" | "video",
  textPrompt: string = ""
) => {
  reset();
  setReferenceImages(referenceImagesInput);
  setInputMode(mode);

  if (referenceImagesInput.length > 0) {
    const sessions: ImageSession[] = referenceImagesInput.map((image, index) => ({
      id: `image-session-${Date.now()}-${index}`,
      referenceImage: image,
      head: null,
    }));
    setImageSessions(sessions);
    setSelectedImageSessionId(sessions[0]?.id ?? null);
    resetExecutionConsoles();
    setAppState(AppState.CODING);

    const versionId = nanoid();
    const versionSummary = textPrompt.trim().length > 0 ? textPrompt : "创建";
    const versionSessionHeads: Record<string, CommitHash | null> = {};
    let primaryHead: CommitHash | null = null;

    const generationTasks = sessions.map((session, index) => {
      return new Promise<void>((resolve) => {
        const commitHash = doGenerateCode(
          {
            generationType: "create",
            inputMode: mode,
            prompt: { text: textPrompt, images: [session.referenceImage] },
          },
          {
            sessionId: session.id,
            shouldResetExecutionConsole: false,
            shouldSetAppState: false,
            onComplete: resolve,
            onCancel: resolve,
          }
        );
        versionSessionHeads[session.id] = commitHash;
        if (index === 0) {
          primaryHead = commitHash;
        }
      });
    });

    addVersion({
      id: versionId,
      createdAt: new Date(),
      summary: versionSummary,
      type: "create",
      sessionHeads: versionSessionHeads,
      primaryHead,
    });

    Promise.all(generationTasks).then(() => {
      setAppState(AppState.CODE_READY);
    });
  }
};

const doCreateFromText = (text: string) => {
  reset();
  setInputMode("text");
  setInitialPrompt(text);
  const commitHash = doGenerateCode({
    generationType: "create",
    inputMode: "text",
    prompt: { text, images: [] },
  });

  addVersion({
    id: nanoid(),
    createdAt: new Date(),
    summary: text.trim().length > 0 ? text : "创建",
    type: "create",
    sessionHeads: {},
    primaryHead: commitHash,
  });
};

const doUpdate = async (updateInstructionInput: string, selectedElement?: HTMLElement) => {
  if (updateInstructionInput.trim() === "") {
    toast.error("请提供给 AI 的更新说明。");
    return;
  }

  if (head.value === null) {
    toast.error("没有当前版本。请联系支持或在 Github 提交 issue。");
    throw new Error("Update called with no head");
  }

  let historyTree;
  try {
    historyTree = extractHistory(head.value, commits.value);
  } catch {
    toast.error("版本历史无效。这不该发生。请联系支持或在 Github 提交 issue。");
    throw new Error("Invalid version history");
  }

  let modifiedUpdateInstruction = updateInstructionInput;

  if (selectedElement) {
    modifiedUpdateInstruction =
      updateInstructionInput + " referring to this element specifically: " + selectedElement.outerHTML;
  }

  const updatedHistory = [
    ...historyTree,
    { text: modifiedUpdateInstruction, images: updateImages.value },
  ];

  const versionSessionHeads: Record<string, CommitHash | null> = {};
  imageSessions.value.forEach((session) => {
    versionSessionHeads[session.id] = session.head;
  });

  const commitHash = doGenerateCode({
    generationType: "update",
    inputMode: inputMode.value,
    prompt:
      inputMode.value === "text"
        ? { text: initialPrompt.value, images: [] }
        : {
            text: "",
            images: [selectedImageSession.value?.referenceImage ?? referenceImages.value[0]],
          },
    history: updatedHistory,
    isImportedFromCode: isImportedFromCode.value,
  });

  if (selectedImageSessionId.value) {
    versionSessionHeads[selectedImageSessionId.value] = commitHash;
  }

  addVersion({
    id: nanoid(),
    createdAt: new Date(),
    summary: updateInstructionInput,
    type: "edit",
    sessionHeads: versionSessionHeads,
    primaryHead: commitHash,
  });

  setUpdateInstruction("");
  setUpdateImages([]);
};

const handleTermDialogOpenChange = (open: boolean) => {
  setSettings((prev) => ({
    ...prev,
    isTermOfServiceAccepted: !open,
  }));
};

const setStack = (stack: Stack) => {
  setSettings((prev) => ({
    ...prev,
    generatedCodeConfig: stack,
  }));
};

const importFromCode = (code: string, stack: Stack) => {
  reset();
  setIsImportedFromCode(true);
  setStack(stack);

  const commit = createCommit({
    type: "code_create",
    parentHash: null,
    variants: [{ code, arkuiCode: "" }],
    inputs: null,
  });
  addCommit(commit);
  setHead(commit.hash);
  addVersion({
    id: nanoid(),
    createdAt: new Date(),
    summary: "从代码导入",
    type: "code_create",
    sessionHeads: {},
    primaryHead: commit.hash,
  });

  setAppState(AppState.CODE_READY);
};
</script>
