<template>
  <div class="flex gap-x-2">
    <button
      v-for="rating in ratings"
      :key="rating"
      type="button"
      @click="emit('select', rating)"
      :class="[
        'w-8 h-8 rounded-full border border-gray-300',
        value === rating ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white',
      ]"
    >
      {{ rating }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    maxRating?: number;
    value?: number;
  }>(),
  { maxRating: 5, value: 0 }
);

const emit = defineEmits<{ (e: "select", rating: number): void }>();

const ratings = computed(() =>
  Array.from({ length: props.maxRating }, (_, i) => i + 1)
);
</script>
