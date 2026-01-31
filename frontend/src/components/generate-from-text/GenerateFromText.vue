<template>
  <div class="rounded-md border border-gray-200 bg-white p-4">
    <label class="block text-sm text-gray-600 mb-2">从文字描述生成</label>
    <textarea
      v-model="prompt"
      class="w-full border rounded-md p-2 text-sm"
      rows="3"
      placeholder="请输入描述..."
    ></textarea>
    <button
      type="button"
      class="mt-3 rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
      @click="handleCreate"
    >
      生成
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ (e: "create-from-text", value: string): void }>();
const prompt = ref("");

const handleCreate = () => {
  emit("create-from-text", prompt.value);
  prompt.value = "";
};
</script>
