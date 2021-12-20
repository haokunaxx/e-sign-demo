(function (g, fn) {
  const version = '1.3.9';
  const pdfjsVersion = '2.3.200';
  console.log(`pdfh5.js v${version} & https://www.gjtool.cn`);
  if (typeof require !== 'undefined') {
    if (g.$ === undefined) {
      g.$ = require('./jquery-1.11.3.min.js');
    }
    g.pdfjsWorker = require('./pdf.worker.js');
    g.pdfjsLib = require('./pdf.js');
  }
  const { pdfjsLib } = g;
  const { $ } = g;
  const { pdfjsWorker } = g;
  if (typeof define === 'function' && define.amd) {
    define(() => fn(g, pdfjsWorker, pdfjsLib, $, version));
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = fn(g, pdfjsWorker, pdfjsLib, $, version);
  } else {
    g.Pdfh5 = fn(g, pdfjsWorker, pdfjsLib, $, version);
  }
}(typeof window !== 'undefined' ? window : this, (g, pdfjsWorker, pdfjsLib, $, version) => {
  const definePinchZoom = function ($) {
    const PinchZoom = function (el, options, viewerContainer) {
      this.el = $(el);
      this.viewerContainer = viewerContainer;
      this.zoomFactor = 1;
      this.lastScale = 1;
      this.offset = {
        x: 0,
        y: 0,
      };
      this.options = $.extend({}, this.defaults, options);
      this.options.zoomOutFactor = isNaN(options.zoomOutFactor) ? 1.2 : options.zoomOutFactor;
      this.options.animationDuration = isNaN(options.animationDuration) ? 300 : options.animationDuration;
      this.options.maxZoom = isNaN(options.maxZoom) ? 3 : options.maxZoom;
      this.options.minZoom = isNaN(options.minZoom) ? 0.8 : options.minZoom;
      this.setupMarkup();
      this.bindEvents();
      this.update();
      this.enable();
      this.height = 0;
      this.load = false;
      this.direction = null;
      this.clientY = null;
      this.lastclientY = null;
    };
    const sum = function (a, b) {
      return a + b;
    };
    const isCloseTo = function (value, expected) {
      return value > expected - 0.01 && value < expected + 0.01;
    };

    PinchZoom.prototype = {
      defaults: {
        tapZoomFactor: 3,
        zoomOutFactor: 1.2,
        animationDuration: 300,
        maxZoom: 3,
        minZoom: 0.8,
        lockDragAxis: false,
        use2d: true,
        zoomStartEventName: 'pz_zoomstart',
        zoomEndEventName: 'pz_zoomend',
        dragStartEventName: 'pz_dragstart',
        dragEndEventName: 'pz_dragend',
        doubleTapEventName: 'pz_doubletap',
      },
      handleDragStart(event) {
        this.el.trigger(this.options.dragStartEventName);
        this.stopAnimation();
        this.lastDragPosition = false;
        this.hasInteraction = true;
        this.handleDrag(event);
      },
      handleDrag(event) {
        if (this.zoomFactor > 1.0) {
          const touch = this.getTouches(event)[0];
          this.drag(touch, this.lastDragPosition, event);
          this.offset = this.sanitizeOffset(this.offset);
          this.lastDragPosition = touch;
        }
      },

      handleDragEnd() {
        this.el.trigger(this.options.dragEndEventName);
        this.end();
      },
      handleZoomStart(event) {
        this.el.trigger(this.options.zoomStartEventName);
        this.stopAnimation();
        this.lastScale = 1;
        this.nthZoom = 0;
        this.lastZoomCenter = false;
        this.hasInteraction = true;
      },
      handleZoom(event, newScale) {
        const touchCenter = this.getTouchCenter(this.getTouches(event));
        const scale = newScale / this.lastScale;
        this.lastScale = newScale;
        this.nthZoom += 1;
        if (this.nthZoom > 3) {
          this.scale(scale, touchCenter);
          this.drag(touchCenter, this.lastZoomCenter);
        }
        this.lastZoomCenter = touchCenter;
      },

      handleZoomEnd() {
        this.el.trigger(this.options.zoomEndEventName);
        this.end();
      },
      handleDoubleTap(event) {
        let center = this.getTouches(event)[0];
        const zoomFactor = this.zoomFactor > 1 ? 1 : this.options.tapZoomFactor;
        const startZoomFactor = this.zoomFactor;
        const updateProgress = (function (progress) {
          this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
        }).bind(this);

        if (this.hasInteraction) {
          return;
        }
        if (startZoomFactor > zoomFactor) {
          center = this.getCurrentZoomCenter();
        }

        this.animate(this.options.animationDuration, updateProgress, this.swing);
        this.el.trigger(this.options.doubleTapEventName);
      },
      sanitizeOffset(offset) {
        const maxX = (this.zoomFactor - 1) * this.getContainerX();
        const maxY = (this.zoomFactor - 1) * this.getContainerY();
        const maxOffsetX = Math.max(maxX, 0);
        const maxOffsetY = Math.max(maxY, 0);
        const minOffsetX = Math.min(maxX, 0);
        const minOffsetY = Math.min(maxY, 0);

        const x = Math.min(Math.max(offset.x, minOffsetX), maxOffsetX);
        const y = Math.min(Math.max(offset.y, minOffsetY), maxOffsetY);

        return {
          x,
          y,
        };
      },
      scaleTo(zoomFactor, center) {
        this.scale(zoomFactor / this.zoomFactor, center);
      },
      scale(scale, center) {
        scale = this.scaleZoomFactor(scale);
        this.addOffset({
          x: (scale - 1) * (center.x + this.offset.x),
          y: (scale - 1) * (center.y + this.offset.y),
        });
        this.done && this.done.call(this, this.getInitialZoomFactor() * this.zoomFactor);
      },
      scaleZoomFactor(scale) {
        const originalZoomFactor = this.zoomFactor;
        this.zoomFactor *= scale;
        this.zoomFactor = Math.min(this.options.maxZoom, Math.max(this.zoomFactor, this.options.minZoom));
        return this.zoomFactor / originalZoomFactor;
      },
      drag(center, lastCenter, event) {
        if (lastCenter) {
          if (this.options.lockDragAxis) {
            if (Math.abs(center.x - lastCenter.x) > Math.abs(center.y - lastCenter.y)) {
              this.addOffset({
                x: -(center.x - lastCenter.x),
                y: 0,
              });
            } else {
              this.addOffset({
                y: -(center.y - lastCenter.y),
                x: 0,
              });
            }
          } else {
            if (center.y - lastCenter.y < 0) {
              this.direction = 'down';
            } else if (center.y - lastCenter.y > 10) {
              this.direction = 'up';
            }
            this.addOffset({
              y: -(center.y - lastCenter.y),
              x: -(center.x - lastCenter.x),
            });
          }
        }
      },
      getTouchCenter(touches) {
        return this.getVectorAvg(touches);
      },
      getVectorAvg(vectors) {
        return {
          x: vectors.map((v) => v.x).reduce(sum) / vectors.length,
          y: vectors.map((v) => v.y).reduce(sum) / vectors.length,
        };
      },
      addOffset(offset) {
        this.offset = {
          x: this.offset.x + offset.x,
          y: this.offset.y + offset.y,
        };
      },

      sanitize() {
        if (this.zoomFactor < this.options.zoomOutFactor) {
          this.zoomOutAnimation();
        } else if (this.isInsaneOffset(this.offset)) {
          this.sanitizeOffsetAnimation();
        }
      },
      isInsaneOffset(offset) {
        const sanitizedOffset = this.sanitizeOffset(offset);
        return sanitizedOffset.x !== offset.x
                    || sanitizedOffset.y !== offset.y;
      },
      sanitizeOffsetAnimation() {
        const targetOffset = this.sanitizeOffset(this.offset);
        const startOffset = {
          x: this.offset.x,
          y: this.offset.y,
        };
        const updateProgress = (function (progress) {
          this.offset.x = startOffset.x + progress * (targetOffset.x - startOffset.x);
          this.offset.y = startOffset.y + progress * (targetOffset.y - startOffset.y);
          this.update();
        }).bind(this);

        this.animate(
          this.options.animationDuration,
          updateProgress,
          this.swing,
        );
      },
      zoomOutAnimation() {
        const startZoomFactor = this.zoomFactor;
        const zoomFactor = 1;
        const center = this.getCurrentZoomCenter();
        const updateProgress = (function (progress) {
          this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center);
        }).bind(this);

        this.animate(
          this.options.animationDuration,
          updateProgress,
          this.swing,
        );
      },
      updateAspectRatio() {
        this.setContainerY(this.getContainerX() / this.getAspectRatio());
      },
      getInitialZoomFactor() {
        if (this.container[0] && this.el[0]) {
          return this.container[0].offsetWidth / this.el[0].offsetWidth;
        }
        return 0;
      },
      getAspectRatio() {
        if (this.el[0]) {
          const { offsetHeight } = this.el[0];
          return this.container[0].offsetWidth / offsetHeight;
        }
        return 0;
      },
      getCurrentZoomCenter() {
        const length = this.container[0].offsetWidth * this.zoomFactor;
        const offsetLeft = this.offset.x;
        const offsetRight = length - offsetLeft - this.container[0].offsetWidth;
        const widthOffsetRatio = offsetLeft / offsetRight;
        let centerX = widthOffsetRatio * this.container[0].offsetWidth / (widthOffsetRatio + 1);

        const height = this.container[0].offsetHeight * this.zoomFactor;
        const offsetTop = this.offset.y;
        const offsetBottom = height - offsetTop - this.container[0].offsetHeight;
        const heightOffsetRatio = offsetTop / offsetBottom;
        let centerY = heightOffsetRatio * this.container[0].offsetHeight / (heightOffsetRatio + 1);

        if (offsetRight === 0) {
          centerX = this.container[0].offsetWidth;
        }
        if (offsetBottom === 0) {
          centerY = this.container[0].offsetHeight;
        }

        return {
          x: centerX,
          y: centerY,
        };
      },

      canDrag() {
        return !isCloseTo(this.zoomFactor, 1);
      },

      getTouches(event) {
        const position = this.container.offset();
        return Array.prototype.slice.call(event.touches).map((touch) => ({
          x: touch.pageX - position.left,
          y: touch.pageY - position.top,
        }));
      },
      animate(duration, framefn, timefn, callback) {
        const startTime = new Date().getTime();
        var renderFrame = (function () {
          if (!this.inAnimation) {
            return;
          }
          const frameTime = new Date().getTime() - startTime;
          let progress = frameTime / duration;
          if (frameTime >= duration) {
            framefn(1);
            if (callback) {
              callback();
            }
            this.update();
            this.stopAnimation();
          } else {
            if (timefn) {
              progress = timefn(progress);
            }
            framefn(progress);
            this.update();
            requestAnimationFrame(renderFrame);
          }
        }).bind(this);
        this.inAnimation = true;
        requestAnimationFrame(renderFrame);
      },
      stopAnimation() {
        this.inAnimation = false;
      },
      swing(p) {
        return -Math.cos(p * Math.PI) / 2 + 0.5;
      },

      getContainerX() {
        if (this.el[0]) {
          return this.el[0].offsetWidth;
        }
        return 0;
      },

      getContainerY() {
        return this.el[0].offsetHeight;
      },
      setContainerY(y) {
        y = y.toFixed(2);
        return this.container.height(y);
      },
      setupMarkup() {
        this.container = $('<div class="pinch-zoom-container"></div>');
        this.el.before(this.container);
        this.container.append(this.el);

        this.container.css({
          position: 'relative',
        });

        this.el.css({
          '-webkit-transform-origin': '0% 0%',
          '-moz-transform-origin': '0% 0%',
          '-ms-transform-origin': '0% 0%',
          '-o-transform-origin': '0% 0%',
          'transform-origin': '0% 0%',
          position: 'relative',
        });
      },

      end() {
        this.hasInteraction = false;
        this.sanitize();
        this.update();
      },
      bindEvents() {
        detectGestures(this.container.eq(0), this, this.viewerContainer);
        $(g).on('resize', this.update.bind(this));
        $(this.el).find('img').on('load', this.update.bind(this));
      },
      update() {
        if (this.updatePlaned) {
          return;
        }
        this.updatePlaned = true;
        setTimeout((() => {
          this.updatePlaned = false;
          this.updateAspectRatio();
          const zoomFactor = this.getInitialZoomFactor() * this.zoomFactor;
          const offsetX = (-this.offset.x / zoomFactor).toFixed(3);
          const offsetY = (-this.offset.y / zoomFactor).toFixed(3);
          this.lastclientY = offsetY;

          const transform3d = `scale3d(${zoomFactor}, ${zoomFactor},1) `
                        + `translate3d(${offsetX}px,${offsetY}px,0px)`;
          const transform2d = `scale(${zoomFactor}, ${zoomFactor}) `
                        + `translate(${offsetX}px,${offsetY}px)`;
          const removeClone = (function () {
            if (this.clone) {
              this.clone.remove();
              delete this.clone;
            }
          }).bind(this);
          if (!this.options.use2d || this.hasInteraction || this.inAnimation) {
            this.is3d = true;
            this.el.css({
              '-webkit-transform': transform3d,
              '-o-transform': transform2d,
              '-ms-transform': transform2d,
              '-moz-transform': transform2d,
              transform: transform3d,
            });
          } else {
            this.el.css({
              '-webkit-transform': transform2d,
              '-o-transform': transform2d,
              '-ms-transform': transform2d,
              '-moz-transform': transform2d,
              transform: transform2d,
            });
            this.is3d = false;
          }
        }), 0);
      },
      enable() {
        this.enabled = true;
      },
      disable() {
        this.enabled = false;
      },
      destroy() {
        const dom = this.el.clone();
        const p = this.container.parent();
        this.container.remove();
        dom.removeAttr('style');
        p.append(dom);
      },
    };

    var detectGestures = function (el, target, viewerContainer) {
      let interaction = null;
      let fingers = 0;
      let lastTouchStart = null;
      let startTouches = null;
      let lastTouchY = null;
      let clientY = null;
      let lastclientY = 0;
      let lastTop = 0;
      const setInteraction = function (newInteraction, event) {
        if (interaction !== newInteraction) {
          if (interaction && !newInteraction) {
            switch (interaction) {
              case 'zoom':
                target.handleZoomEnd(event);
                break;
              case 'drag':
                target.handleDragEnd(event);
                break;
            }
          }

          switch (newInteraction) {
            case 'zoom':
              target.handleZoomStart(event);
              break;
            case 'drag':
              target.handleDragStart(event);
              break;
          }
        }
        interaction = newInteraction;
      };

      const updateInteraction = function (event) {
        if (fingers === 2) {
          setInteraction('zoom');
        } else if (fingers === 1 && target.canDrag()) {
          setInteraction('drag', event);
        } else {
          setInteraction(null, event);
        }
      };

      const targetTouches = function (touches) {
        return Array.prototype.slice.call(touches).map((touch) => ({
          x: touch.pageX,
          y: touch.pageY,
        }));
      };

      const getDistance = function (a, b) {
        let x; let
          y;
        x = a.x - b.x;
        y = a.y - b.y;
        return Math.sqrt(x * x + y * y);
      };

      const calculateScale = function (startTouches, endTouches) {
        const startDistance = getDistance(startTouches[0], startTouches[1]);
        const endDistance = getDistance(endTouches[0], endTouches[1]);
        return endDistance / startDistance;
      };

      const cancelEvent = function (event) {
        event.stopPropagation();
        event.preventDefault();
      };

      const detectDoubleTap = function (event) {
        const time = (new Date()).getTime();
        const { pageY } = event.changedTouches[0];
        const top = parentNode.scrollTop || 0;
        if (fingers > 1) {
          lastTouchStart = null;
          lastTouchY = null;
          cancelEvent(event);
        }

        if (time - lastTouchStart < 300 && Math.abs(pageY - lastTouchY) < 10 && Math.abs(lastTop - top) < 10) {
          cancelEvent(event);
          target.handleDoubleTap(event);
          switch (interaction) {
            case 'zoom':
              target.handleZoomEnd(event);
              break;
            case 'drag':
              target.handleDragEnd(event);
              break;
          }
        }

        if (fingers === 1) {
          lastTouchStart = time;
          lastTouchY = pageY;
          lastTop = top;
        }
      };
      let firstMove = true;
      if (viewerContainer) {
        var parentNode = viewerContainer[0];
      }
      if (parentNode) {
        parentNode.addEventListener('touchstart', (event) => {
          if (target.enabled) {
            firstMove = true;
            fingers = event.touches.length;
            detectDoubleTap(event);
            clientY = event.changedTouches[0].clientY;
            if (fingers > 1) {
              cancelEvent(event);
            }
          }
        });

        parentNode.addEventListener('touchmove', (event) => {
          if (target.enabled) {
            lastclientY = event.changedTouches[0].clientY;
            if (firstMove) {
              updateInteraction(event);
              startTouches = targetTouches(event.touches);
            } else {
              switch (interaction) {
                case 'zoom':
                  target.handleZoom(event, calculateScale(startTouches, targetTouches(event.touches)));
                  break;
                case 'drag':
                  target.handleDrag(event);
                  break;
              }
              if (interaction) {
                target.update(lastclientY);
              }
            }
            if (fingers > 1) {
              cancelEvent(event);
            }
            firstMove = false;
          }
        });

        parentNode.addEventListener('touchend', (event) => {
          if (target.enabled) {
            fingers = event.touches.length;
            if (fingers > 1) {
              cancelEvent(event);
            }
            updateInteraction(event);
          }
        });
      }
    };
    return PinchZoom;
  };
  const PinchZoom = definePinchZoom($);
  const Pdfh5 = function (dom, options) {
    this.version = version;
    this.container = $(dom);
    this.options = options;
    this.init();
  };
  Pdfh5.prototype = {
    init() {
      const self = this;
      this.thePDF = null;
      this.totalNum = null;
      this.pages = null;
      this.initTime = 0;
      this.scale = 1;
      this.currentNum = 1;
      this.loadedCount = 0;
      this.endTime = 0;
      this.pinchZoom = null;
      this.timer = null;
      this.docWidth = document.documentElement.clientWidth;
      this.winWidth = $(window).width();
      this.cache = {};
      this.eventType = {};
      this.cacheNum = 1;
      this.resizeEvent = false;
      this.cacheData = null;
      this.pdfjsLibPromise = null;
      if (this.container[0].pdfLoaded) {
        this.destroy();
      }
      this.container[0].pdfLoaded = false;
      this.container.addClass('pdfjs');
      this.initTime = new Date().getTime();
      setTimeout(() => {
        const arr1 = self.eventType.scroll;
        if (arr1 && arr1 instanceof Array) {
          for (let i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self, self.initTime);
          }
        }
      }, 0);
      this.options = this.options ? this.options : {};
      this.eventType.complete = this.options.completeCallbacks;
      console.log(this);
      this.options.pdfurl = this.options.pdfurl ? this.options.pdfurl : null;
      this.options.data = this.options.data ? this.options.data : null;
      this.options.scale = this.scale;
      this.options.zoomEnable = this.options.zoomEnable !== false;
      this.options.scrollEnable = this.options.scrollEnable !== false;
      this.options.loadingBar = this.options.loadingBar !== false;
      this.options.pageNum = this.options.pageNum !== false;
      this.options.backTop = this.options.backTop !== false;
      this.options.URIenable = this.options.URIenable === true;
      this.options.fullscreen = this.options.fullscreen !== false;
      this.options.lazy = this.options.lazy === true;
      this.options.renderType = this.options.renderType === 'svg' ? 'svg' : 'canvas';
      this.options.resize = this.options.resize !== false;
      if (this.options.limit) {
        const n = parseFloat(this.options.limit);
        this.options.limit = isNaN(n) ? 0 : n < 0 ? 0 : n;
      } else {
        this.options.limit = 0;
      }
      const html = '<div class="loadingBar">'
                + '<div class="progress">'
                + ' <div class="glimmer">'
                + '</div>'
                + ' </div>'
                + '</div>'
                + '<div class="pageNum">'
                + '<div class="pageNum-bg"></div>'
                + ' <div class="pageNum-num">'
                + ' <span class="pageNow">1</span>/'
                + '<span class="pageTotal">1</span>'
                + '</div>'
                + ' </div>'
                + '<div class="backTop">'
                + '</div>'
                + '<div class="loadEffect loading"></div>';
      if (!this.container.find('.pageNum')[0]) {
        this.container.append(html);
      }
      const viewer = document.createElement('div');
      viewer.className = 'pdfViewer';
      const viewerContainer = document.createElement('div');
      viewerContainer.className = 'viewerContainer';
      viewerContainer.appendChild(viewer);
      this.container.append(viewerContainer);
      this.viewer = $(viewer);
      this.viewerContainer = $(viewerContainer);
      this.pageNum = this.container.find('.pageNum');
      this.pageNow = this.pageNum.find('.pageNow');
      this.pageTotal = this.pageNum.find('.pageTotal');
      this.loadingBar = this.container.find('.loadingBar');
      this.progress = this.loadingBar.find('.progress');
      this.progressDom = this.progress[0];
      this.backTop = this.container.find('.backTop');
      this.loading = this.container.find('.loading');
      if (!this.options.loadingBar) {
        this.loadingBar.hide();
      }
      const containerH = this.container.height();
      const height = containerH * (1 / 3);

      if (!this.options.scrollEnable) {
        this.viewerContainer.css({
          overflow: 'hidden',
        });
      } else {
        this.viewerContainer.css({
          overflow: 'auto',
        });
      }
      viewerContainer.addEventListener('scroll', () => {
        const { scrollTop } = viewerContainer;
        if (scrollTop >= 150) {
          if (self.options.backTop) {
            self.backTop.show();
          }
        } else if (self.options.backTop) {
          self.backTop.fadeOut(200);
        }
        if (self.viewerContainer) {
          self.pages = self.viewerContainer.find('.pageContainer');
        }
        clearTimeout(self.timer);
        if (self.options.pageNum && self.pageNum) {
          self.pageNum.show();
        }
        const h = containerH;
        if (self.pages) {
          self.pages.each((index, obj) => {
            const { top } = obj.getBoundingClientRect();
            const { bottom } = obj.getBoundingClientRect();
            if (top <= height && bottom > height) {
              if (self.options.pageNum) {
                self.pageNow.text(index + 1);
              }
              self.currentNum = index + 1;
            }
            if (top <= h && bottom > h) {
              self.cacheNum = index + 1;
            }
          });
        }
        if (scrollTop + self.container.height() >= self.viewer[0].offsetHeight) {
          self.pageNow.text(self.totalNum);
        }
        if (scrollTop === 0) {
          self.pageNow.text(1);
        }
        self.timer = setTimeout(() => {
          if (self.options.pageNum && self.pageNum) {
            self.pageNum.fadeOut(200);
          }
        }, 1500);
        if (self.options.lazy) {
          const num = Math.floor(100 / self.totalNum).toFixed(2);
          if (self.cache[`${self.cacheNum}`] && !self.cache[`${self.cacheNum}`].loaded) {
            var { page } = self.cache[`${self.cacheNum}`];
            var { container } = self.cache[`${self.cacheNum}`];
            var pageNum = self.cacheNum;
            self.cache[`${pageNum}`].loaded = true;
            var { scaledViewport } = self.cache[`${pageNum}`];
            if (self.options.renderType === 'svg') {
              self.renderSvg(page, scaledViewport, pageNum, num, container, self.options);
            } else {
              self.renderCanvas(page, scaledViewport, pageNum, num, container, self.options);
            }
          }
          if (self.cache[`${self.totalNum - 1}`] && self.cache[`${self.totalNum - 1}`].loaded && !self.cache[`${self.totalNum}`].loaded) {
            var { page } = self.cache[`${self.totalNum}`];
            var { container } = self.cache[`${self.totalNum}`];
            var pageNum = self.totalNum;
            self.cache[`${pageNum}`].loaded = true;
            var { scaledViewport } = self.cache[`${pageNum}`];
            if (self.options.renderType === 'svg') {
              self.renderSvg(page, scaledViewport, pageNum, num, container, self.options);
            } else {
              self.renderCanvas(page, scaledViewport, pageNum, num, container, self.options);
            }
          }
        }
        const arr1 = self.eventType.scroll;
        if (arr1 && arr1 instanceof Array) {
          for (let i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self, scrollTop);
          }
        }
      });
      this.backTop.on('click tap', () => {
        const mart = self.viewer.css('transform');
        const arr = mart.replace(/[a-z\(\)\s]/g, '').split(',');
        const s1 = arr[0];
        const s2 = arr[3];
        let x = arr[4] / 2;
        const { left } = self.viewer[0].getBoundingClientRect();
        if (left <= -self.docWidth * 2) {
          x = -self.docWidth / 2;
        }
        self.viewer.css({
          transform: `scale(${s1}, ${s2}) translate(${x}px, 0px)`,
        });
        if (self.pinchZoom) {
          self.pinchZoom.offset.y = 0;
          self.pinchZoom.lastclientY = 0;
        }
        self.viewerContainer.animate({
          scrollTop: 0,
        }, 300);
        const arr1 = self.eventType.backTop;
        if (arr1 && arr1 instanceof Array) {
          for (let i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self);
          }
        }
      });

      function GetQueryString(name) {
        const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
        const r = g.location.search.substr(1).match(reg);
        if (r != null) return decodeURIComponent(r[2]);
        return '';
      }
      const pdfurl = GetQueryString('file');
      let url = '';
      if (pdfurl && self.options.URIenable) {
        url = pdfurl;
      } else if (self.options.pdfurl) {
        url = self.options.pdfurl;
      }
      if (self.options.loadingBar) {
        self.loadingBar.show();
        self.progress.css({
          width: '3%',
        });
      }

      if (url) {
        $.ajax({
          type: 'get',
          mimeType: 'text/plain; charset=x-user-defined',
          url,
          success(data) {
            const rawLength = data.length;
            // var array = new Uint8Array(new ArrayBuffer(rawLength));
            // for (i = 0; i < rawLength; i++) {
            //     array[i] = data.charCodeAt(i) & 0xff;
            // }
            const array = [];
            for (i = 0; i < rawLength; i++) {
              array.push(data.charCodeAt(i) & 0xff);
            }
            self.cacheData = array;
            self.renderPdf(self.options, {
              data: array,
            });
          },
          error(err) {
            self.loading.hide();
            const time = new Date().getTime();
            self.endTime = time - self.initTime;
            const arr1 = self.eventType.complete;
            if (arr1 && arr1 instanceof Array) {
              for (var i = 0; i < arr1.length; i++) {
                arr1[i] && arr1[i].call(self, 'error', err.statusText, self.endTime);
              }
            }
            const arr2 = self.eventType.error;
            if (arr2 && arr2 instanceof Array) {
              for (var i = 0; i < arr2.length; i++) {
                arr2[i] && arr2[i].call(self, err.statusText, self.endTime);
              }
            }
            throw Error(err.statusText);
          },
        });
      } else if (self.options.data) {
        const { data } = self.options;
        const rawLength = data.length;
        if (typeof data === 'string' && data != '') {
          const array = [];
          for (i = 0; i < rawLength; i++) {
            array.push(data.charCodeAt(i) & 0xff);
          }
          self.cacheData = array;
          self.renderPdf(self.options, {
            data: array,
          });
        } else if (typeof data === 'object') {
          if (data.length == 0) {
            var time = new Date().getTime();
            self.endTime = time - self.initTime;
            var arr1 = self.eventType.complete;
            if (arr1 && arr1 instanceof Array) {
              for (var i = 0; i < arr1.length; i++) {
                arr1[i] && arr1[i].call(self, 'error', 'options.data is empty Array', self.endTime);
              }
            }
            var arr2 = self.eventType.error;
            if (arr2 && arr2 instanceof Array) {
              for (var i = 0; i < arr2.length; i++) {
                arr2[i] && arr2[i].call(self, 'options.data is empty Array', self.endTime);
              }
            }
            throw Error('options.data is empty Array');
          } else {
            self.cacheData = data;
            self.renderPdf(self.options, {
              data,
            });
          }
        }
      } else {
        var time = new Date().getTime();
        self.endTime = time - self.initTime;
        var arr1 = self.eventType.complete;
        if (arr1 && arr1 instanceof Array) {
          for (var i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self, 'error', 'Expect options.pdfurl or options.data!', self.endTime);
          }
        }
        var arr2 = self.eventType.error;
        if (arr2 && arr2 instanceof Array) {
          for (var i = 0; i < arr2.length; i++) {
            arr2[i] && arr2[i].call(self, 'Expect options.pdfurl or options.data!', self.endTime);
          }
        }
        throw Error('Expect options.pdfurl or options.data!');
      }
    },
    renderPdf(options, obj) {
      this.container[0].pdfLoaded = true;
      const self = this;
      if (options.cMapUrl) {
        obj.cMapUrl = options.cMapUrl;
      } else {
        obj.cMapUrl = 'https://unpkg.com/pdfjs-dist@2.0.943/cmaps/';
      }
      obj.cMapPacked = true;

      this.pdfjsLibPromise = pdfjsLib.getDocument(obj).then((pdf) => {
        self.loading.hide();
        self.thePDF = pdf;
        self.totalNum = pdf.numPages;
        if (options.limit > 0) {
          self.totalNum = options.limit;
        }
        self.pageTotal.text(self.totalNum);
        if (!self.pinchZoom) {
          const arr1 = self.eventType.ready;
          if (arr1 && arr1 instanceof Array) {
            for (var i = 0; i < arr1.length; i++) {
              arr1[i] && arr1[i].call(self);
            }
          }
          self.pinchZoom = new PinchZoom(self.viewer, {
            tapZoomFactor: options.tapZoomFactor,
            zoomOutFactor: options.zoomOutFactor,
            animationDuration: options.animationDuration,
            maxZoom: options.maxZoom,
            minZoom: options.minZoom,
          }, self.viewerContainer);
          let timeout; const
            firstZoom = true;
          self.pinchZoom.done = function (scale) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              if (self.options.renderType === 'svg') {
                return;
              }
              if (scale <= 1 || self.options.scale == 3) {
                return;
              }
              console.log(scale, self.options.scale);
              if (self.thePDF) {
                self.thePDF.destroy();
                self.thePDF = null;
              }
              self.options.scale = scale;
              self.renderPdf(self.options, { data: self.cacheData });
            }, 310);
            if (scale == 1) {
              if (self.viewerContainer) {
                self.viewerContainer.css({
                  '-webkit-overflow-scrolling': 'touch',
                });
              }
            } else if (self.viewerContainer) {
              self.viewerContainer.css({
                '-webkit-overflow-scrolling': 'auto',
              });
            }
            const arr1 = self.eventType.zoom;
            if (arr1 && arr1 instanceof Array) {
              for (let i = 0; i < arr1.length; i++) {
                arr1[i] && arr1[i].call(self, scale);
              }
            }
          };
          if (options.zoomEnable) {
            self.pinchZoom.enable();
          } else {
            self.pinchZoom.disable();
          }
        }

        let promise = Promise.resolve();
        const num = Math.floor(100 / self.totalNum).toFixed(2);
        for (var i = 1; i <= self.totalNum; i++) {
          self.cache[`${i}`] = {
            page: null,
            loaded: false,
            container: null,
            scaledViewport: null,
          };
          promise = promise.then(((pageNum) => self.thePDF.getPage(pageNum).then((page) => {
            self.cache[`${pageNum}`].page = page;
            const viewport = page.getViewport(options.scale);
            const scale = (self.docWidth / viewport.width).toFixed(2);
            const scaledViewport = page.getViewport(parseFloat(scale));
            const div = document.getElementById(`pageContainer${pageNum}`);
            let container;
            if (!div) {
              container = document.createElement('div');
              container.id = `pageContainer${pageNum}`;
              container.className = 'pageContainer';
              container.setAttribute('name', `page=${pageNum}`);
              container.setAttribute('title', `Page ${pageNum}`);
              const loadEffect = document.createElement('div');
              loadEffect.className = 'loadEffect';
              container.appendChild(loadEffect);
              self.viewer[0].appendChild(container);
              if (window.ActiveXObject || 'ActiveXObject' in window) {
                $(container).css({
                  width: `${viewport.width}px`,
                  height: `${viewport.height}px`,
                }).attr('data-scale', viewport.width / viewport.height);
              } else {
                let h = $(container).width() / (viewport.viewBox[2] / viewport.viewBox[3]);
                if (h > viewport.height) {
                  h = viewport.height;
                }
                $(container).css({
                  'max-width': viewport.width,
                  'max-height': viewport.height,
                  'min-height': `${h}px`,
                }).attr('data-scale', viewport.width / viewport.height);
              }
            } else {
              container = div;
            }
            self.cache[`${pageNum}`].container = container;
            self.cache[`${pageNum}`].scaledViewport = scaledViewport;
            let sum = 0;
            const containerH = self.container.height();
            self.pages = self.viewerContainer.find('.pageContainer');
            if (options.resize) {
              self.resize();
            }
            if (self.pages && options.lazy) {
              self.pages.each((index, obj) => {
                const top = obj.offsetTop;
                if (top <= containerH) {
                  sum = index + 1;
                  self.cache[`${sum}`].loaded = true;
                }
              });
            }

            if (pageNum > sum && options.lazy) {
              return;
            }
            if (options.renderType === 'svg') {
              return self.renderSvg(page, scaledViewport, pageNum, num, container, options, viewport);
            }
            return self.renderCanvas(page, scaledViewport, pageNum, num, container, options);
          })).bind(null, i));
        }
      }).catch((err) => {
        self.loading.hide();
        const time = new Date().getTime();
        self.endTime = time - self.initTime;
        const arr1 = self.eventType.complete;
        if (arr1 && arr1 instanceof Array) {
          for (var i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self, 'error', err.message, self.endTime);
          }
        }
        const arr2 = self.eventType.error;
        if (arr2 && arr2 instanceof Array) {
          for (var i = 0; i < arr2.length; i++) {
            arr2[i] && arr2[i].call(self, err.message, self.endTime);
          }
        }
      });
    },
    renderSvg(page, scaledViewport, pageNum, num, container, options, viewport) {
      const self = this;
      return page.getOperatorList().then((opList) => {
        const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
        return svgGfx.getSVG(opList, scaledViewport).then((svg) => {
          self.loadedCount++;
          container.children[0].style.display = 'none';
          container.appendChild(svg);
          svg.style.width = '100%';
          svg.style.height = '100%';
          if (self.options.loadingBar) {
            self.progress.css({
              width: `${num * self.loadedCount}%`,
            });
          }
          const time = new Date().getTime();
          const arr1 = self.eventType.render;
          if (arr1 && arr1 instanceof Array) {
            for (let i = 0; i < arr1.length; i++) {
              arr1[i] && arr1[i].call(self, pageNum, time - self.initTime, container);
            }
          }
          if (self.loadedCount === self.totalNum) {
            self.finalRender(options);
          }
        });
      });
    },
    renderCanvas(page, viewport, pageNum, num, container, options) {
      const self = this;
      var viewport = page.getViewport(options.scale);
      const scale = (self.docWidth / viewport.width).toFixed(2);
      const canvas = document.createElement('canvas');
      const obj2 = {
        Cheight: viewport.height * scale,
        width: viewport.width,
        height: viewport.height,
        canvas,
        index: self.loadedCount,
      };
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (self.options.loadingBar) {
        self.progress.css({
          width: `${num * self.loadedCount}%`,
        });
      }
      obj2.src = obj2.canvas.toDataURL('image/jpeg');
      return page.render({
        canvasContext: context,
        viewport,
      }).then(() => {
        self.loadedCount++;
        const img = new Image();
        var time = new Date().getTime();
        let time2 = 0;
        if (self.renderTime == 0) {
          time2 = time - self.startTime;
        } else {
          time2 = time - self.renderTime;
        }
        obj2.src = obj2.canvas.toDataURL('image/jpeg');
        img.src = obj2.src;
        img.className = `canvasImg${pageNum}`;
        const img0 = $(`#pageContainer${pageNum}`).find(`.canvasImg${pageNum}`)[0];
        if (container && !img0) {
          container.appendChild(img);
          img.onload = function () {
            // $(container).css({
            //     "min-height": img.height + 'px'
            // })
          };
        } else if (img0) {
          img0.src = obj2.src;
        }
        var time = new Date().getTime();
        const arr1 = self.eventType.render;
        if (arr1 && arr1 instanceof Array) {
          for (let i = 0; i < arr1.length; i++) {
            arr1[i] && arr1[i].call(self, pageNum, time - self.initTime, container);
          }
        }
        if (self.loadedCount === self.totalNum) {
          self.finalRender(options);
        }
      });
    },
    finalRender(options) {
      const time = new Date().getTime();
      const self = this;
      if (self.options.loadingBar) {
        self.progress.css({
          width: '100%',
        });
      }
      setTimeout(() => {
        self.loadingBar.hide();
      }, 300);
      self.endTime = time - self.initTime;
      if (options.renderType === 'svg') {
        if (self.totalNum !== 1) {
          self.cache[`${self.totalNum - 1}`].loaded = true;
        } else {
          self.cache['1'].loaded = true;
        }
      }
      if (options.zoomEnable) {
        if (self.pinchZoom) {
          self.pinchZoom.enable();
        }
      } else if (self.pinchZoom) {
        self.pinchZoom.disable();
      }
      const arr1 = self.eventType.complete;
      if (arr1 && arr1 instanceof Array) {
        for (var i = 0; i < arr1.length; i++) {
          arr1[i] && arr1[i].call(self, 'success', 'pdf加载完成', self.endTime);
        }
      }
      const arr2 = self.eventType.success;
      if (arr2 && arr2 instanceof Array) {
        for (var i = 0; i < arr2.length; i++) {
          arr2[i] && arr2[i].call(self, self.endTime);
        }
      }
    },
    resize() {
      const self = this;
      if (self.resizeEvent) {
        return;
      }
      self.resizeEvent = true;
      let timer;
      if (self.pages) {
        self.getH();
        $(window).on('resize', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            const winWidth = $(window).width();
            if (self.winWidth !== winWidth) {
              self.pages.each((i, item) => {
                const w = $(item).width();
                const s = $(item).attr('data-scale');
                $(item).css({
                  'min-height': `${w / s}px`,
                });
              });
            }
            self.getH();
          }, 300);
        });
      }
    },
    getH() {
      const self = this;
      const num = 0;
      self.pages.each((i, item) => {
        const w = $(item).height();
        num + w;
      });
      $('.pinch-zoom-container').height(num);
    },
    show(callback) {
      this.container.show();
      callback && callback.call(this);
      const arr = this.eventType.show;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this);
        }
      }
    },
    hide(callback) {
      this.container.hide();
      callback && callback.call(this);
      const arr = this.eventType.hide;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this);
        }
      }
    },
    on(type, callback) {
      if (this.eventType[type] && this.eventType[type] instanceof Array) {
        this.eventType[type].push(callback);
      }
      this.eventType[type] = [callback];
    },
    off(type) {
      if (type !== undefined) {
        this.eventType[type] = [null];
      } else {
        for (const i in this.eventType) {
          this.eventType[i] = [null];
        }
      }
    },
    scrollEnable(flag) {
      if (flag === false) {
        this.viewerContainer.css({
          overflow: 'hidden',
        });
      } else {
        this.viewerContainer.css({
          overflow: 'auto',
        });
      }
      const arr = this.eventType.scrollEnable;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this, flag);
        }
      }
    },
    zoomEnable(flag) {
      if (!this.pinchZoom) {
        return;
      }
      if (flag === false) {
        this.pinchZoom.disable();
      } else {
        this.pinchZoom.enable();
      }
      const arr = this.eventType.zoomEnable;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this, flag);
        }
      }
    },
    reset(callback) {
      if (this.pinchZoom) {
        this.pinchZoom.offset.y = 0;
        this.pinchZoom.offset.x = 0;
        this.pinchZoom.lastclientY = 0;
        this.pinchZoom.zoomFactor = 1;
        this.pinchZoom.update();
      }
      if (this.viewerContainer) {
        this.viewerContainer.scrollTop(0);
      }
      callback && callback.call(this);
      const arr = this.eventType.reset;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this);
        }
      }
    },
    destroy(callback) {
      this.reset();
      this.off();
      if (this.thePDF) {
        this.thePDF.destroy();
        this.thePDF = null;
      }
      if (this.viewerContainer) {
        this.viewerContainer.remove();
        this.viewerContainer = null;
      }
      if (this.container) {
        this.container.html('');
      }
      this.totalNum = null;
      this.pages = null;
      this.initTime = 0;
      this.endTime = 0;
      this.viewer = null;
      this.pageNum = null;
      this.pageNow = null;
      this.pageTotal = null;
      this.loadingBar = null;
      this.progress = null;
      this.loadedCount = 0;
      this.timer = null;
      this.show = null;
      this.hide = null;
      callback && callback.call(this);
      const arr = this.eventType.destroy;
      if (arr && arr instanceof Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] && arr[i].call(this);
        }
      }
    },
  };
  return Pdfh5;
}));
