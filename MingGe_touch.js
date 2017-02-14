/* 
 *  MingGe_touch 触摸插件
 *  
 *  采用MingGejs开发 2017/2/14
 *
 *  作者：明哥先生-QQ399195513 QQ群：17939681   官网：www.shearphoto.com
 */
(function(DOC, $) {
	var $DOC = $(DOC),
		getRect = function(elem) {
			if(elem && elem[0]) {
				var rect = elem[0].getBoundingClientRect();
				return [rect.left + $DOC.scrollLeft(), rect.top + $DOC.scrollTop()];
			}
		},
		getEvent = function(event) {
			var touches = event.touches,
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
		getNotNull = function() {
			var len = arguments.length,
				i = 0,
				argi;
			for(; i < len; i++) {
				argi = arguments[i];
				if(!$.isUndefined(argi)) {
					return argi;
				}
			}
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
		timeOut = function() {
			pcLOCK = false;
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
						stopPropagation(event);
						if(!opisClick) {
							event.preventDefault();
						}
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
							pcLOCK = true;
							return;
						}
						LOCK = false; //设备关锁
						elem[0].setCapture && elem[0].setCapture();
						//console.log(ge);
						var lt = getRect(elem);
						boxL = lt[0];
						boxT = lt[1];
						disL = downX - boxL;
						disT = downY - boxT;
						if(op.down) {
							op.down.call(elem, event, newAPI, {
								X: downX,
								Y: downY,
								X2: downX2,
								Y2: downY2,
								disL: disL,
								disT: disT,
								touchLen: ge.touchLen,
								dev: ge.dev
							});

						}
					},
					touchmove: function(event) { //over
						if(LOCK) {
							return;
						}
						stopPropagation(event);
						event.preventDefault();
						var ge = getEvent(event);
						if(oppc && pcLOCK && ge.dev == "pc") {
							return;
						}
						var opClt = clt(op.container);
						setL = ge.X - disL - op.offsetLeft - opClt[0];
						setT = ge.Y - disT - op.offsetTop - opClt[1];
						endX = ge.X;
						endY = ge.Y;
						endX2 = ge.X2;
						endY2 = ge.Y2;
						//console.log(ge);
						ge.dev == "pc" && selectionEmpty(); //不让选中
						//放大缩小逻辑在这
						if(op.over) {
							op.over.call(elem, event, newAPI, {
								X: endX,
								Y: endY,
								downX: downX,
								downY: downY,
								X2: endX2,
								Y2: endY2,
								downX2: downX2,
								downY2: downY2,
								left: setL,
								top: setT,
								disL: disL,
								disT: disT,
								touchLen: ge.touchLen,
								dev: ge.dev
							});
						}
						return false;
					},
					touchend: function(event) { //up
						if(LOCK) {
							return;
						}
						stopPropagation(event);
						elem[0].releaseCapture && elem[0].releaseCapture();
						LOCK = true; //全部锁定
						var ge = getEvent(event);
						if(oppc) {
							if(ge.dev == "pc") {
								if(pcLOCK) {
									return;
								}
							} else if(opisClick) {
								setTimeout(timeOut, 350); //关PC锁 3秒后关,MOB来处理
							}
						}
						ge.X = getNotNull(ge.X, endX, downX);
						ge.Y = getNotNull(ge.Y, endY, downY);
						ge.X2 = getNotNull(ge.X2, endX2, downX2);
						ge.Y2 = getNotNull(ge.Y2, endY2, downY2);
						//console.log(ge);
						if(op.up) {
							op.up.call(elem, event, newAPI, {
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
								dev: ge.dev
							});
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