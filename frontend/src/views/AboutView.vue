<script setup lang="ts">
import axios from 'axios';

(async () => {
  const response = await axios.get('/assets/AboutView.ab071ea6.css');
  console.log(response.data);
})();

</script>

<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
