<template>
  <div class="px-6">
    <div class="rounded-md border border-gray-200 p-4 bg-white">
      <h2 class="text-lg font-semibold mb-2">预览区域</h2>
      <p class="text-sm text-gray-600">生成后的代码将在此处展示。</p>
      <div class="mt-4 flex gap-2">
        <button
          type="button"
          class="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
          @click="reset"
        >
          重置
        </button>
        <button
          type="button"
          class="rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          @click="doUpdate('请优化布局')"
        >
          示例更新
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Settings } from "../../types";

defineProps<{
  doUpdate: (instruction: string) => void;
  reset: () => void;
  settings: Settings;
}>();
</script>
