import { ref, watch, type Ref } from "vue";

export function useThrottle(value: Ref<string>, interval = 500) {
  const throttledValue = ref(value.value);
  const lastUpdated = ref<number | null>(null);

  watch(
    value,
    (nextValue) => {
      const now = performance.now();

      if (!lastUpdated.value || now >= lastUpdated.value + interval) {
        lastUpdated.value = now;
        throttledValue.value = nextValue;
      } else {
        const id = window.setTimeout(() => {
          lastUpdated.value = now;
          throttledValue.value = nextValue;
        }, interval);

        return () => window.clearTimeout(id);
      }
    },
    { immediate: true }
  );

  return throttledValue;
}
