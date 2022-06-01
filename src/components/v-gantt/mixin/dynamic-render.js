const dynamicRender = {
  props: {
    scrollTop: {
      type: Number,
      required: true
    },
    heightOfBlocksWrapper: {
      type: Number,
      required: true
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    cellHeight: {
      type: Number,
      required: true
    },
    datas: {
      type: Array,
      required: true
    },
    // 为 0 时加载全部行,
    //预加载的数量,是前后都计算
    preload: {
      type: Number,
      default: 1
    },
    totalHeight: {
      type: Number,
      default: 0
    },
    groupIndex: Number
  },

  data() {
    return {
      //上一次加载的第一个节点
      wrapperElement: null,
      oldTopIndex: 0,
      startRenderNum: 0,
      endRenderNum: 0,
      topSpace: 0,
      renderPosition: [],
      top: 0,
      bottom: 0
    };
  },

  computed: {
    //计算当前屏幕显示的第一行数据的index
    showDatas() {
      const { startRenderNum, endRenderNum, datas } = this;
      return datas.slice(startRenderNum, endRenderNum);
    }
  },

  watch: {
    scrollTop() {
      this.sliceData();
    },
    datas() {
      this.sliceData();
    },
    totalHeight() {
      this.$nextTick(() => {
        this.sliceData();
      });
    },
    heightOfBlocksWrapper() {
      this.sliceData();
    },
    cellHeight() {
      this.sliceData();
    },
    preload() {
      this.sliceData();
    }
  },

  created() {
    this.sliceData();
  },
  mounted() {
    this.wrapperElement = this.$refs.wrapperElement || null;
  },

  methods: {
    /**
     * 分割出dom中需要显示的数据
     */
    sliceData() {
      if (!this.wrapperElement) return false;

      const {
        unVisibleHeight,
        heightOfBlocksWrapper,
        cellHeight,
        preload,
        datas
      } = this;

      const ClientRect = this.wrapperElement.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      let startPosition = 0;
      let endPosition = 0;
      const top = ClientRect.top;
      const bottom = ClientRect.bottom;
      this.top = top;
      this.bottom = bottom;
      if (top <= 0) {
        startPosition = Math.abs(top) + unVisibleHeight;
        endPosition = startPosition + heightOfBlocksWrapper;
        if (bottom > unVisibleHeight && bottom <= windowHeight) {
          endPosition = startPosition + bottom;
        } else if (bottom <= unVisibleHeight) {
          this.startRenderNum = 0;
          this.endRenderNum = 0;
          return;
        }
      } else if (top > 0 && top <= unVisibleHeight) {
        startPosition = unVisibleHeight - top;
        endPosition = startPosition + heightOfBlocksWrapper;
      } else if (top > unVisibleHeight && top <= windowHeight) {
        startPosition = 0;
        endPosition = windowHeight - top;
      } else if (top > windowHeight) {
        this.startRenderNum = 0;
        this.endRenderNum = 0;
        return;
      }

      //没有高度，不需要渲染元素
      if (heightOfBlocksWrapper === 0 || cellHeight === 0) {
        this.startRenderNum = 0;
        this.endRenderNum = 0;
        return;
      }

      // 为 0 全部渲染
      if (preload === 0) {
        this.startRenderNum = 0;
        this.endRenderNum = datas.length;
        return;
      }
      const startRenderNum = Math.ceil(startPosition / cellHeight) - preload;
      this.startRenderNum = startRenderNum < 0 ? 0 : startRenderNum;

      const endRenderNum = Math.ceil(endPosition / cellHeight) + preload;
      this.endRenderNum =
        endRenderNum > datas.length ? datas.length : endRenderNum;
    }
  }
};

export default dynamicRender;
