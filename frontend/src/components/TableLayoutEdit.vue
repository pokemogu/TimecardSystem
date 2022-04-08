<script setup lang="ts">

import { ref, onMounted } from 'vue';

const props = defineProps<{
  columnNames: string[],
  layout: { name: string, columnIndices: number[] },
  isOpened: boolean,
}>();

const isOpened = ref(false);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:layout', value: { name: string, columnIndices: number[] }): void,
  (event: 'submitDelete'): void,
  (event: 'submit'): void,
}>();

const layout = ref<{ name: string, columnIndices: number[] }>({
  name: props.layout.name, columnIndices: props.layout.columnIndices.map(columnIndex => columnIndex)
});
const unselectedColumns = ref<string[]>([]);
const selectedColumns = ref<string[]>([]);

const focusedUnselectedColumn = ref('');
const focusedSelectedColumn = ref('');

const layoutName = ref(props.layout.name);

onMounted(async () => {
  Array.prototype.push.apply(selectedColumns.value, layout.value.columnIndices.map(columnIndex => props.columnNames[columnIndex]));

  for (const columnName of props.columnNames) {
    if (!selectedColumns.value.some(column => column === columnName)) {
      unselectedColumns.value.push(columnName);
    }
  }
});

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onDelete(event: Event) {
  if (confirm('このレイアウトを削除しますか?')) {
    emits('update:isOpened', false);
    emits('submitDelete');
  }
}

function onSubmit(event: Event) {
  layout.value.columnIndices.splice(0);
  Array.prototype.push.apply(
    layout.value.columnIndices,
    selectedColumns.value.map(column => props.columnNames.findIndex(columnName => columnName === column))
  );
  layout.value.name = layoutName.value;
  //console.log(layout.value)
  emits('update:isOpened', false);
  emits('update:layout', layout.value);
  emits('submit');
}

function onAddColumnToSelected() {
  if (focusedUnselectedColumn.value === '') {
    return;
  }

  const unselectedIndex = unselectedColumns.value.findIndex(column => column === focusedUnselectedColumn.value);
  if (unselectedIndex >= 0) {
    unselectedColumns.value.splice(unselectedIndex, 1);
    selectedColumns.value.push(focusedUnselectedColumn.value);
  }
}

function onDeleteColumnFromSelected() {
  if (focusedSelectedColumn.value === '') {
    return;
  }

  const selectedIndex = selectedColumns.value.findIndex(column => column === focusedSelectedColumn.value);
  if (selectedIndex >= 0) {
    selectedColumns.value.splice(selectedIndex, 1);
    unselectedColumns.value.push(focusedSelectedColumn.value);

    if (layout.value) {
      unselectedColumns.value.splice(0);
      for (const columnName of props.columnNames) {
        if (!selectedColumns.value.some(column => column === columnName)) {
          unselectedColumns.value.push(columnName);
        }
      }
    }
  }
}

function onOrderUp() {
  if (focusedSelectedColumn.value === '') {
    return;
  }

  const selectedIndex = selectedColumns.value.findIndex(column => column === focusedSelectedColumn.value);
  if (selectedIndex >= 0) {
    if (selectedIndex === 0) {
      return;
    }

    const temp = selectedColumns.value[selectedIndex];
    selectedColumns.value[selectedIndex] = selectedColumns.value[selectedIndex - 1];
    selectedColumns.value[selectedIndex - 1] = temp;
  }
}

function onOrderDown() {
  if (focusedSelectedColumn.value === '') {
    return;
  }

  const selectedIndex = selectedColumns.value.findIndex(column => column === focusedSelectedColumn.value);
  if (selectedIndex >= 0) {
    if (selectedIndex >= (selectedColumns.value.length - 1)) {
      return;
    }

    const temp = selectedColumns.value[selectedIndex];
    selectedColumns.value[selectedIndex] = selectedColumns.value[selectedIndex + 1];
    selectedColumns.value[selectedIndex + 1] = temp;
  }
}

</script>

<template>
  <div class="overlay" id="privilege-root">
    <div class="modal-dialog modal-lg vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">レイアウト設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-start">
              <div class="col-5">
                <div class="row p-2">
                  <div class="col">列</div>
                </div>
                <div class="row">
                  <div class="col">
                    <select class="form-select" size="10" v-model="focusedUnselectedColumn">
                      <option v-for="(item, index) in unselectedColumns" :value="item">{{ item }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="col-1 align-self-center">
                <div class="row p-2">
                  <div class="col">
                    <button
                      class="btn btn-primary btn-sm"
                      type="button"
                      v-on:click="onAddColumnToSelected"
                      :disabled="focusedUnselectedColumn === ''"
                    >&#9656;</button>
                  </div>
                </div>
                <div class="row p-2">
                  <div class="col">
                    <button
                      class="btn btn-primary btn-sm"
                      type="button"
                      v-on:click="onDeleteColumnFromSelected"
                      :disabled="focusedSelectedColumn === ''"
                    >&#9666;</button>
                  </div>
                </div>
              </div>
              <div class="col-5">
                <div class="row p-2">
                  <div class="col-4">表示項目</div>
                  <div class="col-4">
                    <div class="btn-group" role="group">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        v-on:click="onOrderUp"
                        :disabled="focusedSelectedColumn === ''"
                      >&#9652;</button>
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        v-on:click="onOrderDown"
                        :disabled="focusedSelectedColumn === ''"
                      >&#9662;</button>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col">
                    <select class="form-select" size="10" v-model="focusedSelectedColumn">
                      <option v-for="(item, index) in selectedColumns" :value="item">{{ item }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div class="row justify-content-start p-2">
              <div class="col-11">
                <div class="input-group">
                  <span class="input-group-text">レイアウト名</span>
                  <input
                    type="text"
                    id="layout-name"
                    class="form-control"
                    v-model="layoutName"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="selectedColumns.length === 0"
            >設定</button>
            <button
              v-if="props.layout.name !== ''"
              type="button"
              class="btn btn-danger"
              v-on:click="onDelete"
            >削除</button>
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
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 100%;
  left: 0%;
  right: 0%;
}
</style>