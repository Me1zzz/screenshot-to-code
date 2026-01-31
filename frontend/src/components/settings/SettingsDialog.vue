<template>
  <button class="text-sm text-gray-500 hover:text-gray-800" type="button">
    设置
  </button>
</template>

<script setup lang="ts">
import type { Settings } from "../../types";

defineProps<{ settings: Settings }>();

defineEmits<{ (e: "update-settings", value: Settings | ((prev: Settings) => Settings)): void }>();
</script>
