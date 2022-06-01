<template>
  <div class="gantt-blocks">
    <div class="gantt-block-top-space" :style="{ height: cellHeight + 'px' }" />
    <div
      v-show="isOpen"
      class="gantt-block-row-wrapper"
      :style="{
        height: datas.length * cellHeight + 'px'
      }"
      ref="wrapperElement"
    >
      <template v-for="rowItem in showDatas">
        <slot
          name="BlockRow"
          :row-data="rowItem"
          :showList="computedRangeList(rowItem.gtArray)"
        ></slot>
      </template>
    </div>
  </div>
</template>

<script>
import dr from "../mixin/dynamic-render.js";
import { isUndef } from "@/utils/tool.js";

export default {
  name: "Blocks",
  mixins: [dr],
  props: {
    scrollLeft: Number,
    unVisibleHeight: {
      type: Number,
      required: true
    },
    cellWidth: {
      type: Number,
      required: true
    },
    scale: {
      type: Number,
      required: true
    },
    endTimeOfRenderArea: [Number, null],
    startTimeOfRenderArea: [Number, null]
  },
  computed: {
    precondition() {
      if (this.heightOfBlocksWrapper === 0) {
        return false;
      }
      return !(
        isUndef(this.startTimeOfRenderArea) || isUndef(this.endTimeOfRenderArea)
      );
    }
  },

  methods: {
    computedRangeList(totalList) {
      return totalList.filter((item) => {
        return this.isInRenderingTimeRange(item.start, item.end);
      });
    },
    /**
     * 判定时间段是否跨越了渲染的时间范围 或者判定时间是否在渲染的时间范围内
     *
     * @returns {boolean}
     * @param timeStart
     * @param timeEnd
     */
    isInRenderingTimeRange(timeStart, timeEnd) {
      if (!this.precondition) {
        return false;
      }

      const { startTimeOfRenderArea, endTimeOfRenderArea } = this;
      const timeStartToMs = new Date(timeStart).getTime();
      const timeEndToMs = new Date(timeEnd).getTime();
      return (
        timeStartToMs <= endTimeOfRenderArea &&
        timeEndToMs >= startTimeOfRenderArea
      );
    }
  }
};
</script>
