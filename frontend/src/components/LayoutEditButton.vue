<script setup lang="ts">
import { ref, watch } from 'vue';
import TableLayoutEdit from '@/components/TableLayoutEdit.vue';

const props = defineProps<{
  columnNames: string[],
  layouts: { name: string, columns: string[] }[],
  defaultLayout: { name: string, columns: string[] },
  selectedLayoutName: string,
}>();

const isTableLayoutEditOpened = ref(false);
const selectedLayoutName = ref('');
const layouts = ref(props.layouts.map(layout => {
  return {
    name: layout.name,
    columns: layout.columns.map(column => column)
  };
}));

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:layouts', value: { name: string, columns: string[] }[]): void,
  (event: 'update:selectedLayoutName', value: string): void,
  (event: 'submit'): void,
}>();

function onLayoutEditSubmit() {
  console.log(editingLayout.value);
}

const selectedLayout = ref<{ name: string, columns: string[] }>({
  name: props.defaultLayout.name,
  columns: props.defaultLayout.columns.map(column => column)
});

const editingLayout = ref<{ name: string, columns: string[] }>({
  name: '',
  columns: []
});

function setSelectedLayout(layout: { name: string, columns: string[] }) {
  selectedLayout.value.name = layout.name;
  selectedLayout.value.columns.splice(0);
  selectedLayoutName.value = selectedLayout.value.name;
  Array.prototype.push.apply(selectedLayout.value.columns, layout.columns);

  emits('update:selectedLayoutName', selectedLayoutName.value);
}

function setEditLayout(layout: { name: string, columns: string[] }) {
  editingLayout.value.name = layout.name;
  editingLayout.value.columns.splice(0);
  Array.prototype.push.apply(editingLayout.value.columns, layout.columns);
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
      layouts.value[layoutIndex].columns.splice(0);
      Array.prototype.push.apply(layouts.value[layoutIndex].columns, editingLayout.value.columns);
    }
  }
  else {
    if (layouts.value.some(layout => layout.name === editingLayout.value.name)) {
      alert('レイアウト名が重複しています');
      return;
    }
    layouts.value.push({
      name: editingLayout.value.name,
      columns: editingLayout.value.columns.map(column => column)
    });
  }

  isNewEdit.value = false;
  setSelectedLayout(editingLayout.value);
  emits('update:layouts', layouts.value);
  emits('update:selectedLayoutName', selectedLayoutName.value);
  emits('submit');
}

</script>

<template>
  <Teleport to="body" v-if="isTableLayoutEditOpened">
    <TableLayoutEdit
      v-model:isOpened="isTableLayoutEditOpened"
      :columnNames="columnNames"
      v-model:layout="editingLayout"
      v-on:submit="onSubmit"
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
          v-on:click="isNewEdit = true; setEditLayout({ name: '', columns: [] }); isTableLayoutEditOpened = true"
        >新規レイアウト作成...</button>
      </li>
    </ul>
  </div>
</template>