<template>
  <div class="gantt-leftbar">
    <div
      class="gannt-group-menu"
      :style="{
        width: '100%',
        height: cellHeight + 'px'
      }"
    >
      <div class="type-title">
        <p>分组类型：</p>
        <p>数量：{{ datas.length }}</p>
      </div>
      <div class="classify-tags">
        <template v-if="Object.keys(groupType).length">
          <div class="classify-tag" v-if="groupType.type">
            {{ groupType.type }}
          </div>
          <div class="classify-tag" v-if="groupType.speed">
            {{ groupType.speed }}
          </div>
        </template>
        <template v-else>
          <div class="classify-tag">
            全部
          </div>
        </template>
      </div>
      <div
        :class="[
          'btn-toggle',
          isOpen ? 'el-icon-arrow-down' : 'el-icon-arrow-right'
        ]"
        @click="toggleOpen(groupIndex)"
      />
    </div>
    <div
      v-show="isOpen"
      ref="wrapperElement"
      class="left-bar-wrapper"
      :style="{
        height: datas.length * cellHeight + 'px'
      }"
    >
      <div
        class="gantt-leftbar-item"
        :style="{
          top: data.rawIndex * cellHeight + 'px',
          height: `${cellHeight}px`
        }"
        v-for="(data, index) in showDatas"
        :key="dataKey ? data[dataKey] : index"
      >
        <slot :rowData="data">
          <div class="gantt-leftbar-defalutItem">need slot</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import dr from "../mixin/dynamic-render.js";

export default {
  name: "LeftBar",
  mixins: [dr],
  props: {
    dataKey: String,
    unVisibleHeight: {
      type: Number,
      required: true
    },
    datas: {
      type: Array,
      required: true
    },
    groupType: {
      type: Object,
      default: () => {}
    },
    groupIndex: {
      type: Number,
      default: () => 0
    }
  },
  methods: {
    toggleOpen(groupIndex) {
      this.$bus.$emit("toggleGroupOpen", groupIndex);
    }
  }
};
</script>
