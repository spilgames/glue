glue.module.create('js/input/keyboard',
	function () {
		var keysDown = {},
			keysHit = {},
			handleKeyDown = function (event) {
				keysDown[event.keyCode] = true;
				keysHit[event.keyCode] = true;
			},
			handleKeyUp = function (event) {
				keysDown[event.keyCode] = false;
				keysHit[event.keyCode] = false;
			},
			module = {
				//KeyCodes
		        KEY_BACKSPACE: 8,
		        KEY_TAB: 9,
		        KEY_ENTER: 13,
		        KEY_SHIFT: 16,
		        KEY_CTRL: 17,
		        KEY_ALT: 18,
		        KEY_PAUSE: 19,
		        KEY_CAPSLOCK: 20,
		        KEY_ESCAPE: 27,
		        KEY_PAGEUP: 33,
		        KEY_PAGEDOWN: 34,
		        KEY_END: 35,
		        KEY_HOME: 36,
		        KEY_LEFT: 37,
		        KEY_UP: 38,
		        KEY_RIGHT: 39,
		        KEY_DOWN: 40,
		        KEY_INSERT: 45,
		        KEY_DELETE: 46,
		        KEY_0:48,
		        KEY_1:49,
		        KEY_2:50,
		        KEY_3:51,
		        KEY_4:52,
		        KEY_5:53,
		        KEY_6:54,
		        KEY_7:55,
		        KEY_8:56,
		        KEY_9:57,
		        KEY_A:65,
		        KEY_B:66,
		        KEY_C:67,
		        KEY_D:68,
		        KEY_E:69,
		        KEY_F:70,
		        KEY_G:71,
		        KEY_H:72,
		        KEY_I:73,
		        KEY_J:74,
		        KEY_K:75,
		        KEY_L:76,
		        KEY_M:77,
		        KEY_N:78,
		        KEY_O:79,
		        KEY_P:80,
		        KEY_Q:81,
		        KEY_R:82,
		        KEY_S:83,
		        KEY_T:84,
		        KEY_U:85,
		        KEY_V:86,
		        KEY_W:87,
		        KEY_X:88,
		        KEY_Y:89,
		        KEY_Z:90,
		        KEY_WINLEFT: 91,
		        KEY_WINRIGHT: 92,
		        KEY_SELECT: 93,
		        KEY_NUM0:96,
		        KEY_NUM1:97,
		        KEY_NUM2:98,
		        KEY_NUM3:99,
		        KEY_NUM4:100,
		        KEY_NUM5:101,
		        KEY_NUM6:102,
		        KEY_NUM7:103,
		        KEY_NUM8:104,
		        KEY_NUM9:105,
		        KEY_MULTIPLY: 106,
		        KEY_ADD: 107,
		        KEY_SUBSTRACT: 109,
		        KEY_DECIMALPOINT: 110,
		        KEY_DIVIDE: 111,
		        KEY_F1: 112,
		        KEY_F2: 113,
		        KEY_F3: 114,
		        KEY_F4: 115,
		        KEY_F5: 116,
		        KEY_F6: 117,
		        KEY_F7: 118,
		        KEY_F8: 119,
		        KEY_F9: 120,
		        KEY_F10: 121,
		        KEY_F11: 122,
		        KEY_F12: 123,
		        KEY_NUMLOCK: 144,
		        KEY_SCROLLLOCK: 145,
		        KEY_SEMICOLON: 186,
		        KEY_EQUAL: 187,
		        KEY_COMMA: 188,
		        KEY_DASH: 189,
		        KEY_PERIOD: 190,
		        KEY_FWDSLASH: 191,
		        KEY_GRAVEACCENT: 192,
		        KEY_OPENBRACKET: 219,
		        KEY_BACKSLASH: 220,
		        KEY_CLOSEBRAKET: 221,
		        KEY_SINGLEQUOTE: 222,
		        KEY_SPACE: 32,
		        //KeyCodes End
				isKeyDown: function (keyCode) {
					return keysDown[keyCode];
				},
				isKeyHit: function (keyCode) {
					if (keysHit[keyCode]) {
						keysHit[keyCode] = false;
						return true;
					}
					return false;
				}
 			};

 		document.addEventListener('keydown', handleKeyDown);
 		document.addEventListener('keyup', handleKeyUp);

		return module;
	}
);