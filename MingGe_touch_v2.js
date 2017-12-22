/* 
 *  MingGe_touch v2触摸、下拉刷新插件 基于MingGeJs
 *  
 *  开发时间2017/12/22
 *
 *  作者：明哥先生-QQ2945157617 QQ群：326692453   官网：www.shearphoto.com
 * 
 *  支持IE6及所有尘世间所有浏览器
 */

(function(DOC, $) {
	var $DOC = $(DOC),
		getRect = function(elem, isFixed) {
			if(elem && elem[0]) {
				var rect = elem[0].getBoundingClientRect();
				return isFixed ? [rect.left, rect.top] : [rect.left + $DOC.scrollLeft(), rect.top + $DOC.scrollTop()];
			}
		},
		getEvent = function(event, is) {
			var touches = is ? event.changedTouches : event.touches,
				eventbutton = event.button,
				typebutton = typeof eventbutton,
				isButtonNumber = typebutton == "number";
			if(touches && !isButtonNumber) { //手机端
				var len = touches.length;
				if(len > 0) {
					var touches0 = touches[0],
						X = touches0.clientX,
						Y = touches0.clientY;
					if(len > 1) {
						var touches1 = touches[1],
							X2 = touches1.clientX,
							Y2 = touches1.clientY;
					}
				}
				return {
					X: X,
					Y: Y,
					X2: X2,
					Y2: Y2,
					touchLen: len,
					dev: "mob"
				}

			} else if(isButtonNumber && eventbutton < 2) { //pc端
				return {
					X: event.clientX,
					Y: event.clientY,
					touchLen: 1,
					dev: "pc"
				}
			}
			return false;
		},

		selectionEmpty = function() {
			if(DOC.selection && DOC.selection.empty) {
				DOC.selection.empty();
			} else {
				window.getSelection().removeAllRanges();
			}
		},
		stopPropagation = function(event) {
			if(event.stopPropagation) {
				event.stopPropagation();
			} else {
				event.cancelBubble = true;
			}
		},
		initTouchEvent = function(elem, op) {
			var downX, //按下时，X值
				downY, //按下时，Y值
				downX2, //第二手指触点X
				downY2, //第二手指触点Y
				boxL, //DIV左距
				boxT, //DIV顶距
				LOCK = true, //事件锁头
				pcLOCK = false, //PC锁
				isPause = false, //是否暂停
				disL, //开始触摸点与DIV的左距离
				disT, //开始触摸点与DIV的左顶距离
				endX, //最后移动的X值
				endY, // 最后移动的Y值
				endX2, //第二手指最后移动的X值
				endY2, //第二手指最后移动的Y值
				setL, //要设置的左距
				setT, //要设置的顶距
				oppc = op.pc,
				opmob = op.mob,
				opisClick = op.isClick,
				isRefresh = op.isRefresh,
				isFixed = false,
				timeOut = function() {
					pcLOCK = false;
				},
				APIreturn = {
					stop: function() { // 所有指定线程
						LOCK = true;
						elem.unbind(this.touchstart);
						$DOC.unbind(this.touchmove);
						$DOC.unbind(this.touchend);
						delete this.touchstart;
						delete this.touchmove;
						delete this.touchend;
						delete this.stop;
					},
					pause: function() { // 暂停指定线程
						if(isPause) {
							isPause = false;
						} else {
							LOCK = isPause = true;
							pcLOCK = false;
						}
					},
					touchstart: function(event) { //down
						if(isPause) {
							return;
						}
						isFixed = elem.css("position") == "fixed";
						var ge = getEvent(event);
						if(ge) {
							if(oppc) {
								if(ge.dev == "pc") {
									if(pcLOCK) {
										return;
									}
								} else if(opisClick) {
									pcLOCK = true;
								}
							}
							downX = ge.X;
							downY = ge.Y;
							downX2 = ge.X2;
							downY2 = ge.Y2;
						} else {
							return;
						}
						LOCK = false; //设备关锁

						elem[0].setCapture && elem[0].setCapture();
						var lt = getRect(elem, isFixed);
						boxL = lt[0];
						boxT = lt[1];
						disL = downX - boxL;
						disT = downY - boxT;
						if(op.down) {
							var boole = op.down.call(elem, event, newAPI, {
								X: downX,
								Y: downY,
								X2: downX2,
								Y2: downY2,
								left: boxL,
								top: boxT,
								disL: disL,
								disT: disT,
								touchLen: ge.touchLen,
								dev: ge.dev,
								isdown: true
							});
							if(!opisClick || boole === false) {
								event.preventDefault();
							}
						}
					},
					touchmove: function(event) { //over
						if(LOCK) {
							return;
						}
						var ge = getEvent(event);
						if(oppc && pcLOCK && ge.dev == "pc") {
							return;
						}
						var opClt = clt(op.container);
						if(isRefresh) {
							//下拉移动逻辑开始
							setL = (ge.X - downX) * isRefresh;
							setT = (ge.Y - downY) * isRefresh;
							//下拉移动逻辑结束
						} else {
							setL = ge.X - disL - op.offsetLeft - opClt[0];
							setT = ge.Y - disT - op.offsetTop - opClt[1];
						}
						//console.log(ge);
						//放大缩小逻辑在这
						if(op.over) {
							var boole = op.over.call(elem, event, newAPI, {
								X: ge.X,
								Y: ge.Y,
								downX: downX,
								downY: downY,
								X2: ge.X2,
								Y2: ge.Y2,
								downX2: downX2,
								downY2: downY2,
								left: setL,
								top: setT,
								disL: disL,
								disT: disT,
								touchLen: ge.touchLen,
								dev: ge.dev
							});
							ge.dev == "pc" && selectionEmpty(); //不让选中
							stopPropagation(event);
							boole === false && event.preventDefault();
						}

					},
					touchend: function(event) { //up
						if(LOCK) {
							return;
						}
						LOCK = true; //全部锁定
						var ge = getEvent(event, true); //targetTouches
						if(oppc) {
							if(ge.dev == "pc") {
								if(pcLOCK) {
									return;
								}
							} else {
								setTimeout(timeOut, 350); //关PC锁 3秒后关,MOB来处理
							}
						}
						elem[0].releaseCapture && elem[0].releaseCapture();
						//console.log(ge);
						if(op.up) {
							var boole = op.up.call(elem, event, newAPI, {
								X: ge.X,
								Y: ge.Y,
								X2: ge.X2,
								Y2: ge.Y2,
								downX: downX,
								downY: downY,
								downX2: downX2,
								downY2: downY2,
								disL: disL,
								disT: disT,
								left: setL,
								top: setT,
								touchLen: ge.touchLen,
								dev: ge.dev,
								isup: true
							});
							stopPropagation(event);
							boole === false && event.preventDefault();
						}
					}
				},
				newAPI = new API(APIreturn); //接口API
			return APIreturn;
		},

		clt = function(container) {
			return getRect(container) || [0, 0]

		},
		sp = function(arr, item) {
			var len = arr.length,
				i = 0,
				arri;
			for(; i < len; i++) {
				arri = arr[i];
				arri[item] && arri[item]();
			}
		},
		API = function(arr) {
			this._OBJ_ = $.isArray(arr) ? arr : [arr];
		};
	API.prototype = {
		stop: function() {
			sp(this._OBJ_, "stop");
		},
		pause: function() {
			sp(this._OBJ_, "pause");
		}
	}
	$.fn.extend({
		refresh: function(op) {
			op = $.extend({
				pc: true,
				mobile: true,
				maxX: 300,
				maxY: 300,
				ratio: 0.4,
				container: null,
				callback: null,
				up: null,
			}, op);
			$.isFunction(op.callback) || (op.callback = 0);
			$.isFunction(op.up) || (op.up = 0);
			($.isNumber(op.ratio) && op.ratio < 1 && op.ratio > 0) || (op.ratio = 0.4);
			var RefreshCallback = function(event, api, obj) {
				op.callback && op.callback.call(this, event, {
					X: obj.left < ($.isNumber(op.maxX) ? op.maxX : op.maxX()) ? 0 : 1,
					Y: obj.top < ($.isNumber(op.maxY) ? op.maxY : op.maxY()) ? 0 : 1,
					isup: !!obj.isup,
					isdown: !!obj.isdown
				}, obj);
				return false;
			}
			return this.touch({
				mobile: op.mobile,
				pc: op.pc,
				isRefresh: op.ratio,
				container: op.container,
				down: RefreshCallback,
				up: RefreshCallback,
				over: RefreshCallback
			});
		},
		touch: function(op) {
			op = $.extend({
				down: 0,
				up: 0,
				container: null,
				offsetLeft: 0,
				pc: true,
				mobile: true,
				offsetTop: 0,
				isClick: true,
				isRefresh: false,
				over: 0
			}, op);
			$.isFunction(op.over) || (op.over = 0);
			$.isFunction(op.up) || (op.up = 0);
			$.isFunction(op.down) || (op.down = 0);
			op.offsetLeft = Number(op.offsetLeft) || 0;
			op.offsetTop = Number(op.offsetTop) || 0;
			var initArray = [];
			this.each(function() {
				var $this = $(this),
					init = initTouchEvent($this, op),
					elemBind = {},
					docBind = {}
				if(op.pc) {
					elemBind.mousedown = init.touchstart;
					docBind.mousemove = init.touchmove;
					docBind.mouseup = init.touchend;
				}
				if(op.mobile) {
					elemBind.touchstart = init.touchstart;
					docBind.touchmove = init.touchmove;
					docBind.touchend = init.touchend;
					docBind.touchcancel = init.touchend;
				}

				$this.bind(elemBind);
				$DOC.bind(docBind);
				initArray.push(init);
			});
			var newAPI = new API(initArray);
			return newAPI;
		}
	});
})(document, MingGe);