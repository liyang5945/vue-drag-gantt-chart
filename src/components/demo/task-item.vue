<template>
  <div
    class="gantt-block-item"
    :draggable="canDrag"
    :style="{
        'margin-top': 0.1 * cellHeight + 'px',
        height: '80%',
        left: positionOffset + 'px',
        width: blockWidth + 'px',
        zIndex: zIndex
      }"
  >
        <el-popover placement="bottom" trigger="manual" :open-delay="100" v-model="showDetail">
    <div
      slot="reference"
      :class="['plan',{
          'highlight':isHighlight
        },
        timeStatusClass,
        cutClass,
        movedStatusClass
        ]"
      @dblclick="changeZIndex"
      @pointerdown.left="showDetailInfo"
      @mouseleave="hideDetailInfo"
      @dragleave="hideDetailInfo"
    >
      <div class="runTime">
        <span>S:{{ startToString }}</span>
        <span>E:{{ endToString }}</span>
      </div>
      <div class="middle">编号{{ blockData.id }}</div>
      <div class="passenger">{{blockData.passenger}}人</div>
    </div>

    <div class="detail">
      <ul>
        <li>
          <span>发车时间：</span><span>{{ startToString }}</span>
        </li>
        <li>
          <span>到站时间：</span><span>{{ endToString }}</span>
        </li>
        <li>
          <span>载员：</span><span>{{ blockData.passenger }}</span>
        </li>
        <li>
          <span>编号：</span><span>{{ blockData.id }}</span>
        </li>
      </ul>
    </div>
        </el-popover>
  </div>

</template>

<script>
import { mapState } from "vuex"
import dayjs from "dayjs"

const NOW_PLAN = "#D5F8EA"
const FURTHER_PLAN = "#BFF2FE"
const PAST_PLAN = "#F2F2F2"
export default {
  name: "task-item",
  props: {
    blockData: Object,
    currentTime: dayjs,
    cellHeight: Number,
    getPositionOffset: Function,
    getWidthAbout2Times: Function
    // startTimeOfRenderArea: Number
  },
  data() {
    return {
      showDetail: false,
      dayjs: dayjs,
      zIndex: 2
    }
  },
  computed: {
    ...mapState([
      "filterBlockId",
      "currentBlock",
      "currentRow",
      "cutBlock",
    ]),
    canDrag() {
      // 是否可拖拽 已经移动过的不可拖拽，正在进行或已经完成的不可拖拽
      let { blockData, currentTime } = this
      let start = dayjs(blockData.start)
      return start.isAfter(currentTime) && this.blockData.movedStatus !== "before"
    },
    positionOffset() {
      const { blockData } = this
      return this.getPositionOffset(blockData.start)
    },
    blockWidth() {
      const { blockData } = this
      return this.getWidthAbout2Times(blockData.start, blockData.end)
    },
    isHighlight() {
      if (!this.filterBlockId) return false
      return this.blockData.id.includes(this.filterBlockId)
    },
    startToString() {
      return dayjs(this.blockData.start).format("HH:mm")
    },
    endToString() {
      return dayjs(this.blockData.end).format("HH:mm")
    },
    currentClass() {
      const isCurrentBlock = this.currentBlock ? this.currentBlock.id === this.blockData.id : false
      const isCurrentRow = this.currentRow ? this.currentRow.id === this.blockData.parentId : true
      if (isCurrentBlock && isCurrentRow) {
        return 'current-select'
      }
      return ''
    },
    cutClass() {
      const isCutBlock = this.cutBlock ? this.cutBlock.id === this.blockData.id : false
      if (isCutBlock) {
        return 'cut'
      }
      return ''
    },
    timeStatusClass() {
      let { blockData, currentTime } = this
      let start = dayjs(blockData.start)
      let end = dayjs(blockData.end)
      if (start.isBefore(currentTime) && end.isAfter(currentTime)) {
        return "NOW_PLAN" // NOW
      } else if (end.isBefore(currentTime)) {
        return "PAST_PLAN" // PAST
      } else {
        return "FURTHER_PLAN" // Future
      }
    },
    movedStatusClass() {
      let statusClassStr = ""
      if (this.blockData.movedStatus === "before") {
        statusClassStr += "moved-before "
      } else if (this.blockData.movedStatus === "after") {
        statusClassStr += "moved-after "
      }
      return statusClassStr
    }
  },
  methods: {
    showDetailInfo() {
      this.showDetail = true
      this.$bus.$emit("updateTimeLines", {
        start: this.blockData.start,
        end: this.blockData.end
      })
    },
    hideDetailInfo() {
      this.showDetail = false
    },
    changeZIndex() {
      this.$bus.$emit('upzIndex')
      this.zIndex = 1
    },
    upZIndex() {
      this.zIndex = 2
    },
  },
  mounted() {
    this.$bus.$on('hideDetailInfo', this.hideDetailInfo)
    this.$bus.$on('upzIndex', this.upZIndex)
  }
}
</script>

<style lang="scss" scoped>
.middle {
  flex: 1;
  text-align: center;
  padding-left: 5px;
}
.runTime {
  display: flex;
  flex-direction: column;
}
.plan {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  height: 100%;
  border: 1px solid #CCCCCC;
  border-radius: 10px;
  color: #333333;
  padding-left: 5px;
  font-size: 0.8rem;
  &.cut {
    border-color: #FF3F3E;
    opacity: .6;
  }
  &.NOW_PLAN {
    background-color: #D5F8EA;
  }
  &.PAST_PLAN {
    background-color: #F2F2F2;
  }
  &.FURTHER_PLAN {
    background-color: #BFF2FE;
  }
  &.moved-before {
    background-color: #FFFFFF;
    background-image: linear-gradient(135deg, #EEEEEE 25%, rgba(#000, .1) 0, rgba(#000, .1) 50%, #EEEEEE 0, #EEEEEE 75%, rgba(#000, .1) 0);
    background-size: 10px 10px;
  }
  &.moved-after {
    background-image: linear-gradient(135deg, rgba(#3693b3, .5) 25%, transparent 0, transparent 50%, rgba(#3693b3, .5) 0, rgba(#3693b3, .5) 75%, transparent 0);
    background-size: 10px 10px;
  }
  // opacity: 0.8;
}
.highlight {
  color: #FFFFFF;
  animation: colorful 1s linear alternate infinite;
}
.detail {
  //display: none;
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Chrome/Safari/Opera */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently 禁止鼠标拖动时 */
  .header {
    text-align: center;
    font-size: 1rem;
  }
}
.detail ul {
  list-style: none;
  padding: 0;
  li {
    span {
      display: inline-block;
      width: 80px;
      color: #777777;
      font-size: 0.8rem;
    }
    span:first-child {
      text-align: right;
    }
    span:last-child {
    }
  }
}
</style>
