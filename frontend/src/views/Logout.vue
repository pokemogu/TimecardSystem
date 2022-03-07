<script setup lang="ts">
import { useRouter } from 'vue-router';
import { provide, inject } from 'vue';
import type { TimecardSession } from '../timecard-session-interface';

const router = useRouter();

const session = inject<TimecardSession>('session');
if (session) {
  session.refreshToken = null;
  session.userId = null;
  session.userName = null;
}

router.push('/');

</script>

<template></template>