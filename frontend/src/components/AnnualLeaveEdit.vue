<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';
import { format } from 'fecha';

import { useSessionStore } from '@/stores/session';

import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  account: string,
  annualLeaves: apiif.AnnualLeaveResponseData[],
}>();

const annualLeaves = ref<{
  id?: number, grantedAt: string, expireAt: string,
  dayAmount: number, hourAmount: number
}[]>([]);


for (const annualLeave of props.annualLeaves) {
  annualLeaves.value.push({
    id: annualLeave.id,
    grantedAt: format(annualLeave.grantedAt, 'isoDate'), expireAt: format(annualLeave.expireAt, 'isoDate'),
    dayAmount: annualLeave.dayAmount, hourAmount: annualLeave.hourAmount
  });
}

const isOpened = ref(false);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:annualLeaves', value: apiif.AnnualLeaveRequestData[]): void,
  (event: 'update:workPattern', value: apiif.WorkPatternRequestData): void,
  (event: 'submit', value: number[]): void,
}>();

onMounted(async () => {
});

function onClose(event: Event) {
  emits('update:isOpened', false);
}

const deletedLeaveIds: number[] = [];

function onSubmit(event: Event) {

  for (const leave of annualLeaves.value) {
    const dupLeaves = annualLeaves.value.filter(annualLeave => annualLeave.grantedAt === leave.grantedAt && annualLeave.expireAt === leave.expireAt);
    if (dupLeaves.length > 1) {
      alert('付与日と失効日が重複している有給設定があります。');
      return;
    }
  }

  const result = annualLeaves.value.map(annualLeave => {
    return <apiif.AnnualLeaveRequestData>{
      account: props.account,
      grantedAt: new Date(annualLeave.grantedAt), expireAt: new Date(annualLeave.expireAt),
      dayAmount: annualLeave.dayAmount, hourAmount: annualLeave.hourAmount
    };
  });

  emits('update:isOpened', false);
  emits('update:annualLeaves', result);
  emits('submit', deletedLeaveIds);
}

function onDeleteAnnualLeave(index: number) {
  const id = annualLeaves.value[index].id;
  if (id) {
    deletedLeaveIds.push(id);
  }
  annualLeaves.value.splice(index, 1);
}

function onAddAnnualLeave() {
  const nowdate = new Date();
  const expdate = new Date(nowdate);
  expdate.setFullYear(expdate.getFullYear() + 2);

  annualLeaves.value.push({
    grantedAt: format(nowdate, 'isoDate'), expireAt: format(expdate, 'isoDate'),
    dayAmount: 10.0, hourAmount: 8.0
  });
}

</script>

<template>
  <div class="overlay" id="approval-route-root">
    <div class="modal-dialog modal-lg vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">有給休暇設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="overflow-auto leave-table">
                <table class="table">
                  <thead>
                    <tr>
                      <th scope="col">削除</th>
                      <th scope="col">付与日</th>
                      <th scope="col">失効日</th>
                      <th scope="col">付与日数</th>
                      <th scope="col">付与時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(annualLeave, index) in annualLeaves">
                      <td>
                        <button type="button" class="btn btn-danger btn-sm"
                          v-on:click="onDeleteAnnualLeave(index)">&times;</button>
                      </td>
                      <td>
                        <input type="date" class="form-control" v-model="annualLeave.grantedAt" required
                          :disabled="annualLeave.id !== undefined" />
                      </td>
                      <td>
                        <input type="date" class="form-control" v-model="annualLeave.expireAt" required
                          :disabled="annualLeave.id !== undefined" />
                      </td>
                      <td>
                        <div class="input-group">
                          <input type="number" min="0" step="0.5" class="form-control" v-model="annualLeave.dayAmount"
                            required />
                          <span class="input-group-text">日</span>
                        </div>
                      </td>
                      <td>
                        <div class="input-group">
                          <input type="number" min="0" class="form-control" v-model="annualLeave.hourAmount" required />
                          <span class="input-group-text">時間</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colspan="5">
                        <button type="button" class="btn btn-primary" v-on:click="onAddAnnualLeave">追加</button>
                      </th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button type="submit" class="btn btn-primary">設定</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 997;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 0%;
  right: 0%;
}

.leave-table {
  max-height: 400px;
}
</style>