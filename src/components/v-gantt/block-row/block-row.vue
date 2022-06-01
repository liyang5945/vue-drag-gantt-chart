<template>
  <div
    class="gantt-block-row"
    :style="{
      top: rowData.rawIndex * cellHeight + 'px',
      height: `${cellHeight}px`
    }"
  >
    <template v-for="blockItem in showList">
      <slot name="blockItem" :blockData="blockItem" />
    </template>
  </div>
</template>

<script>
export default {
  name: "blockRow",
  props: {
    rowData: {
      type: Object,
      required: true
    },
    cellHeight: Number,
    showList: Array
  }
};
</script>
