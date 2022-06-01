import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    filterBlockId: "", // 筛选的甘特块id
    currentBlock: {}, //当前点击的甘特块
    currentRow: {}, //当前点击的甘特行
    cutBlock: {}, //剪切的甘特块
    cutRow: {}, //剪切的甘特行
    targetBlock: {}, //目标甘特块
    targetRow: {}, //目标甘特行
    handleBlock: {}, //右键操作的甘特块
    handleRow: {}, //右键操作的甘特行
    showRowList: [], // 筛选后在界面显示的列数据
    rawRowList: [], // 列原始数据，用于恢复
    showMovedBlock: true, // 是否显示拖拽之前的甘特状态
    showDragConfirm: false // 调整任务时是否显示确认弹窗
  },
  mutations: {
    setFilterBlockId(state, str) {
      state.filterBlockId = str;
    },
    setCurrentBlock(state, object) {
      state.currentBlock = object;
    },
    setCurrentRow(state, object) {
      state.currentRow = object;
    },
    setCutBlock(state, object) {
      state.cutBlock = object;
    },
    setCutRow(state, object) {
      state.cutRow = object;
    },
    setTargetBlock(state, object) {
      state.targetBlock = object;
    },
    setTargetRow(state, object) {
      state.targetRow = object;
    },
    setHandleBlock(state, object) {
      state.handleBlock = object;
    },
    setHandleRow(state, object) {
      state.handleRow = object;
    },
    setShowRowList(state, object) {
      state.showRowList = object;
    },
    setRawRowList(state, object) {
      state.rawRowList = object;
    },
    setShowMovedBlock(state, bool) {
      state.showMovedBlock = bool;
    },
    setShowDragConfirm(state, bool) {
      state.showDragConfirm = bool;
    }
  }
});
