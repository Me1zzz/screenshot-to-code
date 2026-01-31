<template>
  <div class="space-y-4">
    <div class="text-xs text-gray-400">辅助操作</div>
    <textarea
      v-model="instruction"
      class="w-full border rounded-md p-2 text-sm"
      placeholder="告诉 AI 要改什么..."
      @keydown.enter.exact.prevent="handleUpdate"
    ></textarea>
    <div class="flex gap-2">
      <button
        type="button"
        class="flex-1 rounded bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
        @click="handleUpdate"
      >
        更新
      </button>
      <button
        type="button"
        class="rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
        @click="regenerate"
      >
        重新生成
      </button>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
        @click="cancelCodeGeneration"
      >
        取消生成
      </button>
      <span v-if="showSelectAndEditFeature" class="text-xs text-gray-400 self-center">
        选区编辑已启用
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  showSelectAndEditFeature: boolean;
  doUpdate: (instruction: string) => void;
  regenerate: () => void;
  cancelCodeGeneration: () => void;
}>();

const instruction = ref("");

const handleUpdate = () => {
  props.doUpdate(instruction.value);
  instruction.value = "";
};
</script>
