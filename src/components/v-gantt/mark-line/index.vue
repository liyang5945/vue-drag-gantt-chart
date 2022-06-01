<template>
  <div
    class="gantt-markline"
    :style="{
      backgroundColor: timeConfig.color || '#0ca30a',
      left: getPosition() + 'px'
    }"
  >
    <div
      class="gantt-markline-label"
      :style="{
        backgroundColor: timeConfig.color || '#0ca30a'
      }"
    >
      {{ dayjs(timeConfig.time).format("HH:mm:ss") }}
    </div>
  </div>
</template>
<script>
import dayjs from "dayjs";
export default {
  name: "MarkLine",
  props: {
    timeConfig: {
      type: Object,
      required: true
    },
    getPositionOffset: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      dayjs: dayjs
    };
  },
  computed: {
    visible() {
      return !(this.timeConfig.time == null || false);
    }
  },
  methods: {
    getPosition() {
      if (!this.visible) {
        return 0;
      } else {
        return this.getPositionOffset(this.timeConfig.time);
      }
    }
  }
};
</script>
