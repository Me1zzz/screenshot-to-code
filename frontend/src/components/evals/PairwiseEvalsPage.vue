<template>
  <div class="mx-auto">
    <EvalNavigation />
    <div class="flex flex-col items-center justify-center w-full py-4 bg-zinc-950 text-white">
      <div class="flex flex-col gap-4 mb-4 w-full max-w-2xl px-4">
        <input
          type="text"
          v-model="folder1Path"
          placeholder="输入 Downloads 中的文件夹名"
          class="w-full px-4 py-2 rounded text-black"
        />
        <input
          type="text"
          v-model="folder2Path"
          placeholder="输入 Downloads 中的文件夹名"
          class="w-full px-4 py-2 rounded text-black"
        />
        <button
          type="button"
          @click="loadEvals"
          :disabled="isLoading"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          {{ isLoading ? "加载中..." : "开始比较" }}
        </button>
      </div>

      <div v-if="evals.length > 0">
        <span class="text-2xl font-semibold">总票数：{{ totalVotes }}</span>
        <div class="text-lg mt-2">
          <span>{{ folderNames.left }}: {{ leftWins }} ({{ leftPercentage }}%) | </span>
          <span>{{ folderNames.right }}: {{ rightWins }} ({{ rightPercentage }}%) | </span>
          <span>平局：{{ ties }} ({{ tiePercentage }}%)</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-y-8 mt-4 mx-auto justify-center">
      <div v-for="(evaluation, index) in evals" :key="index" class="flex flex-col justify-center">
        <h2 class="font-bold text-lg ml-4 mb-2">比较 {{ index + 1 }}</h2>

        <div class="w-full flex justify-center mb-4">
          <div class="w-1/2 p-1 border">
            <img :src="evaluation.input" :alt="`比较输入 ${index}`" />
          </div>
        </div>

        <div class="flex gap-x-4 justify-center">
          <div
            v-for="(output, outputIndex) in evaluation.outputs.slice(0, 2)"
            :key="outputIndex"
            class="w-1/2 p-1 border"
            :class="outcomes[index] === (outputIndex === 0 ? 'left' : 'right') ? 'border-green-500 border-4' : ''"
          >
            <div class="relative">
              <iframe
                :srcdoc="output"
                class="w-[1200px] h-[800px] transform scale-[0.55]"
                style="transform-origin: top left"
              ></iframe>
              <button
                type="button"
                class="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
                @click="openDialog(output)"
              >
                全屏查看
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-x-4 mt-4">
          <button
            type="button"
            class="px-4 py-2 rounded"
            :class="outcomes[index] === 'left' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'"
            @click="handleVote(index, 'left')"
          >
            左侧胜出
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded"
            :class="outcomes[index] === 'tie' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'"
            @click="handleVote(index, 'tie')"
          >
            平局
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded"
            :class="outcomes[index] === 'right' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'"
            @click="handleVote(index, 'right')"
          >
            右侧胜出
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-lg p-4 w-[95vw] h-[95vh]">
        <div class="flex justify-end mb-2">
          <button type="button" class="text-sm text-gray-500" @click="showDialog = false">关闭</button>
        </div>
        <iframe :srcdoc="selectedHtml" class="w-full h-full"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { HTTP_BACKEND_URL } from "../../config";
import EvalNavigation from "./EvalNavigation.vue";

interface Eval {
  input: string;
  outputs: string[];
}

type Outcome = "left" | "right" | "tie" | null;

interface PairwiseEvalsResponse {
  evals: Eval[];
  folder1_name: string;
  folder2_name: string;
}

const evals = ref<Eval[]>([]);
const outcomes = ref<Outcome[]>([]);
const folderNames = ref({ left: "", right: "" });
const folder1Path = ref("");
const folder2Path = ref("");
const isLoading = ref(false);
const selectedHtml = ref("");
const showDialog = ref(false);

const totalVotes = computed(() => outcomes.value.filter((o) => o !== null).length);
const leftWins = computed(() => outcomes.value.filter((o) => o === "left").length);
const rightWins = computed(() => outcomes.value.filter((o) => o === "right").length);
const ties = computed(() => outcomes.value.filter((o) => o === "tie").length);

const leftPercentage = computed(() =>
  totalVotes.value ? ((leftWins.value / totalVotes.value) * 100).toFixed(2) : "0.00"
);
const rightPercentage = computed(() =>
  totalVotes.value ? ((rightWins.value / totalVotes.value) * 100).toFixed(2) : "0.00"
);
const tiePercentage = computed(() =>
  totalVotes.value ? ((ties.value / totalVotes.value) * 100).toFixed(2) : "0.00"
);

const loadEvals = async () => {
  if (!folder1Path.value || !folder2Path.value) {
    alert("请输入两个文件夹路径");
    return;
  }

  isLoading.value = true;
  try {
    const queryParams = new URLSearchParams({
      folder1: `/Users/abi/Downloads/${folder1Path.value}`,
      folder2: `/Users/abi/Downloads/${folder2Path.value}`,
    });

    const response = await fetch(`${HTTP_BACKEND_URL}/pairwise-evals?${queryParams}`);
    const data: PairwiseEvalsResponse = await response.json();

    evals.value = data.evals;
    outcomes.value = new Array(data.evals.length).fill(null);
    folderNames.value = {
      left: data.folder1_name,
      right: data.folder2_name,
    };
  } catch (error) {
    console.error("Error loading evals:", error);
    alert("加载评测失败。请检查文件夹路径后重试。");
  } finally {
    isLoading.value = false;
  }
};

const handleVote = (index: number, outcome: Outcome) => {
  const nextOutcomes = [...outcomes.value];
  nextOutcomes[index] = outcome;
  outcomes.value = nextOutcomes;
};

const openDialog = (html: string) => {
  selectedHtml.value = html;
  showDialog.value = true;
};
</script>
