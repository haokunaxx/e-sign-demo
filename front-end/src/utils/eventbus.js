/*
 * @Description:
 * @Author: xuxin
 * @Date: 2021-12-15 20:01:11
 * @LastEditTime: 2021-12-15 20:14:08
 * @LastEditors: xuxin
 * @FilePath: /webpack-study/src/utils/eventbus.js
 * @Reference:
 */
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true , "allowTernary": true }] */
function isArray(data) {
  return Array.isArray(data);
}
class EventBus {
  constructor() {
    this.eventPool = {};
  }

  on(type, event) {
    const oldEvts = this.eventPool[type];
    if (oldEvts) {
      const oldEventTemp = !isArray(oldEvts) ? [oldEvts] : oldEvts;
      this.eventPool[type] = isArray(event)
        ? [...oldEventTemp, ...event]
        : [...oldEventTemp, event];
    } else {
      this.eventPool[type] = isArray(event) ? [...event] : [event];
    }
  }

  emit(type, ...args) {
    const evTemp = this.eventPool[type];
    isArray(evTemp) ? evTemp.forEach((ev) => {
      ev.apply(this, args);
    }) : evTemp.apply(this, args);
  }

  off(type, event) {
    if (event) {
      const oldEvts = this.eventPool[type];
      if (isArray(event)) {
        this.eventPool[type] = oldEvts.filter((ev) => !event.includes(ev));
      } else {
        this.eventPool[type] = oldEvts.filter((ev) => ev !== event);
      }
    } else {
      this.eventPool[type] = null;
    }
  }

  once(type, event) {
    this.on(type, function wrapper() {
      // eslint-disable-next-line
      event.apply(this, arguments);
      this.off(type, wrapper);
    });
  }
}
const eb = new EventBus();
export default eb;
