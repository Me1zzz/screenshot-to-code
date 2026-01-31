import { watch } from "vue";

const CODING_SETTINGS = {
  title: "正在生成代码...",
  favicon: "/favicon/coding.png",
};
const DEFAULT_SETTINGS = {
  title: "截图生成代码",
  favicon: "/favicon/main.png",
};

export function useBrowserTabIndicator(isCoding: () => boolean) {
  watch(
    isCoding,
    (value) => {
      const settings = value ? CODING_SETTINGS : DEFAULT_SETTINGS;

      const faviconEl = document.querySelector(
        "link[rel='icon']"
      ) as HTMLLinkElement | null;
      if (faviconEl) {
        faviconEl.href = settings.favicon;
      }

      document.title = settings.title;
    },
    { immediate: true }
  );
}
