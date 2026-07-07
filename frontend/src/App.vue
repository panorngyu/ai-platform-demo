<script setup lang="ts">
// 根组件
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
#app {
  height: 100%;
  width: 100%;
}
</style>
