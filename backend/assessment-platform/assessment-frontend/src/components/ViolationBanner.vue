<script setup>
defineProps({
  message: { type: String, required: true },
  count: { type: Number, required: true },
  threshold: { type: Number, default: 3 },
});
</script>

<template>
  <div class="banner">
    <span class="msg">{{ message }}</span>
    <span class="count">{{ count }} / {{ threshold }} warnings</span>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  background: rgba(232, 93, 93, 0.12);
  border-bottom: 1px solid var(--signal-red);
  color: var(--signal-red);
  font-size: 0.85rem;
}

.count {
  font-family: var(--font-mono);
  white-space: nowrap;
}
</style>
