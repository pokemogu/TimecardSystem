<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  keyName: string,
  title: string,
  description: string,
  value: string,
  isMultiLine: boolean,
  isPassword: boolean,
  isNumeric: boolean
}>();

const configValue = ref(props.value);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:value', value: string): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

async function onSubmit(event: Event) {
  emits('update:isOpened', false);
  emits('update:value', configValue.value);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ props.title }} ({{ props.keyName }})</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col">
                {{ props.description }}
              </div>
            </div>
            <div class="row">
              <div class="col">
                <template v-if="props.isMultiLine">
                  <textarea class="form-control" rows="4" v-model="configValue"></textarea>
                </template>
                <template v-else-if="props.isPassword">
                  <input type="password" class="form-control" v-model="configValue">
                </template>
                <template v-else-if="props.isNumeric">
                  <input type="number" class="form-control" v-model="configValue">
                </template>
                <template v-else>
                  <input type="text" class="form-control" v-model="configValue">
                </template>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
              <button type="submit" class="btn btn-primary">設定</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  z-index: 998;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 20%;
  right: 20%;
}
</style>