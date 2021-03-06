module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _BaseMedia = __webpack_require__(1);

var _BaseMedia2 = _interopRequireDefault(_BaseMedia);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _BaseMedia2.default;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _package = __webpack_require__(2);

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BaseMedia = function (_Meister$MediaPlugin) {
    _inherits(BaseMedia, _Meister$MediaPlugin);

    function BaseMedia(config, meister) {
        _classCallCheck(this, BaseMedia);

        var _this = _possibleConstructorReturn(this, (BaseMedia.__proto__ || Object.getPrototypeOf(BaseMedia)).call(this, config, meister));

        _this.player = null;

        _this.supports = ['mp4', 'mp3', 'icecast', 'mov'];

        // HLS behaves like mp4 in samsung devices
        if (_this.meister.browser.isSamsung && !window.MediaSource) {
            _this.supports.push('m3u', 'm3u8');
        }
        return _this;
    }

    _createClass(BaseMedia, [{
        key: 'isItemSupported',
        value: function isItemSupported(item) {
            var _this2 = this;

            return new Promise(function (resolve) {
                if (_this2.supports.indexOf(item.type) === -1) {
                    return resolve({
                        supported: false,
                        errorCode: Meister.ErrorCodes.WRONG_TYPE
                    });
                }

                return resolve({
                    supported: true
                });
            });
        }
    }, {
        key: 'process',
        value: function process(item) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                _this3.player = _this3.meister.getPlayerByType('html5', item);

                if (_this3.player) {
                    _this3.item = item;

                    // TODO: Shouldn't we check first if there is metadata before we trigger an UI event?
                    _this3.meister.trigger('uiEvent', { type: 'splash', info: _this3.item.metadata });

                    resolve(item);
                } else {
                    reject(_this3.name + ': Unable to play item ' + item.src + ', no suitable player available.'); //eslint-disable-line
                }
            });
        }
    }, {
        key: 'load',
        value: function load(item) {
            var _this4 = this;

            _get(BaseMedia.prototype.__proto__ || Object.getPrototypeOf(BaseMedia.prototype), 'load', this).call(this, item);

            this.player.currentSrc = item.src;

            // Ugly stuff to fix HLS in safari T_T
            if (item.metadata) {
                this.meister.trigger('itemMetadata', {
                    title: item.metadata.title
                });
            }

            if (item.type === 'm3u' || item.type === 'm3u8') {
                this.meister.trigger('itemBitrates', {
                    bitrates: [{ metadata: { bitrate: 0 } }],
                    currentIndex: 0
                });
            }

            this.one('playerLoadedMetadata', function () {
                var isLive = false;

                var duration = _this4.player.duration;
                if (duration === Infinity || duration === 0) {
                    isLive = true;
                }

                _this4.meister.trigger('itemTimeInfo', {
                    isLive: isLive,
                    duration: duration
                });
            });
        }
    }, {
        key: 'unload',
        value: function unload() {
            _get(BaseMedia.prototype.__proto__ || Object.getPrototypeOf(BaseMedia.prototype), 'unload', this).call(this);

            this.item = null;
        }
    }, {
        key: '_onPlayerTimeUpdate',
        value: function _onPlayerTimeUpdate() {
            this.meister.trigger('playerTimeUpdate', {
                currentTime: this.player.currentTime,
                duration: this.player.duration
            });
        }
    }, {
        key: '_onPlayerSeek',
        value: function _onPlayerSeek() {
            var currentTime = this.player.currentTime;
            var duration = this.player.duration;
            var relativePosition = currentTime / duration;

            this.meister.trigger('playerSeek', {
                relativePosition: relativePosition,
                currentTime: currentTime,
                duration: duration
            });
        }
    }, {
        key: 'onRequestSeek',
        value: function onRequestSeek(e) {
            var targetTime = void 0;

            if (!isNaN(e.relativePosition)) {
                targetTime = e.relativePosition * this.player.duration;
            } else if (!isNaN(e.timeOffset)) {
                targetTime = this.player.currentTime + e.timeOffset;
            }

            // Check whether we are allowed to seek forward.
            if (this.blockSeekForward && targetTime > this.player.currentTime) {
                return;
            }

            if (Number.isFinite(targetTime)) {
                this.player.currentTime = targetTime;
            }
        }
    }, {
        key: 'currentItem',
        get: function get() {
            return this.item;
        }
    }, {
        key: 'duration',
        get: function get() {
            if (!this.player) {
                return NaN;
            }

            return this.player.duration;
        }
    }, {
        key: 'currentTime',
        get: function get() {
            if (!this.player) {
                return NaN;
            }

            return this.player.currentTime;
        },
        set: function set(time) {
            if (!this.player) {
                return;
            }

            this.player.currentTime = time;
        }
    }], [{
        key: 'pluginName',
        get: function get() {
            return 'BaseMedia';
        }
    }, {
        key: 'pluginVersion',
        get: function get() {
            return _package2.default.version;
        }
    }]);

    return BaseMedia;
}(Meister.MediaPlugin);

Meister.registerPlugin(BaseMedia.pluginName, BaseMedia);
Meister.registerPlugin('baseMedia', BaseMedia);

exports.default = BaseMedia;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = {
	"name": "@meisterplayer/plugin-basemedia",
	"version": "5.2.0",
	"description": "Meister plugin for playback of basic media types (mp4, mp3, etc).",
	"main": "dist/BaseMedia.js",
	"keywords": [
		"meister",
		"video",
		"plugin"
	],
	"repository": {
		"type": "git",
		"url": "https://github.com/meisterplayer/media-basemedia.git"
	},
	"author": "Triple",
	"license": "Apache-2.0",
	"dependencies": {},
	"devDependencies": {
		"meister-gulp-webpack-tasks": "^1.0.6",
		"meister-js-dev": "^3.1.0",
		"gulp": "^3.9.1",
		"babel-preset-es2015": "^6.24.0",
		"babel-preset-es2017": "^6.22.0"
	},
	"peerDependencies": {
		"@meisterplayer/meisterplayer": ">= 5.1.0"
	}
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(0);


/***/ })
/******/ ]);
//# sourceMappingURL=BaseMedia.js.map