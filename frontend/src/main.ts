import { createApp } from "vue";
import { createPinia } from "pinia";
import Toast, { PluginOptions } from "vue-toastification";
import "vue-toastification/dist/index.css";
import "./index.css";
import router from "./router";
import RootApp from "./RootApp.vue";

const app = createApp(RootApp);
const pinia = createPinia();

const toastOptions: PluginOptions = {
  toastClassName: "dark:bg-zinc-950 dark:text-white",
};

app.use(pinia);
app.use(router);
app.use(Toast, toastOptions);

app.mount("#root");
