import { ref, watch, type Ref } from "vue";

type PersistedStateResult<T> = {
  state: Ref<T>;
  setState: (value: T | ((prev: T) => T)) => void;
};

export function usePersistedState<T>(defaultValue: T, key: string): PersistedStateResult<T> {
  const storedValue = window.localStorage.getItem(key);
  const initialValue = storedValue ? (JSON.parse(storedValue) as T) : defaultValue;
  const state = ref<T>(initialValue) as Ref<T>;

  const setState = (value: T | ((prev: T) => T)) => {
    state.value = typeof value === "function" ? (value as (prev: T) => T)(state.value) : value;
  };

  watch(
    state,
    (nextValue) => {
      window.localStorage.setItem(key, JSON.stringify(nextValue));
    },
    { deep: true }
  );

  return { state, setState };
}
