<template>
  <div id="app">
    <div class="page-head">
      <h2 class="sub-title">拖拽甘特图</h2>
      <div class="operation-box">
        <span class="form-title">时间:</span>
        <el-date-picker
            v-model="times"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 220px"
        >
        </el-date-picker>
        <span class="form-title">行数:</span>
        <el-input
            v-model.number="rowNum"
            style="width:60px"
        />
        <span class="form-title">列数:</span>
        <el-input
            v-model.number="colNum"
            style="width:60px"
        />
        <el-button type="primary" @click="initData">生成数据</el-button>
        <el-input
            v-model="searchValue"
            placeholder="编号"
            clearable
            prefix-icon="el-icon-search"
            style="width: 120px"
            @clear="clearSearch"
        />
        <el-button type="primary" @click="filterSearchValue">搜索
          <template v-if="findList.length">
            {{ `${currentFindIndex + 1}/${findList.length}` }}
          </template>
        </el-button>
        <el-button type="primary" @click="classifyDialogVisible=true">数据分类</el-button>
      </div>
      <el-popover
          placement="right"
          width="400"
          trigger="click">
        <div class="gantt-config-options">
          <el-form :inline="true" size="small">
            <el-form-item label="行高">
              <el-slider
                  v-model="cellHeight"
                  :min="20"
                  :max="100"
                  style="width:80px"
                  size="small"
              ></el-slider>
            </el-form-item>
            <el-form-item label="单位刻度宽">
              <el-slider
                  v-model="cellWidth"
                  :min="20"
                  :max="100"
                  style="width:80px"
                  size="small"
              ></el-slider>
            </el-form-item>
            <el-form-item label="每刻度时长">
              <el-select
                  v-model="scale"
                  placeholder=""
                  style="width:100px"
                  size="small"
              >
                <el-option
                    v-for="item in scaleList"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-checkbox v-model="hideHeader">隐藏头部</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox :value="showMovedBlock" @change="setShowMovedBlock" title="是否显示拖拽之前的甘特块，若勾选，显示为黑色阴影状">
                显示调整前任务
              </el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-checkbox :value="showDragConfirm" @change="setShowDragConfirm" title="调整任务时是否显示确认弹窗">显示调整确认弹窗
              </el-checkbox>
            </el-form-item>
          </el-form>

        </div>
        <el-button slot="reference" type="primary" style="margin-left: 10px;">甘特配置项</el-button>
      </el-popover>

    </div>
    <div class="page-body">
      <v-gantt-chart
          :currentTime="currentTime"
          :startTime="times[0]"
          :endTime="times[1]"
          :cellWidth="cellWidth"
          :cellHeight="cellHeight"
          :timeLines="timeLines"
          :titleHeight="titleHeight"
          :scale="scale"
          :titleWidth="titleWidth"
          showCurrentTime
          :hideHeader="hideHeader"
          :dataKey="dataKey"
          :datas="datas"
      >
      </v-gantt-chart>

    </div>
    <el-dialog
        title="数据分类"
        :visible.sync="classifyDialogVisible">
      <el-form class="classify-form">
        <el-form-item label="类型：">
          <el-checkbox-group v-model="selectRowTypes">
            <el-checkbox
                v-for="(rowType,index) in rowTypes"
                :key="index"
                :label="rowType">{{ rowType }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="速度：">
          <el-checkbox-group v-model="selectSpeedTypes">
            <el-checkbox
                v-for="(speed,index) in speedTypes"
                :key="index"
                :label="speed">{{ speed }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div style="text-align: right;padding-top: 25px;">
        <el-button @click="classifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="classifyData">确定</el-button>
      </div>
    </el-dialog>
    <el-dialog
        title="任务调整"
        :visible.sync="checkDialogVisible"
        width="1000px">

      <check-adjust ref="checkAdjust" @closeDialog="checkDialogVisible=false"/>

    </el-dialog>
  </div>
</template>

<script>
import dayjs from "dayjs";
import {cloneDeep} from "lodash";
import {mapMutations, mapState} from "vuex";
import checkAdjust from "./components/demo/checkAdjust.vue";
import {
  getWidthAbout2Times as _getWidthAbout2Times
} from "@/utils/gtUtils.js";
import {checkConflict} from "@/utils/tool.js";
import {mockDatas} from "@/api/mock-data";

const scaleList = `1,2,3,4,5,6,10,12,15,20,30,60,120,180,240,360,720,1440,2880,4320`
    .split(",")
    .map(n => {
      let value = parseInt(n);
      let label;
      if (value < 60) {
        label = value + "minute";
      } else if (value >= 60 && value < 1440) {
        label = value / 60 + "hour";
      } else {
        label = value / 1440 + "day";
      }
      return {
        value,
        label
      };
    });
export default {
  name: "App",
  components: {checkAdjust},
  data() {
    return {
      searchValue: "",
      timeLines: [
        {
          time: dayjs()
              .add(2, "hour")
              .toString(),
          text: "~~"
        },
        {
          time: dayjs()
              .add(5, "hour")
              .toString(),
          text: "try",
          color: "#747E80"
        }
      ],
      currentTime: dayjs(),
      cellWidth: 60,
      cellHeight: 50,
      titleHeight: 60,
      titleWidth: 250,
      scale: 60,
      times: [
        dayjs()
            .set("hour", 0)
            .set("minute", 0)
            .toString(),
        dayjs()
            .add(6, "day")
            .set("hour", 23)
            .set("minute", 59)
            .toString()
      ],
      rowNum: 500,
      colNum: 25,
      datas: [[]],
      dataKey: "id",
      scaleList: scaleList,
      scrollToTime: dayjs()
          .add(1, "day")
          .toString(),
      hideHeader: false,
      positionB: {},
      positionA: {},
      ganttData: [],
      classifyDialogVisible: false,
      checkDialogVisible: false,
      rowTypes: ["🚅", "🚈", "🚄"],
      speedTypes: ["0~50", "50~100", "100"],
      selectRowTypes: [],
      selectSpeedTypes: [],
      classifyTypeList: [],
      rawData: [],
      findList: [],
      currentFindIndex: 0
    };
  },
  watch: {
    showRowList() {
      this.classifyData();
    },
    cellWidth(){
      setTimeout(()=>{
        this.$bus.$emit("refresh");
      },500)
    },
    scale(){
      setTimeout(()=>{
        this.$bus.$emit("refresh");
      },500)
    }
  },
  computed: {
    ...mapState([
      "filterBlockId",
      "currentBlock",
      "currentRow",
      "targetBlock",
      "targetRow",
      "showRowList",
      "rawRowList",
      "showMovedBlock",
      "showDragConfirm"
    ])
  },
  mounted() {
    this.initData();
    this.$bus.$on("updateTimeLines", (timeParam) => {
      this.updateTimeLines(timeParam.start, timeParam.end);
    });

    this.$bus.$on("toggleGroupOpen", (index) => {
      this.toggleGroupOpen(index);
    });

    this.$bus.$on("updateCurrentTime", (time) => {
      this.currentTime = time
    });
    this.$bus.$on("dragTask", () => {
      this.dragTask();
    });

  },
  methods: {
    ...mapMutations([
      "setFilterBlockId",
      "setCurrentBlock",
      "setCurrentRow",
      "setCutBlock",
      "setCutRow",
      "setShowRowList",
      "setRawRowList",
      "setShowMovedBlock",
      "setShowDragConfirm"
    ]),
    getWidthAbout2Times(start, end) {
      const options = {
        scale: this.scale,
        cellWidth: this.cellWidth
      };
      return _getWidthAbout2Times(start, end, options);
    },
    initData() {
      let list = mockDatas(this.rowNum, this.colNum, this.times);
      this.setRawRowList(list);
      this.setShowRowList(cloneDeep(list));
      this.classifyData();
    },
    updateTimeLines(timeA, timeB) {
      this.timeLines = [
        {
          time: timeA,
          text: "自定义"
        },
        {
          time: timeB,
          text: "测试",
          color: "#747E80"
        }
      ];
    },
    /* 数据分组*/
    classifyData() {

      function combine(arr) {
        let result = [];
        (function f(t, a, n) {
          if (n === 0) return result.push(t);
          for (let i = 0; i < a[n - 1].length; i++) {
            f(t.concat(a[n - 1][i]), a, n - 1);
          }
        })([], arr, arr.length);
        return result;
      }

      let typeList = this.selectRowTypes.length ? this.selectRowTypes : [""];
      let speedList = this.selectSpeedTypes.length ? this.selectSpeedTypes : [""];
      /*
      混和类型和速度属性
      例：选中两个类型和两个速度，["🚅", "🚈"]和["0~50", "50~100"]  最终会生成四种混合类型的数组，如果都选中三个，最终结果则是9个
     [
        [
          "0~50",
          "🚅"
        ],
        [
          "0~50",
          "🚈"
        ],
        [
          "50~100",
          "🚅"
        ],
        [
          "50~100",
          "🚈"
        ]
    ]

      */

      let resultArr = combine([typeList, speedList]);
      let classifyList = [];
      resultArr.forEach(resultItem => {
        //新建空对象，依次赋值, 建立最终类型数组
        let tempObj = {};
        if (resultItem[0]) {
          tempObj["speed"] = resultItem[0];
        }
        if (resultItem[1]) {
          tempObj["type"] = resultItem[1];
        }
        if (Object.getOwnPropertyNames(tempObj).length) {
          classifyList.push(tempObj);
        }
        /*将数组转为对象，最终是4个这样的对象
          [
            {
              "speed": "0~50",
              "type": "🚅"
            },
            {
              "speed": "0~50",
              "type": "🚈"
            },
            {
              "speed": "50~100",
              "type": "🚅"
            },
            {
              "speed": "50~100",
              "type": "🚈"
            }
          ]
          */
      });
      this.classifyTypeList = classifyList;
      if (!classifyList.length) {
        this.datas = [
          {
            groupType: {},
            children: cloneDeep(this.showRowList),
            isOpen: true
          }
        ];
        return false;
      }
      let groupList = [];

      /* 遍历每一个类型对象，并筛选对应的行，添加到每一个甘特组的children里*/
      classifyList.forEach(classifyItem => {
        let tempObj = Object.assign({}, classifyItem);
        tempObj["children"] = [];
        let blockRowList = cloneDeep(this.showRowList);
        for (let filterKey in classifyItem) {
          blockRowList = blockRowList.filter(bridgeItem => {
            if (filterKey === "speed") {
              let speedLimit = classifyItem[filterKey].split("~");
              if (speedLimit.length === 2) {
                return bridgeItem.speed >= speedLimit[0] && bridgeItem.speed < speedLimit[1];
              } else {
                return bridgeItem.speed >= speedLimit[0];
              }
            }
            return bridgeItem[filterKey] == classifyItem[filterKey];
          });
        }
        blockRowList.forEach((item, index) => {
          // 遍历每一行生成一个rawIndex属性，这个属性用来计算每一行的top值
          item.rawIndex = index;
        });
        tempObj["children"] = blockRowList;
        tempObj["groupType"] = classifyItem;
        tempObj["isOpen"] = true;
        groupList.push(tempObj);
      });
      this.datas = groupList;
      this.classifyDialogVisible = false;
    },
    /* 查找*/
    filterSearchValue() {
      if (!this.searchValue) {
        this.$message.warning('编号不能为空~');
        return false;
      }
      let findList = this.findList.length ? this.findList : [];
      /* 如果有之前查到的列表 */
      if (findList.length) {
        this.currentFindIndex += 1;
        if (this.currentFindIndex >= findList.length) this.currentFindIndex = 0;
        for (let i = this.currentFindIndex, len = findList.length; i < len; i++) {
          let blockItem = findList[i];
          this.$bus.$emit("scrollToPosition", {
            x: -blockItem.x,
            y: -blockItem.y
          });
          break;
        }
        return false;
      }
      let preScrollHeight = 0;

      for (let i = 0, len = this.datas.length; i < len; i++) {

        let ganttGroup = this.datas[i];
        ganttGroup.isOpen = true;
        let blockRowList = ganttGroup.children;


        let findRow = blockRowList.filter(row => {
          let blockItemIds = row.gtArray.map(blockItem => blockItem.id).join("~"); // 将一行所有blockItem的id拼成一个长字符串
          return blockItemIds.includes(this.searchValue);
        });
        let scrollTop = 0;
        if (findRow.length) {

          for (let j = 0, len = findRow.length; j < len; j++) {
            let rowItem = findRow[j];
            scrollTop = (rowItem.rawIndex + 1) * this.cellHeight;

            let filterBlockList = rowItem.gtArray.filter(blockItem => {
              return blockItem.id.includes(this.searchValue);
            });
            if (filterBlockList.length) {
              filterBlockList.forEach(blockItem => {
                const containerWidth = window.innerWidth - this.titleWidth;

                let totalTimeWidth = this.getWidthAbout2Times(this.times[0], this.times[1]);

                let calcLeft = this.getWidthAbout2Times(this.times[0], blockItem.start); //

                let scrollLeft = calcLeft > totalTimeWidth - containerWidth ? totalTimeWidth - containerWidth : calcLeft;

                let newBlockItem = {
                  x: scrollLeft,
                  y: scrollTop + preScrollHeight,
                  ...blockItem
                };

                findList.push(newBlockItem);

                // 计算需要滚动的高度和宽度
              });
            }
          }
        } else {
          this.$message.warning('没有搜到结果~');
          return false;
        }
        preScrollHeight += (blockRowList.length + 1) * this.cellHeight;
      }
      this.findList = findList;
      this.$bus.$emit("scrollToPosition", {
        x: -findList[0].x,
        y: -findList[0].y
      });
      this.setFilterBlockId(this.searchValue);
    },
    clearSearch() {
      this.setFilterBlockId('');
      this.currentFindIndex = 0;
      this.findList = [];
    },
    dragTask() {
      if (this.showDragConfirm) {
        this.checkAssign();
      } else {
        this.dragBlock();
      }
    },
    checkAssign() {
      this.checkDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.checkAdjust.calcConflictList();
      });
    },
    dragBlock() {
      let adjustList = [];
      if (this.targetRow && this.currentBlock) {
        let adjustOjb = checkConflict(this.currentBlock, this.targetRow, this.targetBlock ? this.targetBlock : null);
        adjustList.push(adjustOjb);
      }
      if (this.currentRow && this.targetBlock) {
        let adjustOjb = checkConflict(this.targetBlock, this.currentRow, this.currentBlock ? this.currentBlock : null);
        adjustList.push(adjustOjb);
      }

      // 判断是否有冲突
      let hasConflict = adjustList.some(adjustObj => {
        return adjustObj.conflictList.length > 0;
      });
      if (hasConflict) {
        this.$message.error("调整任务存在时间冲突，请检查！");
      }
      let rowList = cloneDeep(this.showRowList);
      adjustList.forEach(adjustItem => {
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
      this.setCutBlock(null);
      this.setCutRow(null);
      this.setShowRowList(rowList);
    },
    toggleGroupOpen(index) {
      this.datas[index].isOpen = !this.datas[index].isOpen;
    }

  }
};
</script>
