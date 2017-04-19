class BaseMedia extends Meister.MediaPlugin {
    constructor(config, meister) {
        super(config, meister);

        this.player = null;

        this.supports = ['mp4', 'mp3', 'icecast'];

        // HLS behaves like mp4 in samsung devices
        if (this.meister.browser.isSamsung && !window.MediaSource) {
            this.supports.push('m3u', 'm3u8');
        }
    }

    static get pluginName() {
        return 'BaseMedia';
    }

    isItemSupported(item) {
        return new Promise((resolve) => {
            if (this.supports.indexOf(item.type) === -1) {
                return resolve({
                    supported: false,
                    errorCode: Meister.ErrorCodes.WRONG_TYPE,
                });
            }

            return resolve({
                supported: true,
            });
        });
    }

    get currentItem() {
        return this.item;
    }

    process(item) {
        return new Promise((resolve, reject) => {
            this.player = this.meister.getPlayerByType('html5', item);

            if (this.player) {
                this.item = item;

                // TODO: Shouldn't we check first if there is metadata before we trigger an UI event?
                this.meister.trigger('uiEvent', { type: 'splash', info: this.item.metadata });

                resolve(item);
            } else {
                reject(`${this.name}: Unable to play item ${item.src}, no suitable player available.`); //eslint-disable-line
            }
        });
    }

    load(item) {
        super.load(item);

        this.player.currentSrc = item.src;

        // Ugly stuff to fix HLS in safari T_T
        if (item.metadata) {
            this.meister.trigger('itemMetadata', {
                title: item.metadata.title,
            });
        }

        if (item.type === 'm3u' || item.type === 'm3u8') {
            this.meister.trigger('itemBitrates', {
                bitrates: [{ metadata: { bitrate: 0 } }],
                currentIndex: 0,
            });
        }


        this.one('playerLoadedMetadata', () => {
            let isLive = false;

            const duration = this.player.duration;
            if (duration === Infinity || duration === 0) {
                isLive = true;
            }

            this.meister.trigger('itemTimeInfo', {
                isLive,
                duration,
            });
        });

        this.on('_playerTimeUpdate', this._onPlayerTimeUpdate.bind(this));
        this.on('_playerSeek', this._onPlayerSeek.bind(this));
        this.on('requestSeek', this.onRequestSeek.bind(this));
    }

    unload() {
        super.unload();

        this.item = null;
    }

    _onPlayerTimeUpdate() {
        this.meister.trigger('playerTimeUpdate', {
            currentTime: this.meister.currentTime,
            duration: this.meister.duration,
        });
    }

    _onPlayerSeek() {
        const currentTime = this.meister.currentTime;
        const duration = this.meister.duration;
        const relativePosition = currentTime / duration;

        this.meister.trigger('playerSeek', {
            relativePosition,
            currentTime,
            duration,
        });
    }

    onRequestSeek(e) {
        let targetTime;

        if (!isNaN(e.relativePosition)) {
            targetTime = e.relativePosition * this.meister.duration;
        } else if (!isNaN(e.timeOffset)) {
            targetTime = this.meister.currentTime + e.timeOffset;
        }

        // Check whether we are allowed to seek forward.
        if (this.blockSeekForward && targetTime > this.meister.currentTime) { return; }

        if (Number.isFinite(targetTime)) {
            this.meister.currentTime = targetTime;
        }
    }
}

Meister.registerPlugin(BaseMedia.pluginName, BaseMedia);
Meister.registerPlugin('baseMedia', BaseMedia);

export default BaseMedia;
