<template>
  <div class="gantt-chart">
    <v-contextmenu @contextmenu.stop.prevent.native ref="blockItemMenu">
      <v-contextmenu-item class="right-menu-item" @click="moveCurrentBlock"
      >复制
      </v-contextmenu-item>
      <v-contextmenu-item class="right-menu-item" @click="switchBlock"
      >交换
      </v-contextmenu-item>
    </v-contextmenu>
    <v-contextmenu @contextmenu.stop.prevent.native ref="blockRowMenu">
      <v-contextmenu-item class="right-menu-item" @click="pasteBlock"
      >粘贴
      </v-contextmenu-item>
    </v-contextmenu>
    <div
        class="gantt-container"
        :style="{
        height: `100%`,
        width: `100%`
      }"
    >
      <div v-show="!hideHeader" class="gantt-header" :style="{ width: `100%` }">
        <div
            class="gantt-header-title"
            :style="{
            'line-height': titleHeight + 'px',
            height: titleHeight + 'px',
            width: titleWidth + 'px'
          }"
        >
          <div class="date-control">
            <span class="el-icon-caret-left btn-date-ctrl" @click="scrollPreDay"></span>
            <span class="current-date">{{ currentDay.format('MM-DD') }}</span>
            <span class="el-icon-caret-right btn-date-ctrl" @click="scrollNextDay"></span>
          </div>
        </div>
        <div class="gantt-header-timeline">
          <div
              ref="headerTimeline"
              class="gantt-header-timeline-container"
              :style="{ width: totalWidth + 'px' }"
          >
            <timeline
                :start="start"
                :end="end"
                :cellWidth="cellWidth"
                :titleHeight="titleHeight"
                :scale="scale"
                :startTimeOfRenderArea="dayjs(startTimeOfRenderArea)"
                :endTimeOfRenderArea="dayjs(endTimeOfRenderArea)"
                :getPositionOffset="getPositionOffset"
            >
              <template v-slot="{ day, getTimeScales }">
                <slot name="timeline" :day="day" :getTimeScales="getTimeScales">
                </slot>
              </template>
            </timeline>
          </div>
        </div>
      </div>

      <div
          class="gantt-body"
          :style="{ height: `calc(100% - ${actualHeaderHeight}px)` }"
      >
        <div class="gantt-table">
          <div
              ref="marklineArea"
              :style="{ marginLeft: titleWidth + 'px' }"
              class="gantt-markline-area"
          >
            <CurrentTime
                v-if="showCurrentTime"
                :getPositionOffset="getPositionOffset"
            />
            <mark-line
                v-for="(timeConfig, index) in timeLines"
                :key="index"
                :timeConfig="timeConfig"
                :getPositionOffset="getPositionOffset"
            >
              <template v-slot="{ timeConfig, getPosition }">
                <slot
                    name="markLine"
                    :timeConfig="timeConfig"
                    :getPosition="getPosition"
                ></slot>
              </template>
            </mark-line>
          </div>
          <div
              class="gantt-leftbar-container"
              :style="{
              width: titleWidth + 'px'
            }"
          >
            <div class="left-scroll-wrapper" ref="leftbarWrapper">
              <LeftBar
                  v-for="(blockGroup, index) in datas"
                  :key="index"
                  :datas="blockGroup.children || []"
                  :groupType="blockGroup.groupType || {}"
                  :group-index="index"
                  :is-open="blockGroup.isOpen"
                  :dataKey="dataKey"
                  :scrollTop="scrollTop"
                  :unVisibleHeight="unVisibleHeight"
                  :totalHeight="totalHeight"
                  :heightOfBlocksWrapper="heightOfBlocksWrapper"
                  :cellHeight="cellHeight"
                  :preload="preload"
              >
                <template v-slot="{ rowData }">
                  <MenuItem :rowData="rowData"></MenuItem>
                </template>
              </LeftBar>
            </div>
          </div>
          <div ref="blocksWrapper" class="gantt-blocks-wrapper" id="iscroll">
            <div class="scroller" :style="{ width: totalWidth + 'px' }">
              <BlockGroup
                  v-for="(blockGroup, index) in datas"
                  :key="index"
                  :datas="blockGroup.children || []"
                  :group-index="index"
                  :is-open="blockGroup.isOpen"
                  :scrollTop="scrollTop"
                  :scrollLeft="scrollLeft"
                  :unVisibleHeight="unVisibleHeight"
                  :totalHeight="totalHeight"
                  :heightOfBlocksWrapper="heightOfBlocksWrapper"
                  :cellWidth="cellWidth"
                  :cellHeight="cellHeight"
                  :scale="scale"
                  :startTimeOfRenderArea="startTimeOfRenderArea"
                  :endTimeOfRenderArea="endTimeOfRenderArea"
                  :preload="preload"
                  :style="{ width: totalWidth + 'px' }"
              >
                <template v-slot:BlockRow="{ rowData, showList }">
                  <BlockRow
                      v-contextmenu:blockRowMenu
                      :cellHeight="cellHeight"
                      :key="rowData.id"
                      :rowData="rowData"
                      :showList="showList"
                      @dragover.native.prevent
                      @drop.native="dropToRow($event, rowData)"
                      @mousedown.native.right.stop="
                      handleRightClickRow($event, rowData)
                    "
                  >
                    <template v-slot:blockItem="{ blockData }">
                      <TaskItem
                          v-contextmenu:blockItemMenu
                          :getPositionOffset="getPositionOffset"
                          :getWidthAbout2Times="getWidthAbout2Times"
                          :currentTime="currentTime"
                          :cellHeight="cellHeight"
                          :key="blockData.id"
                          :blockData="blockData"
                          @dragover.native.prevent
                          @pointerdown.native.stop
                          @contextmenu.native.stop
                          @mousedown.native.left.stop="
                          handleLeftClickBlock($event, rowData, blockData)
                        "
                          @mousedown.native.right.stop="
                          handleRightClickBlock($event, rowData, blockData)
                        "
                      />
                    </template>
                  </BlockRow>
                </template>
              </BlockGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapState, mapMutations} from "vuex";
