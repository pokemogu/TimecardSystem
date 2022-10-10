<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  date: string,
  name: string
}>();

const hoildayDate = ref(props.date ? props.date : '');
hoildayDate.value = hoildayDate.value.replace(/\//g, '-');
const holidayName = ref(props.name ? props.name : '');
const isNewHoliday = ref(props.date ? false : true);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:date', value: string): void,
  (event: 'update:name', value: string): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
  emits('update:date', hoildayDate.value.replace('-', '/'));
  emits('update:name', holidayName.value);
}

async function onSubmit(event: Event) {
  emits('update:isOpened', false);
  emits('update:date', hoildayDate.value.replace(/\-/g, '/'));
  emits('update:name', holidayName.value);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">休日設定</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <p>休日設定する日付と休日名を入力してください。</p>
          <div class="row">
            <label for="date" class="col-6 col-form-label">日付</label>
            <div class="col-6">
              <input type="date" class="form-control p-2" id="date" v-model="hoildayDate" required
                :disabled="!isNewHoliday" />
            </div>
          </div>
          <div class="row">
            <label for="name" class="col-6 col-form-label">休日名</label>
            <div class="col-6">
              <input type="text" class="form-control p-2" id="name" v-model="holidayName" required />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button type="button" class="btn btn-primary" v-bind:disabled="hoildayDate === '' || holidayName === ''"
              v-on:click="onSubmit"><span v-if="isNewHoliday">追加</span><span v-else>変更</span></button>
          </div>
        </div>
      </div>
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