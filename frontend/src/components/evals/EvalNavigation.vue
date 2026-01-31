<template>
  <div class="flex justify-between items-center w-full py-3 px-4 bg-zinc-900 text-white">
    <div class="flex items-center space-x-4">
      <RouterLink to="/evals" class="font-medium hover:text-blue-300 transition-colors">
        评测首页
      </RouterLink>
      <div class="text-gray-500">|</div>
      <RouterLink to="/evals/run" class="hover:text-blue-300 transition-colors">
        运行
      </RouterLink>
      <RouterLink to="/evals/pairwise" class="hover:text-blue-300 transition-colors">
        成对比较
      </RouterLink>
      <RouterLink to="/evals/best-of-n" class="hover:text-blue-300 transition-colors">
        N 选最佳
      </RouterLink>
      <RouterLink to="/evals/single" class="hover:text-blue-300 transition-colors">
        单模型
      </RouterLink>
    </div>

    <RouterLink to="/" class="text-sm text-gray-300 hover:text-white transition-colors">
      ← 返回应用
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>