import dayjs from "dayjs";
import ResizeObserver from "resize-observer-polyfill";
import IScroll from "iscroll/build/iscroll-probe";
import {
  calcScalesAbout2Times,
  getBeginTimeOfTimeLine,
  isDayScale,
  scaleList
} from "@/utils/timeLineUtils.js";
import {throttle, noop, warn} from "@/utils/tool.js";
import {
  getPositionOffset as _getPositionOffset,
  getWidthAbout2Times as _getWidthAbout2Times
} from "@/utils/gtUtils.js";

import Timeline from "./time-line/index.vue";
import CurrentTime from "./mark-line/current-time.vue";
import LeftBar from "./left-bar/index.vue";
import BlockGroup from "./block-group/block-group.vue";
import BlockRow from "./block-row/block-row.vue";
import MarkLine from "./mark-line/index.vue";
import TaskItem from "@/components/demo/task-item.vue";
import MenuItem from "@/components/demo/menu-item.vue";

let scroller = null;
export default {
  name: "Gantt",

  components: {
    Timeline,
    MarkLine,
    CurrentTime,
    BlockGroup,
    BlockRow,
    LeftBar,
    MenuItem,
    TaskItem
  },

  props: {
    currentTime: dayjs(),
    startTime: {
      default: () => dayjs(),
      validator(date) {
        const ok = dayjs(date).isValid();
        if (!ok) warn(`非法的开始时间 ${date}`);
        return ok;
      }
    },
    endTime: {
      default: () => dayjs(),
      validator(date) {
        const ok = dayjs(date).isValid();
        if (!ok) warn(`非法的结束时间 ${date}`);
        return ok;
      }
    },
    enableGrab: {
      type: Boolean,
      default: true
    },
    cellWidth: {
      type: Number,
      default: 50
    },
    cellHeight: {
      type: Number,
      default: 20
    },
    titleHeight: {
      type: Number,
      default: 40
    },
    titleWidth: {
      type: Number,
      default: 200
    },
    scale: {
      type: Number,
      default: 60,
      validator(value) {
        return scaleList.includes(value) || isDayScale(value);
      }
    },
    datas: {
      type: Array,
      default: () => []
    },
    dataKey: {
      type: String,
      default: undefined
    },
    itemKey: {
      type: String,
      default: undefined
    },
    showCurrentTime: {
      type: Boolean,
      default: false
    },
    timeLines: {
      type: Array
    },
    scrollToTime: {
      validator(date) {
        return dayjs(date).isValid();
      }
    },
    hideHeader: {
      type: Boolean,
      default: false
    },
    timeRangeCorrection: {
      type: Boolean,
      default: true
    },
    preload: {
      type: Number
    }
  },

  data() {
    return {
      //缓存节点
      selector: {
        gantt_leftbar: {},
        gantt_table: {},
        gantt_timeline: {},
        gantt_markArea: {}
      },
      scrollTop: 0,
      scrollLeft: 0,
      //block 区域需要渲染的范围
      //先渲染出空框架，在mounted后再得到真实的渲染范围，然后在根据范围渲染数据，比之前设置一个默认高度宽度，额外的渲染浪费更少了
      heightOfBlocksWrapper: 0,
      widthOfBlocksWrapper: 0,
      currentDay: dayjs(),
      dayjs,
      noop,
      preTouchPosition: {
        x: 0,
        y: 0
      }
    };
  },

  computed: {
    ...mapState([
      "currentBlock",
      "currentRow",
      "cutBlock",
      "cutRow",
      "targetBlock",
      "targetRow",
      "handleBlock",
      "handleRow"
    ]),
    start() {
      return dayjs(this.startTime);
    },
    end() {
      const {
        start,
        widthOfBlocksWrapper,
        scale,
        cellWidth,
        timeRangeCorrection
      } = this;
      let end = dayjs(this.endTime);
      const totalWidth = calcScalesAbout2Times(start, end, scale) * cellWidth;
      // 时间纠正和补偿
      if (
          timeRangeCorrection &&
          (start.isAfter(end) || totalWidth <= widthOfBlocksWrapper)
      ) {
        end = getBeginTimeOfTimeLine(start, scale).add(
            (widthOfBlocksWrapper / cellWidth) * scale,
            "minute"
        );
      }
      return end;
    },
    totalWidth() {
      const {cellWidth, totalScales} = this;
      return cellWidth * totalScales;
    },
    totalScales() {
      const {start, end, scale} = this;
      return calcScalesAbout2Times(start, end, scale);
    },
    totalHeight() {
      const {datas, cellHeight} = this;
      let height = 0;
      for (let i = 0; i < datas.length; i++) {
        let rowLength = datas[i].isOpen ? datas[i].children.length + 1 : 1;
        height += rowLength * cellHeight;
      }
      return height;
    },
    beginTimeOfTimeLine() {
      return getBeginTimeOfTimeLine(this.start, this.scale);
    },
    beginTimeOfTimeLineToString() {
      return this.beginTimeOfTimeLine.toString();
    },
    unVisibleHeight() {
      return window.innerHeight - this.heightOfBlocksWrapper;
    },
    availableScrollLeft() {
      // 不减这个1，滚动到时间轴尽头后继续滚动会慢慢的溢出
      const {totalWidth, widthOfBlocksWrapper} = this;
      return totalWidth - widthOfBlocksWrapper - 1;
    },
    availableScrollTop() {
      const {totalHeight, heightOfBlocksWrapper} = this;
      return totalHeight - heightOfBlocksWrapper - 1;
    },
    actualHeaderHeight() {
      return this.hideHeader ? 0 : this.titleHeight;
    },
    startTimeOfRenderArea() {
      if (this.heightOfBlocksWrapper === 0) {
        return;
      }
      const {beginTimeOfTimeLine, scrollLeft, cellWidth, scale} = this;

      return beginTimeOfTimeLine
          .add((scrollLeft / cellWidth) * scale, "minute")
          .toDate()
          .getTime();
    },
    endTimeOfRenderArea() {
      if (this.heightOfBlocksWrapper === 0) {
        return;
      }
      const {
        beginTimeOfTimeLine,
        scrollLeft,
        cellWidth,
        scale,
        widthOfBlocksWrapper,
        totalWidth
      } = this;

      const renderWidth =
          totalWidth < widthOfBlocksWrapper ? totalWidth : widthOfBlocksWrapper;

      return beginTimeOfTimeLine
          .add(((scrollLeft + renderWidth) / cellWidth) * scale, "minute")
          .toDate()
          .getTime();
    }
  },
  watch: {
    totalHeight() {
      this.$nextTick(() => {
        scroller.refresh();
        this.scrollHandler();
      });
    }
  },

  mounted() {
    this.cacheSelector();
    // 计算准确的渲染区域范围
    const observeContainer = throttle((entries) => {
      entries.forEach((entry) => {
        const cr = entry.contentRect;
        this.heightOfBlocksWrapper = cr.height;
        this.widthOfBlocksWrapper = cr.width;
      });
    });
    const observer = new ResizeObserver(observeContainer);
    observer.observe(this.$refs.blocksWrapper);
    this.$once("hook:beforeDestroy", () => {
      observer.disconnect();
      this.releaseSelector();
    });

    scroller = new IScroll("#iscroll", {
      probeType: 3,
      click: true,
      scrollX: true,
      scrollY: true,
      freeScroll: false,
      mouseWheel: true,
      mousedown: true,
      scrollbars: true,
      interactiveScrollbars: true,
      // shrinkScrollbars: 'scale',
      fadeScrollbars: false,
      useTransition: true
      // keyBindings: {
      //   pageUp: 33,
      //   pageDown: 34,
      //   end: 35,
      //   home: 36,
      //   left: 37,
      //   up: 38,
      //   right: 39,
      //   down: 40
      // }
    });
    setTimeout(() => {
      scroller.refresh();
    }, 1000);

    scroller.on("scroll", this.scrollHandler);
    this.$bus.$on("scrollToPosition", (position) => {
      scroller.scrollTo(position.x, position.y, 600);
    });
    this.$bus.$on("refresh",()=>{
      scroller.refresh();
    })
  },

  methods: {
    ...mapMutations([
      "setCurrentBlock",
      "setCurrentRow",
      "setCutBlock",
      "setCutRow",
      "setTargetBlock",
      "setTargetRow",
      "setHandleBlock",
      "setHandleRow"
    ]),
    scrollHandler() {
      this.selector.gantt_timeline.style.transform = `translateX(${scroller.x}px)`;
      this.selector.gantt_leftbar.style.transform = `translateY(${scroller.y}px)`;
      this.selector.gantt_markArea.style.left = scroller.x + "px";
      this.scrollLeft = -scroller.x;
      this.scrollTop = -scroller.y;
      /*计算滚动位置的时间*/

      let width = scroller.x;

      let mileSeconds = -(width / this.cellWidth) * this.scale * 60 * 1000;

      let scrollTime = new Date(this.startTime).getTime() + mileSeconds;

      this.currentDay = dayjs(scrollTime);

    },
    /*向前滚动一天*/
    scrollPreDay() {
      let tempDay = this.currentDay;

      let startTime = dayjs(this.startTime);

      startTime = startTime.subtract(1, 'hour');

      tempDay = tempDay.subtract(1, 'day').set("hour", 0).set("minute", 0);

      if (tempDay.isBefore(startTime)) {
        return false;
      } else {
        this.currentDay = tempDay;
        let width = this.getWidthAbout2Times(this.startTime, tempDay);
        scroller.scrollTo(-width, scroller.y, 400);
      }
    },
    /*向后滚动一天*/
    scrollNextDay() {
      let tempDay = this.currentDay;

      let endTime = dayjs(this.endTime);
      endTime = endTime.subtract(1, 'hour');

      tempDay = tempDay.add(1, 'day').set("hour", 0).set("minute", 0);

      if (tempDay.isAfter(endTime)) {
        return false;
      } else {
        this.currentDay = tempDay;
        let width = this.getWidthAbout2Times(this.startTime, tempDay);
        scroller.scrollTo(-width, scroller.y, 400);
      }
    },
    getWidthAbout2Times(start, end) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };
      return _getWidthAbout2Times(start, end, options);
    },
    /**
     * 为时间线计算偏移
     */
    getPositionOffset(date) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };

      return _getPositionOffset(
          date,
          this.beginTimeOfTimeLineToString,
          options
      );
    },
    //缓存节点
    cacheSelector() {
      this.selector.gantt_leftbar = this.$refs.leftbarWrapper;
      this.selector.gantt_table = this.$refs.blocksWrapper;
      this.selector.gantt_timeline = this.$refs.headerTimeline;
      this.selector.gantt_markArea = this.$refs.marklineArea;
    },
    releaseSelector() {
      let key;
      for (key in this.selector) {
        this.selector[key] = null;
      }
    },
    handleLeftClickBlock(event, rowData, blockItem) {
      this.setCurrentRow(rowData);
      this.setCurrentBlock(blockItem);
    },
    handleRightClickBlock(event, rowData, blockItem) {
      this.setHandleRow(rowData);
      this.setHandleBlock(blockItem);
    },
    handleRightClickRow(event, blockRow) {
      this.$refs.blockItemMenu.hide();
      this.setTargetBlock(null);
      this.setTargetRow(blockRow);
    },
    moveCurrentBlock() {
      this.setCutBlock(this.handleBlock);
      this.setCutRow(this.handleRow);
    },
    /*粘贴*/
    pasteBlock() {
      if (this.cutBlock) {
        this.setCurrentBlock(this.cutBlock);
        this.$bus.$emit("dragTask");
      }
    },
    /*交换*/
    switchBlock() {
      if (this.cutBlock && this.currentBlock) {
        this.setCurrentBlock(this.cutBlock);
        this.setCurrentRow(this.cutRow);
        this.setTargetBlock(this.handleBlock);
        this.setTargetRow(this.handleRow);
        this.$bus.$emit("dragTask");
      }
    },
    dropToRow(event, rowData) {
      if (rowData.id === this.currentRow.id) return false;
      this.setCurrentRow(null);
      this.setTargetBlock(null);
      this.setTargetRow(rowData);
      this.$bus.$emit("dragTask");
    }
  }
};
</script>

<style lang="scss">
@import "gantt";
</style>
