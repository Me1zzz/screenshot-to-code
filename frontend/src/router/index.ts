import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import AllEvalsPage from "../components/evals/AllEvalsPage.vue";
import EvalsPage from "../components/evals/EvalsPage.vue";
import PairwiseEvalsPage from "../components/evals/PairwiseEvalsPage.vue";
import BestOfNEvalsPage from "../components/evals/BestOfNEvalsPage.vue";
import RunEvalsPage from "../components/evals/RunEvalsPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: App },
    { path: "/evals", component: AllEvalsPage },
    { path: "/evals/single", component: EvalsPage },
    { path: "/evals/pairwise", component: PairwiseEvalsPage },
    { path: "/evals/best-of-n", component: BestOfNEvalsPage },
    { path: "/evals/run", component: RunEvalsPage },
  ],
});

export default router;
