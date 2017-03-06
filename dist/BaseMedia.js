var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var BaseMedia$1 = function (_Meister$MediaPlugin) {
    inherits(BaseMedia, _Meister$MediaPlugin);

    function BaseMedia(config, meister) {
        classCallCheck(this, BaseMedia);

        var _this = possibleConstructorReturn(this, (BaseMedia.__proto__ || Object.getPrototypeOf(BaseMedia)).call(this, config, meister));

        _this.player = null;

        _this.supports = ['mp4', 'mp3', 'icecast'];

        // HLS behaves like mp4 in samsung devices
        if (_this.meister.browser.isSamsung && !window.MediaSource) {
            _this.supports.push('m3u', 'm3u8');
        }
        return _this;
    }

    createClass(BaseMedia, [{
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

            get(BaseMedia.prototype.__proto__ || Object.getPrototypeOf(BaseMedia.prototype), 'load', this).call(this, item);

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

            this.on('_playerTimeUpdate', this._onPlayerTimeUpdate.bind(this));
            this.on('_playerSeek', this._onPlayerSeek.bind(this));
            this.on('requestSeek', this.onRequestSeek.bind(this));
        }
    }, {
        key: 'unload',
        value: function unload() {
            get(BaseMedia.prototype.__proto__ || Object.getPrototypeOf(BaseMedia.prototype), 'unload', this).call(this);

            this.item = null;
        }
    }, {
        key: '_onPlayerTimeUpdate',
        value: function _onPlayerTimeUpdate() {
            this.meister.trigger('playerTimeUpdate', {
                currentTime: this.meister.currentTime,
                duration: this.meister.duration
            });
        }
    }, {
        key: '_onPlayerSeek',
        value: function _onPlayerSeek() {
            var currentTime = this.meister.currentTime;
            var duration = this.meister.duration;
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
                targetTime = e.relativePosition * this.meister.duration;
            } else if (!isNaN(e.timeOffset)) {
                targetTime = this.meister.currentTime + e.timeOffset;
            }

            // Check whether we are allowed to seek forward.
            if (this.blockSeekForward && targetTime > this.meister.currentTime) {
                return;
            }

            if (Number.isFinite(targetTime)) {
                this.meister.currentTime = targetTime;
            }
        }
    }, {
        key: 'currentItem',
        get: function get$$1() {
            return this.item;
        }
    }], [{
        key: 'pluginName',
        get: function get$$1() {
            return 'BaseMedia';
        }
    }]);
    return BaseMedia;
}(Meister.MediaPlugin);

Meister.registerPlugin(BaseMedia$1.pluginName, BaseMedia$1);

export default BaseMedia$1;
//# sourceMappingURL=BaseMedia.js.map
