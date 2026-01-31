<template>
  <div>
    <EvalNavigation />

    <div class="container mx-auto px-4 py-6">
      <div class="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4 max-w-5xl mx-auto">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap justify-between items-center">
            <h1 class="text-2xl font-bold">运行评测</h1>
            <button
              type="button"
              :disabled="isRunning || !canRunEvals"
              class="min-w-[120px] text-white px-4 py-2 rounded"
              :class="isRunning ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'"
              @click="runEvals"
            >
              {{ isRunning ? "运行中..." : "运行评测" }}
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-gray-100 pt-3">
            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700">模型</span>
              <span class="text-sm text-gray-600 font-mono">{{ formatModelList() }}</span>
            </div>

            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700">技术栈</span>
              <span class="text-sm text-gray-600 font-mono">{{ selectedStack }}</span>
            </div>

            <div class="flex flex-col">
              <span class="text-sm font-medium text-gray-700">输入文件</span>
              <span class="text-sm text-gray-600">已选 {{ selectedFiles.length }} 个</span>
            </div>
          </div>

          <div
            class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer mt-1 hover:bg-gray-50 inline-block rounded px-2 py-1"
            @click="showPaths = !showPaths"
          >
            <svg v-if="showPaths" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
            <svg v-else class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span class="font-medium">路径</span>
          </div>

          <div v-if="showPaths" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-md">
            <div>
              <span class="font-medium">输入路径：</span>
              <code class="ml-2 bg-gray-100 px-2 py-0.5 rounded">backend/evals_data/inputs</code>
            </div>
            <div>
              <span class="font-medium">输出路径：</span>
              <code class="ml-2 bg-gray-100 px-2 py-0.5 rounded">backend/evals_data/outputs</code>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
            <h2 class="font-medium">选择模型</h2>
          </div>
          <div class="p-3">
            <div class="border rounded-md max-h-[300px] overflow-y-auto">
              <div class="grid grid-cols-1 divide-y divide-gray-100">
                <div
                  v-for="model in models"
                  :key="model"
                  class="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                  :class="selectedModels.includes(model) ? 'bg-blue-50' : ''"
                  @click="handleModelToggle(model)"
                >
                  <span class="text-sm truncate" :title="model">{{ model }}</span>
                  <span v-if="selectedModels.includes(model)" class="text-blue-500">
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 6L9 17l-5-5 1.4-1.4L9 14.2 18.6 4.6 20 6z" />
                    </svg>
                  </span>
                  <span v-else class="h-3.5 w-3.5 border rounded-sm" />
                </div>
              </div>
            </div>
            <div class="flex justify-between mt-2 text-xs">
              <p class="text-gray-500">已选：{{ selectedModels.length }} / {{ models.length }}</p>
              <div class="space-x-2">
                <button
                  v-if="selectedModels.length < models.length"
                  type="button"
                  class="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                  @click="handleSelectAll"
                >
                  全选
                </button>
                <button
                  v-if="selectedModels.length > 0"
                  type="button"
                  class="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                  @click="selectedModels = []"
                >
                  清空
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
            <h2 class="font-medium">选择技术栈</h2>
          </div>
          <div class="p-3">
            <select
              v-model="selectedStack"
              class="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="stack in stacks" :key="stack" :value="stack">{{ stack }}</option>
            </select>
          </div>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 shadow-sm lg:col-span-1 md:col-span-2">
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
            <h2 class="font-medium">选择输入文件</h2>
          </div>
          <div class="p-3">
            <InputFileSelector @files-selected="handleFilesSelected" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { HTTP_BACKEND_URL } from "../../config";
import InputFileSelector from "./InputFileSelector.vue";
import EvalNavigation from "./EvalNavigation.vue";

interface ModelResponse {
  models: string[];
  stacks: string[];
}

const isRunning = ref(false);
const models = ref<string[]>([]);
const stacks = ref<string[]>([]);
const selectedModels = ref<string[]>([]);
const selectedStack = ref<string>("html_tailwind");
const selectedFiles = ref<string[]>([]);
const showPaths = ref(false);

onMounted(async () => {
  const response = await fetch(`${HTTP_BACKEND_URL}/models`);
  const data: ModelResponse = await response.json();
  models.value = data.models;
  stacks.value = data.stacks;
});

onBeforeUnmount(() => {
  document.title = "截图生成代码";
});

const runEvals = async () => {
  try {
    isRunning.value = true;
    document.title = "正在运行评测...";

    const response = await fetch(`${HTTP_BACKEND_URL}/run_evals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        models: selectedModels.value,
        stack: selectedStack.value,
        files: selectedFiles.value,
      }),
    });

    if (!response.ok) {
      throw new Error("运行评测失败");
    }

    const outputFiles = await response.json();
    console.log("Generated files:", outputFiles);

    document.title = "✓ 评测完成";
  } catch (error) {
    console.error("Error running evals:", error);
    document.title = "❌ 评测错误";
    setTimeout(() => {
      document.title = "截图生成代码";
    }, 5000);
  } finally {
    isRunning.value = false;
  }
};

const handleModelToggle = (model: string) => {
  if (selectedModels.value.includes(model)) {
    selectedModels.value = selectedModels.value.filter((m) => m !== model);
  } else {
    selectedModels.value = [...selectedModels.value, model];
  }
};

const handleSelectAll = () => {
  selectedModels.value = models.value;
};

const handleFilesSelected = (files: string[]) => {
  selectedFiles.value = files;
};

const formatModelList = () => {
  if (selectedModels.value.length === 0) return "无";
  if (selectedModels.value.length === 1) return selectedModels.value[0];
  if (selectedModels.value.length <= 2) return selectedModels.value.join(", ");
  return `${selectedModels.value.slice(0, 2).join(", ")} +${
    selectedModels.value.length - 2
  } 个`;
};

const canRunEvals = computed(
  () => selectedModels.value.length > 0 && selectedFiles.value.length > 0
);
</script>
