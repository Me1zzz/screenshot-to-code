<template>
  <div class="mx-auto">
    <EvalNavigation />
    <div class="flex flex-col items-center justify-center w-full py-4 bg-zinc-950 text-white">
      <div class="flex flex-col gap-4 mb-4 w-full max-w-2xl px-4">
        <input
          type="text"
          v-model="folderPath"
          placeholder="输入 Downloads 中的文件夹名"
          class="w-full px-4 py-2 rounded text-black"
        />
        <button
          type="button"
          @click="loadEvals"
          :disabled="isLoading"
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          {{ isLoading ? "加载中..." : "加载评测" }}
        </button>
      </div>

      <div v-if="evals.length > 0" class="flex flex-col items-center gap-2 text-lg">
        <h2 class="text-2xl font-semibold mb-2">按类别评分</h2>
        <div v-for="(score, criterion) in calculateScores()" :key="criterion" class="flex gap-x-4 items-center">
          <span class="min-w-[200px] text-right">
            {{ getCriterionLabel(criterion) }}：
          </span>
          <span>{{ score.total }} / {{ score.max }} ({{ score.percentage }}%)</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-y-8 mt-4 mx-auto justify-center">
      <div v-for="(evaluation, index) in evals" :key="index" class="flex flex-col justify-center">
        <h2 class="font-bold text-lg ml-4">评测 {{ index + 1 }}</h2>
        <div class="flex gap-x-2 justify-center ml-4">
          <div class="w-1/2 p-1 border">
            <img :src="evaluation.input" :alt="`评测输入 ${index}`" />
          </div>
          <div v-for="(output, outputIndex) in evaluation.outputs" :key="outputIndex" class="w-1/2 p-1 border">
            <div class="mb-2">
              <button
                type="button"
                @click="toggleSourceView(index)"
                class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
              >
                {{ outputDisplays[index]?.showSource ? "显示预览" : "显示源码" }}
              </button>
            </div>
            <pre
              v-if="outputDisplays[index]?.showSource"
              class="whitespace-pre-wrap text-sm p-2 bg-gray-100 max-h-[480px] overflow-auto"
            >{{ output }}</pre>
            <iframe
              v-else
              :srcdoc="output"
              class="w-[1200px] h-[800px] transform scale-[0.60]"
              style="transform-origin: top left"
            ></iframe>
          </div>
        </div>
        <div class="ml-8 mt-4 space-y-2">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="flex items-center gap-x-4">
              <span class="min-w-[160px]">技术栈符合度：</span>
              <RatingPicker
                :value="ratings[index]?.stackAdherence"
                :max-rating="5"
                @select="(rating) => updateRating(index, 'stackAdherence', rating)"
              />
            </div>
            <div class="flex items-center gap-x-4">
              <span class="min-w-[160px]">准确度：</span>
              <RatingPicker
                :value="ratings[index]?.accuracy"
                :max-rating="5"
                @select="(rating) => updateRating(index, 'accuracy', rating)"
              />
            </div>
            <div class="flex items-center gap-x-4">
              <span class="min-w-[160px]">代码质量：</span>
              <RatingPicker
                :value="ratings[index]?.codeQuality"
                :max-rating="5"
                @select="(rating) => updateRating(index, 'codeQuality', rating)"
              />
            </div>
            <div class="flex items-center gap-x-4">
              <span class="min-w-[160px]">移动端适配：</span>
              <RatingPicker
                :value="ratings[index]?.mobileResponsiveness"
                :max-rating="5"
                @select="(rating) => updateRating(index, 'mobileResponsiveness', rating)"
              />
            </div>
            <div class="flex items-center gap-x-4">
              <span class="min-w-[160px]">图片描述质量：</span>
              <RatingPicker
                :value="ratings[index]?.imageCaptionQuality"
                :max-rating="5"
                @select="(rating) => updateRating(index, 'imageCaptionQuality', rating)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { HTTP_BACKEND_URL } from "../../config";
