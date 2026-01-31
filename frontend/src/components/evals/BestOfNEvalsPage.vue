<template>
  <div class="mx-auto">
    <EvalNavigation />
    <div class="w-full py-2 bg-gradient-to-b from-gray-900 to-gray-800 text-white border-b border-gray-700">
      <div v-if="evals.length === 0" class="flex flex-col gap-4 max-w-5xl mx-auto px-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold text-gray-200">配置模型比较</h2>
          <button
            type="button"
            @click="refreshFolders"
            class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新
          </button>
        </div>
        <div class="space-y-3">
          <div v-for="(path, index) in folderPaths" :key="index" class="relative">
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-400 font-medium w-16">模型 {{ index + 1 }}</span>
              <div class="flex-1 relative">
                <select
                  v-model="folderPaths[index]"
                  class="w-full px-4 py-3 pr-10 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
                >
                  <option value="">选择文件夹...</option>
                  <option
                    v-for="folder in availableFolders"
                    :key="folder.path"
                    :value="folder.path"
                    :title="folder.name"
                  >
                    {{ folder.name }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <button
                v-if="index > 0"
                type="button"
                @click="removeFolderInput(index)"
                class="bg-red-500 hover:bg-red-600 px-3 py-3 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-3 justify-center mt-6">
          <button
            type="button"
            @click="addFolderInput"
            class="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            添加模型
          </button>
          <button
            type="button"
            @click="loadEvals"
            :disabled="isLoading || folderPaths.some((path) => !path)"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span v-if="isLoading" class="flex items-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              加载中...
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              开始比较
            </span>
          </button>
        </div>
      </div>

      <div v-else class="max-w-7xl mx-auto px-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1 rounded-lg text-sm transition-colors"
              @click="resetComparisons"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <div class="flex items-center bg-gray-700 rounded-lg">
              <button
                type="button"
                @click="goToPrevious"
                :disabled="currentComparisonIndex === 0"
                class="px-2.5 py-1 rounded-l-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <select
                v-model.number="currentComparisonIndex"
                class="bg-transparent text-white px-3 py-1 text-sm font-medium focus:outline-none appearance-none cursor-pointer"
                @change="goToComparison(currentComparisonIndex)"
              >
                <option
                  v-for="index in displayedIndices"
                  :key="index"
                  :value="index"
                  class="bg-gray-800"
                >
                  比较 {{ index + 1 }} {{ outcomes[index] !== null ? "✓" : "" }}
                </option>
              </select>

              <button
                type="button"
                @click="goToNext"
                :disabled="currentComparisonIndex === evals.length - 1"
                class="px-2.5 py-1 rounded-r-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <span class="text-sm text-gray-400 font-medium">
              {{ progressLabel }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-gray-700/50 px-3 py-1 rounded-lg">
              <span class="text-xs text-gray-400 font-medium">进度</span>
              <div class="w-24 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                  :style="{ width: `${Math.round((stats.totalVotes / evals.length) * 100)}%` }"
                ></div>
              </div>
              <span class="text-sm font-semibold text-gray-200">
                {{ Math.round((stats.totalVotes / evals.length) * 100) }}%
              </span>
            </div>

            <button
              type="button"
              @click="showResults = !showResults"
              class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-200 transition-colors"
            >
              结果
            </button>

            <select
              v-model="winnerFilter"
              class="px-2 py-1 bg-gray-700 text-white text-xs rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              @change="handleWinnerFilter"
            >
              <option value="all">所有比较</option>
              <option v-for="(name, index) in folderNames" :key="name" :value="index">
                {{ name }} 胜出
              </option>
              <option value="tie">平局</option>
            </select>

            <div v-if="showResults" class="bg-gray-800 rounded overflow-hidden">
              <div class="flex items-center justify-between px-2 py-1 bg-gray-700">
                <span class="text-xs text-gray-300 font-semibold">结果</span>
                <button type="button" class="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded" @click="copyResultsAsCSV">
                  复制 CSV
                </button>
              </div>
              <table class="text-xs w-full">
                <thead>
                  <tr class="bg-gray-700">
                    <th class="px-2 py-1 text-gray-300">模型</th>
                    <th class="px-2 py-1 text-gray-300">胜出</th>
                    <th class="px-2 py-1 text-gray-300">%</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stat, index) in stats.stats" :key="index" class="border-t border-gray-600">
                    <td class="px-2 py-1 text-white">{{ stat.name }}</td>
                    <td class="px-2 py-1 text-green-400 text-center">{{ stat.wins }}</td>
                    <td class="px-2 py-1 text-green-400 text-center">{{ stat.percentage }}%</td>
                  </tr>
                  <tr v-if="stats.ties > 0" class="border-t border-gray-600">
                    <td class="px-2 py-1 text-white">平局</td>
                    <td class="px-2 py-1 text-yellow-400 text-center">{{ stats.ties }}</td>
                    <td class="px-2 py-1 text-yellow-400 text-center">{{ stats.tiePercentage }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="text-xs text-gray-400">
            ↑↓ 导航 | ←→ 切换 | 1-{{ folderNames.length }} 投票 | T 平局
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentEval" class="bg-gray-50 min-h-screen">
      <div class="flex gap-4 p-3 max-w-full">
        <div class="flex-shrink-0 w-[380px]">
          <div class="bg-white rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gray-100 text-gray-700 px-3 py-1.5 border-b border-gray-200">
              <h3 class="font-medium text-xs">参考图</h3>
            </div>
            <div class="w-full h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 p-2">
              <img
                :src="currentEval.input"
                :alt="`比较输入 ${currentComparisonIndex + 1}`"
                class="max-w-full max-h-full object-contain rounded shadow-sm"
              />
            </div>
          </div>
        </div>

        <div class="flex-1">
          <div class="bg-white rounded-t-lg shadow-sm border-b border-gray-200">
            <div class="flex items-center">
              <div v-for="(name, index) in folderNames" :key="name" class="flex-1 flex items-center">
                <button
                  type="button"
                  @click="currentModelIndex = index"
                  class="flex-1 px-3 py-2 text-xs font-medium transition-all border-r border-gray-200"
                  :class="currentModelIndex === index ? 'bg-blue-50 text-blue-700 border-b-2 border-b-blue-500' : 'text-gray-600 hover:bg-gray-50'"
                >
                  {{ name }} <span class="text-xs opacity-60">({{ index + 1 }})</span>
                </button>
                <button
                  type="button"
                  @click="handleVote(currentComparisonIndex, index)"
                  class="px-3 py-2 text-xs font-medium transition-all border-r border-gray-200"
                  :class="outcomes[currentComparisonIndex] === index ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'"
                >
                  {{ outcomes[currentComparisonIndex] === index ? "✓" : "投票" }}
                </button>
              </div>
              <button
                type="button"
                @click="handleVote(currentComparisonIndex, 'tie')"
                class="px-4 py-2 text-xs font-medium transition-all"
                :class="outcomes[currentComparisonIndex] === 'tie' ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500 hover:bg-gray-50'"
              >
                {{ outcomes[currentComparisonIndex] === 'tie' ? '平局 ✓' : '平局 (T)' }}
              </button>
            </div>
          </div>

          <div class="bg-white shadow-lg overflow-hidden">
            <div class="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
              <span class="text-xs text-gray-600 font-medium">
                {{ folderNames[currentModelIndex] }} 输出
                <span v-if="outcomes[currentComparisonIndex] === currentModelIndex" class="ml-2 text-green-600">
                  ✓ 胜出
                </span>
              </span>
              <button
                type="button"
                class="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 text-white px-2 py-0.5 rounded text-xs transition-colors"
                @click="openDialog(currentEval.outputs[currentModelIndex])"
              >
                全屏查看
              </button>
            </div>
            <div class="relative bg-gray-50">
              <iframe
                :ref="(el) => setIframeRef(el, currentModelIndex)"
                :srcdoc="currentEval.outputs[currentModelIndex]"
                class="w-full h-[calc(100vh-200px)]"
                style="color-scheme: light"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div class="w-[95vw] h-[95vh] bg-gray-900 rounded-lg relative">
        <button type="button" class="absolute top-4 right-4 text-white" @click="showDialog = false">关闭</button>
        <iframe :srcdoc="selectedHtml" class="w-full h-full rounded-lg"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { HTTP_BACKEND_URL } from "../../config";
import EvalNavigation from "./EvalNavigation.vue";

interface Eval {
  input: string;
  outputs: string[];
}

type Outcome = number | "tie" | null;

interface BestOfNEvalsResponse {
  evals: Eval[];
  folder_names: string[];
}

interface OutputFolder {
  name: string;
  path: string;
  modified_time: number;
}

const evals = ref<Eval[]>([]);
const outcomes = ref<Outcome[]>([]);
const folderNames = ref<string[]>([]);
const folderPaths = ref<string[]>([""]);
const isLoading = ref(false);
const selectedHtml = ref("");
const availableFolders = ref<OutputFolder[]>([]);
const currentComparisonIndex = ref(0);
const currentModelIndex = ref(0);
const showResults = ref(false);
const winnerFilter = ref<number | "tie" | "all" | string>("all");
const showDialog = ref(false);

const iframeRefs = ref<(HTMLIFrameElement | null)[]>([]);

const setIframeRef = (el: HTMLIFrameElement | null, index: number) => {
  iframeRefs.value[index] = el;
};

const refreshFolders = async () => {
  try {
    const response = await fetch(`${HTTP_BACKEND_URL}/output_folders`);
    availableFolders.value = await response.json();
  } catch (error) {
    console.error("Error fetching folders:", error);
  }
};

onMounted(refreshFolders);

const setupSyncScrolling = () => {
  const iframes = iframeRefs.value.filter(Boolean) as HTMLIFrameElement[];
  if (iframes.length < 2) return;

  const cleanups: Array<() => void> = [];

  iframes.forEach((iframe) => {
    try {
      const sourceDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!sourceDocument) return;

      const syncHandler = () => {
        const scrollTop = sourceDocument.documentElement.scrollTop || sourceDocument.body.scrollTop;
        const scrollLeft = sourceDocument.documentElement.scrollLeft || sourceDocument.body.scrollLeft;

        iframes.forEach((target) => {
          if (target === iframe) return;
          try {
            const targetDoc = target.contentDocument || target.contentWindow?.document;
            if (targetDoc) {
              targetDoc.documentElement.scrollTop = scrollTop;
              targetDoc.body.scrollTop = scrollTop;
              targetDoc.documentElement.scrollLeft = scrollLeft;
              targetDoc.body.scrollLeft = scrollLeft;
            }
          } catch {
            // Ignore cross-origin errors
          }
        });
      };

      sourceDocument.addEventListener("scroll", syncHandler);
      cleanups.push(() => sourceDocument.removeEventListener("scroll", syncHandler));
    } catch {
      // Ignore cross-origin errors
    }
  });

  return () => cleanups.forEach((cleanup) => cleanup());
};

let cleanupSync: (() => void) | undefined;

watch([currentComparisonIndex, evals], async () => {
  await nextTick();
  if (cleanupSync) cleanupSync();
  cleanupSync = setupSyncScrolling();
});

onBeforeUnmount(() => {
  if (cleanupSync) cleanupSync();
});

const displayedIndices = computed(() => {
  if (winnerFilter.value === "all") {
    return evals.value.map((_, index) => index);
  }
  return evals.value
    .map((_, index) => index)
    .filter((index) => {
      const outcome = outcomes.value[index];
      if (winnerFilter.value === "tie") {
        return outcome === "tie";
      }
      return outcome === winnerFilter.value;
    });
});

const goToPrevious = () => {
  if (winnerFilter.value === "all") {
    currentComparisonIndex.value = Math.max(0, currentComparisonIndex.value - 1);
  } else {
    const currentFilteredIndex = displayedIndices.value.indexOf(currentComparisonIndex.value);
    if (currentFilteredIndex > 0) {
      currentComparisonIndex.value = displayedIndices.value[currentFilteredIndex - 1];
    }
  }
};

const goToNext = () => {
  if (winnerFilter.value === "all") {
    currentComparisonIndex.value = Math.min(evals.value.length - 1, currentComparisonIndex.value + 1);
  } else {
    const currentFilteredIndex = displayedIndices.value.indexOf(currentComparisonIndex.value);
    if (currentFilteredIndex < displayedIndices.value.length - 1) {
      currentComparisonIndex.value = displayedIndices.value[currentFilteredIndex + 1];
    }
  }
};

const goToComparison = (index: number) => {
  currentComparisonIndex.value = Math.max(0, Math.min(evals.value.length - 1, index));
};

watch([winnerFilter, displayedIndices], () => {
  if (
    winnerFilter.value !== "all" &&
    displayedIndices.value.length > 0 &&
    !displayedIndices.value.includes(currentComparisonIndex.value)
  ) {
    currentComparisonIndex.value = displayedIndices.value[0];
  }
});

const handleKeyPress = (e: KeyboardEvent) => {
  if (evals.value.length === 0) return;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      currentModelIndex.value =
        currentModelIndex.value > 0 ? currentModelIndex.value - 1 : folderNames.value.length - 1;
      break;
    case "ArrowRight":
      e.preventDefault();
      currentModelIndex.value = (currentModelIndex.value + 1) % folderNames.value.length;
      break;
    case "ArrowUp":
      e.preventDefault();
      goToPrevious();
      break;
    case "ArrowDown":
      e.preventDefault();
      goToNext();
      break;
    case "t":
    case "T":
      e.preventDefault();
      handleVote(currentComparisonIndex.value, "tie");
      break;
    case "Tab":
      e.preventDefault();
      currentModelIndex.value = (currentModelIndex.value + 1) % folderNames.value.length;
      break;
    default:
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const modelIndex = parseInt(e.key, 10) - 1;
        if (modelIndex < folderNames.value.length) {
          if (e.shiftKey) {
            currentModelIndex.value = modelIndex;
          } else {
            handleVote(currentComparisonIndex.value, modelIndex);
          }
        }
      }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyPress);
});

