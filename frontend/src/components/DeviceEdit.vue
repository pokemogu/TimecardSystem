<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  account: string,
  name: string
}>();

const deviceAccount = ref(props.account);
const deviceName = ref(props.name);
const isNewDevice = ref(props.account === '' ? true : false);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:account', value: string): void,
  (event: 'update:name', value: string): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

async function onSubmit(event: Event) {
  emits('update:isOpened', false);
  emits('update:account', deviceAccount.value);
  emits('update:name', deviceName.value);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">端末設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <p>
              <span v-if="props.account === ''">端末IDと</span>端末名を設定してください。
            </p>
            <div class="row">
              <label for="date" class="col-6 col-form-label">端末ID</label>
              <div class="col-6">
                <input
                  type="text"
                  class="form-control p-2"
                  id="account"
                  pattern="^[0-9A-Za-z\-_]+$"
                  maxlength="255"
                  title="半角英数字、及びハイフン文字のみ使用可能です"
                  v-model="deviceAccount"
                  required
                  :disabled="!isNewDevice"
                />
              </div>
            </div>
            <div class="row">
              <label for="name" class="col-6 col-form-label">端末名</label>
              <div class="col-6">
                <input type="text" class="form-control p-2" id="name" v-model="deviceName" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
              <button
                type="submit"
                class="btn btn-primary"
                v-bind:disabled="deviceAccount === '' || deviceName === ''"
              >設定</button>
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