import packageJson from '../../package.json';

class BaseMedia extends Meister.MediaPlugin {
    constructor(config, meister) {
        super(config, meister);

        this.player = null;

        this.supports = ['mp4', 'mp3', 'icecast', 'mov'];

        // HLS behaves like mp4 in samsung devices
        if (this.meister.browser.isSamsung && !window.MediaSource) {
            this.supports.push('m3u', 'm3u8');
        }
    }

    static get pluginName() {
        return 'BaseMedia';
    }

    static get pluginVersion() {
        return packageJson.version;
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
    }

    get duration() {
        if (!this.player) { return NaN; }

        return this.player.duration;
    }

    get currentTime() {
        if (!this.player) { return NaN; }

        return this.player.currentTime;
    }

    set currentTime(time) {
        if (!this.player) { return; }

        this.player.currentTime = time;
    }

    unload() {
        super.unload();

        this.item = null;
        this.player = null;
    }

    _onPlayerTimeUpdate() {
        this.meister.trigger('playerTimeUpdate', {
            currentTime: this.player.currentTime,
            duration: this.player.duration,
        });
    }

    _onPlayerSeek() {
        const currentTime = this.player.currentTime;
        const duration = this.player.duration;
        const relativePosition = currentTime / duration;

        this.meister.trigger('playerSeek', {
            relativePosition,
            currentTime,
            duration,
        });
    }

    onRequestSeek(e) {
        let targetTime;

        if (Number.isFinite(e.relativePosition)) {
            targetTime = e.relativePosition * this.player.duration;
        } else if (Number.isFinite(e.timeOffset)) {
            targetTime = this.player.currentTime + e.timeOffset;
        } else if (Number.isFinite(e.targetTime)) {
            targetTime = e.targetTime;
        }

        // Check whether we are allowed to seek forward.
        if (this.blockSeekForward && targetTime > this.player.currentTime) { return; }

        if (Number.isFinite(targetTime)) {
            this.player.currentTime = targetTime;
        }
    }
}

Meister.registerPlugin(BaseMedia.pluginName, BaseMedia);
Meister.registerPlugin('baseMedia', BaseMedia);

export default BaseMedia;
