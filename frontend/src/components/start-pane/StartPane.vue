<template>
  <div class="px-6">
    <div class="rounded-md border border-gray-200 p-4 bg-white">
      <h2 class="text-lg font-semibold mb-2">开始创建</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          @click="handleCreate"
        >
          从截图开始
        </button>
        <button
          type="button"
          class="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
          @click="handleImport"
        >
          从代码导入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Settings } from "../../types";
import { Stack } from "../../lib/stacks";

const props = defineProps<{
  doCreate: (referenceImages: string[], mode: "image" | "video", textPrompt?: string) => void;
  importFromCode: (code: string, stack: Stack) => void;
  settings: Settings;
}>();

defineEmits<{ (e: "update-settings", value: Settings | ((prev: Settings) => Settings)): void }>();

const handleCreate = () => {
  props.doCreate([], "image");
};

const handleImport = () => {
  props.importFromCode("", Stack.HTML_TAILWIND);
};
</script>
