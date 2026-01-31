<template>
  <div class="text-sm text-gray-500">
    当前技术栈：<span class="font-medium">{{ settings.generatedCodeConfig }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Settings } from "../../types";

defineProps<{ settings: Settings }>();

defineEmits<{ (e: "update-settings", value: Settings | ((prev: Settings) => Settings)): void }>();
</script>
