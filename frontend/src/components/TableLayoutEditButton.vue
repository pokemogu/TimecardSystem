<script setup lang="ts">
import { ref, watch } from 'vue';
import TableLayoutEdit from '@/components/TableLayoutEdit.vue';

const props = defineProps<{
  columnNames: string[],
  layouts: { name: string, columnIndices: number[] }[],
  defaultLayout: { name: string, columnIndices: number[] },
  //selectedLayoutName: string,
  selectedLayout: { name: string, columnIndices: number[] }
}>();

const isTableLayoutEditOpened = ref(false);
const selectedLayoutName = ref('');
const layouts = ref(props.layouts.map(layout => {
  return {
    name: layout.name,
    columnIndices: layout.columnIndices.map(columnIndex => columnIndex)
  };
}));

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:layouts', value: { name: string, columnIndices: number[] }[]): void,
  //(event: 'update:selectedLayoutName', value: string): void,
  (event: 'update:selectedLayout', value: { name: string, columnIndices: number[] }): void,
  (event: 'submit'): void,
}>();

const selectedLayout = ref<{ name: string, columnIndices: number[] }>({
  name: props.selectedLayout.name,
  columnIndices: props.selectedLayout.columnIndices.map(columnIndex => columnIndex)
});

const editingLayout = ref<{ name: string, columnIndices: number[] }>({
  name: '',
  columnIndices: []
});

function setSelectedLayout(layout: { name: string, columnIndices: number[] }) {
  selectedLayout.value.name = layout.name;
  selectedLayout.value.columnIndices.splice(0);
  selectedLayoutName.value = selectedLayout.value.name;
  Array.prototype.push.apply(selectedLayout.value.columnIndices, layout.columnIndices);

  //emits('update:selectedLayoutName', selectedLayoutName.value);
  emits('update:selectedLayout', layout);
}

function setEditLayout(layout: { name: string, columnIndices: number[] }) {
  editingLayout.value.name = layout.name;
  editingLayout.value.columnIndices.splice(0);
  Array.prototype.push.apply(editingLayout.value.columnIndices, layout.columnIndices);
}

const isNewEdit = ref(false);

function onSubmit() {
  if (!isNewEdit.value) {
    if (selectedLayout.value.name !== editingLayout.value.name) {
      // レイアウト名が変更された場合、変更後のレイアウト名が重複していないかどうか確認する
      if (layouts.value.some(layout => layout.name === editingLayout.value.name)) {
        alert('レイアウト名が重複しています');
        return;
      }
    }
    const layoutIndex = layouts.value.findIndex(layout => layout.name === selectedLayout.value.name);
    if (layoutIndex >= 0) {
      layouts.value[layoutIndex].name = editingLayout.value.name;
      layouts.value[layoutIndex].columnIndices.splice(0);
      Array.prototype.push.apply(layouts.value[layoutIndex].columnIndices, editingLayout.value.columnIndices);
    }
  }
  else {
    if (layouts.value.some(layout => layout.name === editingLayout.value.name)) {
      alert('レイアウト名が重複しています');
      return;
    }
    layouts.value.push({
      name: editingLayout.value.name,
      columnIndices: editingLayout.value.columnIndices.map(columnIndex => columnIndex)
    });
  }

  isNewEdit.value = false;
  emits('update:layouts', layouts.value);
  const newLayout = layouts.value.find(layout => layout.name === editingLayout.value.name);
  if (newLayout) {
    setSelectedLayout(newLayout);
  }
  emits('submit');
}

function onSubmitDelete() {
  const layoutIndex = layouts.value.findIndex(layout => layout.name === selectedLayout.value.name);
  if (layoutIndex >= 0) {
    layouts.value.splice(layoutIndex, 1);
    setSelectedLayout(props.defaultLayout);
    emits('update:layouts', layouts.value);
    //emits('update:selectedLayoutName', selectedLayoutName.value);
    emits('submit');
  }
}

</script>

<template>
  <Teleport to="body" v-if="isTableLayoutEditOpened">
    <TableLayoutEdit
      v-model:isOpened="isTableLayoutEditOpened"
      :columnNames="columnNames"
      v-model:layout="editingLayout"
      v-on:submit="onSubmit"
      v-on:submitDelete="onSubmitDelete"
    ></TableLayoutEdit>
  </Teleport>
  <div class="btn-group">
    <button
      type="button"
      class="btn btn-sm btn-primary"
      v-on:click="setEditLayout(selectedLayout); isTableLayoutEditOpened = true"
      :disabled="selectedLayout.name === defaultLayout.name"
    >レイアウト: {{ selectedLayout.name }}</button>
    <button
      type="button"
      class="btn btn-primary dropdown-toggle dropdown-toggle-split"
      data-bs-toggle="dropdown"
    ></button>
    <ul class="dropdown-menu">
      <li>
        <button class="dropdown-item" v-on:click="setSelectedLayout(defaultLayout)">
          {{
            defaultLayout.name
          }}
        </button>
      </li>
      <li v-if="layouts.length > 0">
        <hr class="dropdown-divider" />
      </li>
      <li v-for="(item, index) in layouts">
        <button class="dropdown-item" v-on:click="setSelectedLayout(layouts[index])">{{ item.name }}</button>
      </li>
      <li>
        <hr class="dropdown-divider" />
      </li>
      <li>
        <button
          class="dropdown-item"
          v-on:click="isNewEdit = true; setEditLayout({ name: '', columnIndices: [] }); isTableLayoutEditOpened = true"
        >新規レイアウト作成...</button>
      </li>
    </ul>
  </div>
</template>