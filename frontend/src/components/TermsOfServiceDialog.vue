<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div class="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-lg">
      <h2 class="text-lg font-semibold mb-2">服务条款</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
        使用前请确认已阅读并同意服务条款。
      </p>
      <div class="flex justify-end">
        <button
          class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          @click="emitOpenChange(false)"
        >
          我已阅读并同意
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "open-change", value: boolean): void }>();

const emitOpenChange = (value: boolean) => {
  emit("open-change", value);
};
</script>
