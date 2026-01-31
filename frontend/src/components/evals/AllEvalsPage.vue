<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold text-gray-900">评测仪表盘</h1>
        <RouterLink
          to="/"
          class="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          ← 返回应用
        </RouterLink>
      </div>
      <div class="space-y-4">
        <RouterLink
          to="/evals/run"
          class="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-800">运行评测</h2>
          <p class="text-gray-600">生成多个模型的评测结果</p>
        </RouterLink>

        <RouterLink
          to="/evals/pairwise"
          class="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-800">成对比较</h2>
          <p class="text-gray-600">比较两个不同模型的输出</p>
        </RouterLink>

        <RouterLink
          to="/evals/best-of-n"
          class="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-800">N 选最佳</h2>
          <p class="text-gray-600">并排比较多个模型输出</p>
        </RouterLink>

        <RouterLink
          to="/evals/single"
          class="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <h2 class="text-xl font-semibold text-gray-800">单模型评测</h2>
          <p class="text-gray-600">对单个模型输出进行评分</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>
