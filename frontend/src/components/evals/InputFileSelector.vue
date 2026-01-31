<template>
  <div class="w-full">
    <div
      class="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-md p-2 mb-2 border"
      @click="toggleExpanded"
    >
      <div class="flex items-center gap-2">
        <span class="text-gray-500">
          <svg
            v-if="isExpanded"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <div>
          <span class="text-sm font-medium">输入文件</span>
          <span class="ml-2 text-xs text-gray-500">已选 {{ selectedCount }} / {{ fileCount }}</span>
        </div>
      </div>
      <div class="flex space-x-1" @click.stop>
        <button
          type="button"
          class="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
          :disabled="selectedCount === fileCount"
          @click="handleSelectAll"
        >
          全选
        </button>
        <button
          type="button"
          class="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
          :disabled="selectedCount === 0"
          @click="handleClearAll"
        >
          全不选
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center text-sm text-gray-500">正在加载输入文件...</div>

    <div v-else-if="isExpanded" class="border rounded-md overflow-hidden">
      <div class="max-h-48 overflow-y-auto">
        <div class="grid grid-cols-1 divide-y divide-gray-100">
          <div
            v-for="file in inputFiles"
            :key="file.path"
            class="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-50"
            :class="selectedFiles.includes(file.path) ? 'bg-blue-50' : ''"
            @click="handleFileToggle(file.path)"
          >
            <span class="text-xs truncate pr-2" :title="file.name">{{ file.name }}</span>
            <span v-if="selectedFiles.includes(file.path)" class="text-blue-500">
              <svg class="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6L9 17l-5-5 1.4-1.4L9 14.2 18.6 4.6 20 6z" />
              </svg>
            </span>
            <span v-else class="h-3 w-3 border rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { HTTP_BACKEND_URL } from "../../config";

interface InputFile {
  name: string;
  path: string;
}

const emit = defineEmits<{ (e: "files-selected", files: string[]): void }>();

const inputFiles = ref<InputFile[]>([]);
const selectedFiles = ref<string[]>([]);
const isLoading = ref(false);
const isExpanded = ref(false);

const fileCount = computed(() => inputFiles.value.length);
const selectedCount = computed(() => selectedFiles.value.length);

const fetchInputFiles = async () => {
  isLoading.value = true;
  try {
    const response = await fetch(`${HTTP_BACKEND_URL}/eval_input_files`);
    if (!response.ok) {
      throw new Error("获取输入文件失败");
    }

    const data = await response.json();
    inputFiles.value = data;

    const allFilePaths = data.map((file: InputFile) => file.path);
    selectedFiles.value = allFilePaths;
    emit("files-selected", allFilePaths);
  } catch (error) {
    console.error("Error fetching input files:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchInputFiles();
});

const handleFileToggle = (filePath: string) => {
  if (selectedFiles.value.includes(filePath)) {
    selectedFiles.value = selectedFiles.value.filter((path) => path !== filePath);
  } else {
    selectedFiles.value = [...selectedFiles.value, filePath];
  }
  emit("files-selected", selectedFiles.value);
};

const handleSelectAll = () => {
  const allFilePaths = inputFiles.value.map((file) => file.path);
  selectedFiles.value = allFilePaths;
  emit("files-selected", allFilePaths);
};

const handleClearAll = () => {
  selectedFiles.value = [];
  emit("files-selected", []);
};

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};
</script>
