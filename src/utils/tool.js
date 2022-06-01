import dayjs from "dayjs";
/**
 * 是否没有值
 *
 * @export
 * @param {*} v
 * @returns
 */
export function isUndef(v) {
  return v === undefined || v === null;
}
/**
 * 是否有值
 *
 * @export
 * @param {*} v
 * @returns
 */
export function isDef(v) {
  return v !== undefined && v !== null;
}

export function warn(str) {
  // eslint-disable-next-line
  console.warn(str)
}

export function noop() {}

export function debounce(fn, interval = 500, immediate = false) {
  //fn为要执行的函数
  //interval为等待的时间
  //immediate判断是否立即执行
  var timeout; //定时器

  return function() {
    //返回一个闭包
    var context = this,
      args = arguments; //先把变量缓存
    var later = function() {
      //把稍后要执行的代码封装起来
      timeout = null; //成功调用后清除定时器
      if (!immediate) fn.apply(context, args); //不立即执行时才可以调用
    };

    var callNow = immediate && !timeout; //判断是否立即调用，并且如果定时器存在，则不立即调用
    clearTimeout(timeout); //不管什么情况，先清除定时器，这是最稳妥的
    timeout = setTimeout(later, interval); //延迟执行
    if (callNow) fn.apply(context, args); //如果是第一次触发，并且immediate为true，则立即执行
  };
}

export  function throttle(fn, interval = 100) {
  //fn为要执行的函数，interval为延迟时间
  var _self = fn, //保存需要被延迟执行的函数引用
    timer, //定时器
    firstTime = true; //是否第一次调用
  return function() {
    //返回一个函数，形成闭包，持久化变量
    var args = arguments, //缓存变量
      _me = this;
    if (firstTime) {
      //如果是第一次调用，不用延迟执行
      _self.apply(_me, args);
      return (firstTime = false);
    }
    if (timer) {
      //如果定时器还在，说明上一次延迟执行还没有完成
      return false;
    }
    timer = setTimeout(function() {
      //延迟一段时间执行
      clearTimeout(timer);
      timer = null;
      _self.apply(_me, args);
    }, interval);
  };
}

export function checkConflict(blockItem, row, targetBlockItem) {
  function convertTimeStr(time) {
    return dayjs(time).format("MM-DD HH:mm");
  }

  let currentBlock = blockItem; //要移动的航班
  let blockList = row.gtArray.filter((item) => {
    return (
      item.movedStatus !== "before" &&
      (targetBlockItem ? item.id !== targetBlockItem.id : true)
    );
  }); //该桥桥位航班列表，过滤拖拽后黑色的

  let conflictList = [];

  /*判断时间冲突*/

  let blockStart = dayjs(currentBlock.start).valueOf();
  let blockEnd = dayjs(currentBlock.end).valueOf();
  for (let i = 0; i < blockList.length; i++) {
    let compareBlock = blockList[i];
    let compareBlockStart = dayjs(compareBlock.start).valueOf();
    let compareBlockEnd = dayjs(compareBlock.end).valueOf();
    if (
      (compareBlockStart < blockStart && blockStart < compareBlockEnd) || //当前甘特块开始时间在目标甘特块里 存在交集
      (compareBlockStart < blockEnd && blockEnd < compareBlockEnd) || //当前甘特块结束时间在目标甘特块里 存在交集
      (compareBlockStart >= blockStart && blockEnd >= compareBlockEnd) //目标甘特块开始结束时间均在当前甘特块时间里 目标块是当前块的子集
    ) {
      let timeConflictStr = `${currentBlock.id}:(${convertTimeStr(
        currentBlock.start
      )}-${convertTimeStr(currentBlock.end)})与目标：${
        compareBlock.id
      }(${convertTimeStr(compareBlock.start)}-${convertTimeStr(
        compareBlock.end
      )})时间冲突`;

      conflictList.push({
        conflictType: "时间校验冲突",
        conflictDesc: timeConflictStr,
        isIgnore: false
      });
    }
  }
  return {
    blockItem: blockItem,
    targetRowId: row.id,
    blockId: blockItem.id,
    adjustType: "移动",
    conflictList: conflictList
  };
}