import RatingPicker from "./RatingPicker.vue";
import EvalNavigation from "./EvalNavigation.vue";

interface Eval {
  input: string;
  outputs: string[];
}

interface RatingCriteria {
  stackAdherence: number;
  accuracy: number;
  codeQuality: number;
  mobileResponsiveness: number;
  imageCaptionQuality: number;
}

interface OutputDisplay {
  showSource: boolean;
}

const evals = ref<Eval[]>([]);
const ratings = ref<RatingCriteria[]>([]);
const folderPath = ref("");
const isLoading = ref(false);
const outputDisplays = ref<OutputDisplay[]>([]);

const criterionLabels: Record<keyof RatingCriteria, string> = {
  stackAdherence: "技术栈符合度",
  accuracy: "准确度",
  codeQuality: "代码质量",
  mobileResponsiveness: "移动端适配",
  imageCaptionQuality: "图片描述质量",
};

const getCriterionLabel = (criterion: string) => {
  return criterionLabels[criterion as keyof RatingCriteria] ?? criterion;
};

const calculateScores = () => {
  if (ratings.value.length === 0) {
    return {
      stackAdherence: { total: 0, max: 0, percentage: "0.00" },
      accuracy: { total: 0, max: 0, percentage: "0.00" },
      codeQuality: { total: 0, max: 0, percentage: "0.00" },
      mobileResponsiveness: { total: 0, max: 0, percentage: "0.00" },
      imageCaptionQuality: { total: 0, max: 0, percentage: "0.00" },
    };
  }

  const maxPerCriterion = ratings.value.length * 5;

  const totals = ratings.value.reduce(
    (acc, rating) => ({
      stackAdherence: acc.stackAdherence + rating.stackAdherence,
      accuracy: acc.accuracy + rating.accuracy,
      codeQuality: acc.codeQuality + rating.codeQuality,
      mobileResponsiveness: acc.mobileResponsiveness + rating.mobileResponsiveness,
      imageCaptionQuality: acc.imageCaptionQuality + rating.imageCaptionQuality,
    }),
    {
      stackAdherence: 0,
      accuracy: 0,
      codeQuality: 0,
      mobileResponsiveness: 0,
      imageCaptionQuality: 0,
    }
  );

  return Object.entries(totals).reduce(
    (acc, [key, total]) => ({
      ...acc,
      [key]: {
        total,
        max: maxPerCriterion,
        percentage: ((total / maxPerCriterion) * 100).toFixed(2),
      },
    }),
    {} as Record<keyof RatingCriteria, { total: number; max: number; percentage: string }>
  );
};

const loadEvals = async () => {
  if (!folderPath.value) {
    alert("请输入文件夹路径");
    return;
  }

  isLoading.value = true;
  try {
    const queryParams = new URLSearchParams({
      folder: `/Users/abi/Downloads/${folderPath.value}`,
    });

    const response = await fetch(`${HTTP_BACKEND_URL}/evals?${queryParams}`);
    const data = await response.json();

    evals.value = data;
    ratings.value = data.map(() => ({
      stackAdherence: 0,
      accuracy: 0,
      codeQuality: 0,
      mobileResponsiveness: 0,
      imageCaptionQuality: 0,
    }));
  } catch (error) {
    console.error("Error loading evals:", error);
    alert("加载评测失败。请检查文件夹路径后重试。");
  } finally {
    isLoading.value = false;
  }
};

const updateRating = (index: number, criterion: keyof RatingCriteria, value: number) => {
  const nextRatings = [...ratings.value];
  nextRatings[index] = {
    ...nextRatings[index],
    [criterion]: value,
  };
  ratings.value = nextRatings;
};

const toggleSourceView = (evalIndex: number) => {
  const nextDisplays = [...outputDisplays.value];
  if (!nextDisplays[evalIndex]) {
    nextDisplays[evalIndex] = { showSource: false };
  }
  nextDisplays[evalIndex] = { showSource: !nextDisplays[evalIndex].showSource };
  outputDisplays.value = nextDisplays;
};
</script>