const addFolderInput = () => {
  folderPaths.value = [...folderPaths.value, ""];
};

const removeFolderInput = (index: number) => {
  folderPaths.value = folderPaths.value.filter((_, i) => i !== index);
};

const calculateStats = () => {
  const totalVotes = outcomes.value.filter((o) => o !== null).length;
  const stats = folderNames.value.map((name, index) => {
    const wins = outcomes.value.filter((o) => o === index).length;
    const percentage = totalVotes ? ((wins / totalVotes) * 100).toFixed(2) : "0.00";
    return { name, wins, percentage };
  });
  const ties = outcomes.value.filter((o) => o === "tie").length;
  const tiePercentage = totalVotes ? ((ties / totalVotes) * 100).toFixed(2) : "0.00";

  return { stats, ties, tiePercentage, totalVotes };
};

const loadEvals = async () => {
  if (folderPaths.value.some((path) => !path)) {
    alert("请选择所有文件夹路径");
    return;
  }

  isLoading.value = true;
  try {
    const queryParams = new URLSearchParams();
    folderPaths.value.forEach((path, index) => {
      queryParams.append(`folder${index + 1}`, path);
    });

    const response = await fetch(`${HTTP_BACKEND_URL}/best-of-n-evals?${queryParams}`);
    const data: BestOfNEvalsResponse = await response.json();

    evals.value = data.evals;
    outcomes.value = new Array(data.evals.length).fill(null);
    folderNames.value = data.folder_names;
    currentComparisonIndex.value = 0;
    currentModelIndex.value = 0;
    iframeRefs.value = [];
  } catch (error) {
    console.error("Error loading evals:", error);
    alert("加载评测失败。请检查文件夹路径后重试。");
  } finally {
    isLoading.value = false;
  }
};

