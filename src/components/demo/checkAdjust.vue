<template>
  <div class="check-container">
    <div class="left-check">
      <el-table
          ref="singleTable"
          :data="adjustList"
          tooltip-effect="dark"
          style="width: 100%"
          highlight-current-row
          @current-change="handleCurrentChange"
          @selection-change="handleSelectionChange">
        <el-table-column
            type="selection"
            align="center"
            width="55"
        >
        </el-table-column>
        <el-table-column
            :label="'已选('+ tableSelection.length+'/'+ adjustList.length+')'">
          <template slot-scope="scope">
            <el-tag :type="scope.row.conflictList.length===0?'success':'danger'" size="middle">
              {{ scope.row.conflictList.length === 0 ? "无冲突" : "有冲突" }}
            </el-tag>
            {{ scope.row.blockId }}
          </template>
        </el-table-column>
        <el-table-column
            label="操作类型"
            width="80"
            align="center">
          <template slot-scope="scope">{{ scope.row.adjustType }}</template>
        </el-table-column>
        <el-table-column
            label="目标"
            width="80"
            align="center">
          <template slot-scope="scope">{{ scope.row.targetRowId }}</template>
        </el-table-column>
        <el-table-column
            label="校验结果"
            width="80"
            align="center">
          <template slot-scope="scope">{{ scope.row.conflictList.length }}</template>
        </el-table-column>
      </el-table>
    </div>
    <div class="right-check" v-if="selectRow">
      <div class="terms-info clearfix">
        冲突列表({{ selectRow.conflictList.length }})
        <el-button type="primary" class="conflict-btn" @click="ignoreConflictAll">全部忽略</el-button>
        <el-button type="primary" class="conflict-btn" @click="checkAdjustResult">重新校验</el-button>
      </div>
      <div class="terms-list">
        <el-scrollbar class="modify-scroll" style="height:100%">
          <div class="term-item" v-for="(conflictItem,index) in selectRow.conflictList" :key="index">
            <h3 class="conflict-title">{{ index + 1 + "." + conflictItem.conflictType }}</h3>
            <p class="conflict-desc">{{ conflictItem.conflictDesc }}</p>

            <el-button :disabled="conflictItem.isIgnore" class="btn-ignore" type="primary"
                       @click="ignoreConflictItem(conflictItem)">{{ conflictItem.isIgnore ? "已忽略" : "忽略" }}
            </el-button>
          </div>
        </el-scrollbar>

      </div>

      <div class="check-result-info clearfix">
        <el-tag :type="selectRow.conflictList.length===0?'success':'danger'" size="middle">
          {{ selectRow.conflictList.length === 0 ? "校验通过" : "检验不通过" }}
        </el-tag>
        <el-button type="primary" class="btn-check" @click="checkAndInsert">确定调整</el-button>


      </div>
    </div>
  </div>
</template>

<script>
import {mapState, mapMutations} from "vuex";
import {cloneDeep} from "lodash";
import {checkConflict} from "@/utils/tool.js";