const handleVote = (index: number, outcome: Outcome) => {
  const newOutcomes = [...outcomes.value];
  newOutcomes[index] = outcome;
  outcomes.value = newOutcomes;
};

const copyResultsAsCSV = async () => {
  const rows: string[] = [];
  stats.value.stats.forEach((stat) => {
    rows.push(`${stat.name}\t${stat.wins}\t${stat.percentage}%`);
  });
  if (stats.value.ties > 0) {
    rows.push(`平局\t${stats.value.ties}\t${stats.value.tiePercentage}%`);
  }

  const csvContent = rows.join("\n");

  try {
    await navigator.clipboard.writeText(csvContent);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = csvContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }
};

const stats = computed(calculateStats);
const currentEval = computed(() => evals.value[currentComparisonIndex.value]);

const openDialog = (html: string) => {
  selectedHtml.value = html;
  showDialog.value = true;
};

const progressLabel = computed(() => {
  if (winnerFilter.value === "all") {
    return `${currentComparisonIndex.value + 1} / ${evals.value.length}`;
  }
  return `${displayedIndices.value.indexOf(currentComparisonIndex.value) + 1} / ${displayedIndices.value.length}（已筛选）`;
});

const handleWinnerFilter = () => {
  if (winnerFilter.value === "all" || winnerFilter.value === "tie") {
    return;
  }
  winnerFilter.value = Number(winnerFilter.value);
};

const resetComparisons = () => {
  evals.value = [];
  outcomes.value = [];
  folderNames.value = [];
  currentComparisonIndex.value = 0;
  currentModelIndex.value = 0;
};
</script>