export default {
  name: "checkAdjust",
  data() {
    return {
      adjustList: [],
      tableSelection: [],
      selectRow: null
    };
  },
  computed: {
    ...mapState([
      "currentBlock",
      "currentRow",
      "targetBlock",
      "targetRow",
      "showRowList",
      "showMovedBlock"
    ])
  },
  methods: {
    ...mapMutations([
      "setShowRowList",
      "setRawRowList"
    ]),
    calcConflictList() {

      this.adjustList = [];
      /*if(!this.targetRow && this.currentBlock){
        let blockItem = this.currentBlock
        let adjustOjb = {

        }
      }*/
      if (this.targetRow && this.currentBlock) {
        let adjustOjb = checkConflict(this.currentBlock, this.targetRow, this.targetBlock ? this.targetBlock : null);
        this.adjustList.push(adjustOjb);
      }
      if (this.currentRow && this.targetBlock) {
        let adjustOjb = checkConflict(this.targetBlock, this.currentRow, this.currentBlock ? this.currentBlock : null);
        this.adjustList.push(adjustOjb);
      }

      if (this.adjustList.length) {
        this.$nextTick(() => {
          this.$refs.singleTable.setCurrentRow(this.adjustList[0]);
          this.$refs.singleTable.toggleAllSelection();
        });
      }
    },
    handleSelectionChange(val) {
      this.tableSelection = val;
    },
    handleCurrentChange(val) {
      this.selectRow = val;
    },
    ignoreConflictItem(item) {
      item.isIgnore = true;
    },
    ignoreConflictAll() {
      if (this.selectRow) {
        this.selectRow.conflictList.map(conflictItem => {
          conflictItem.isIgnore = true;
        });
      }
    },
    checkAdjustResult() {
      if (!this.tableSelection.length) {
        this.$message.error("至少选择一项进行重新校验！");
      } else {
        this.tableSelection.forEach(adjustObj => {
          let blockId = adjustObj.blockId;
          let adjustIndex = 0;
          this.adjustList.map((rawAdjustItem, rawIndex) => {
            if (blockId === rawAdjustItem.blockId) {
              adjustIndex = rawIndex;
            }
          });
          /*过滤忽略条件*/
          adjustObj.conflictList = adjustObj.conflictList.filter(item => {
            return item.isIgnore === false;
          });
          this.$set(this.adjustList, adjustIndex, adjustObj);
        });
        this.$refs.singleTable.setCurrentRow(this.adjustList[0]);
      }
    },
    checkAndInsert() {
      this.checkAdjustResult();
      if (!this.tableSelection.length) {
        return false;
      }
      /*判断是否有冲突*/
      let hasConflict = this.tableSelection.some(adjustObj => {
        return adjustObj.conflictList.length > 0;
      });
      if (hasConflict) {
        this.$message.error("调整任务存在时间冲突，请检查！");
        return false;
      } else {
        let rowList = cloneDeep(this.showRowList);
        this.tableSelection.forEach(adjustItem => {
          let currentRow = rowList.find(row => row.id === adjustItem.blockItem.parentId);

          if (this.showMovedBlock) {
            let movedBeforeBlock = currentRow.gtArray.find(blockItem => {
              return blockItem.id === adjustItem.blockId;
            });
            if (movedBeforeBlock["movedStatus"] === "after") {
              // 已经移动过一次的情况，过滤掉
              currentRow.gtArray = currentRow.gtArray.filter(blockItem => blockItem.id !== adjustItem.blockId);
            } else {
              // 没有移动过，修改movedStatus为before
              movedBeforeBlock["movedStatus"] = "before";
            }
          } else {
            currentRow.gtArray = currentRow.gtArray.filter(blockItem => blockItem.id !== adjustItem.blockId);
          }
          let newBlock = cloneDeep(adjustItem.blockItem);
          let targetRow = rowList.find(row => row.id === adjustItem.targetRowId);
          newBlock["movedStatus"] = "after";
          newBlock["parentId"] = targetRow.id;
          targetRow.gtArray.push(newBlock);
        });
        this.setShowRowList(rowList);
        this.$emit("closeDialog");
      }
    }
  }
};
</script>

<style lang="scss" scoped>

.check-container {
  display: flex;
  .left-check {
    width: 450px;
    padding-right: 10px;
    border-right: 2px solid #DDDDDD;
  }
  .right-check {
    flex: 1;
    padding-left: 15px;
    .adjust-blockItem {
      font-size: 16px;
    }
    .adjust-desc {
      font-size: 14px;
    }
    .terms-info {
      padding: 5px 0;
    }
    .conflict-btn {
      float: right;
      margin-left: 10px;
    }
    .terms-list {
      border: 1px solid #666666;
      height: 350px;
    }
    .term-item {
      padding: 10px 120px 10px 10px;
      position: relative;
      &:nth-child(2n+1) {
        background-color: #F4F4F4;
      }
    }
    .conflict-title {
      margin: 0;
      line-height: 1.5;
      font-size: 12px;
    }
    .conflict-desc {
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
    }
    .btn-ignore {
      position: absolute;
      top: 20px;
      right: 20px;
    }
  }
  .check-result-info {
    padding-top: 15px;
    .btn-check {
      float: right;
    }
  }
}

</style>
