import '@meisterplayer/meister-mock';
import BaseMedia from '../src/js/BaseMedia';

const PLUGIN_NAME = 'BaseMedia';
const SUPPORTED_TYPES = ['mp4', 'mp3', 'icecast', 'mov'];

describe('BaseMedia class', () => {
    test(`pluginName should be ${PLUGIN_NAME}`, () => {
        expect(BaseMedia.pluginName).toBe(PLUGIN_NAME);
    });

    test('pluginVersion should return a version string', () => {
        // Version should match the SemVer pattern (e.g. 2.11.9)
        expect(BaseMedia.pluginVersion).toMatch(/\d+\.\d+\.\d+/);
    });
});

describe('Basemedia', () => {
    let browserMock;
    let meisterInstanceMock;
    let baseMedia;
    let baseMediaConfigMock = {};

    beforeEach(() => {
        browserMock = {};
        meisterInstanceMock = { browser: browserMock };
        baseMediaConfigMock = {};
        baseMedia = new BaseMedia(baseMediaConfigMock, meisterInstanceMock);
    });

    describe('Constructor', () => {
        test('It should return an instance', () => {
            expect(baseMedia).not.toBeNull();
            expect(baseMedia).toBeDefined();
        });

        test('It should support mp4, mp3, icecast, and mov by default', () => {
            expect(baseMedia.supports).toContain(...SUPPORTED_TYPES);
        });

        test('It should support m3u and m3u8 on Samsung browsers without MediaSource', () => {
            // MediaSource is null by default in the testing environment.
            browserMock = { isSamsung: true };
            meisterInstanceMock = { browser: browserMock };
            baseMedia = new BaseMedia(baseMediaConfigMock, meisterInstanceMock);

            expect(baseMedia.supports).toContain('m3u', 'm3u8');
        });
    });

    describe('Getters and setters', () => {
        describe('get currentItem', () => {
            test('It should not return an item when there is none', () => {
                const item = baseMedia.currentItem;

                expect(item).not.toBeDefined();
            });

            test('It should return the item when there is one', () => {
                const ITEM_MOCK = {};
                baseMedia.item = ITEM_MOCK;

                const item = baseMedia.currentItem;

                expect(item).toEqual(ITEM_MOCK);
            });
        });

        describe('get duration', () => {
            test('It should return NaN when no player is loaded', () => {
                expect(baseMedia.duration).toBeNaN();
            });

            test('It should return the player.duration when a player is loaded', () => {
                const expected = 13.37;
                baseMedia.player = { duration: expected };

                expect(baseMedia.duration).toBe(expected);
            });
        });

        describe('get currentTime', () => {
            test('It should return NaN when no player is loaded', () => {
                expect(baseMedia.currentTime).toBeNaN();
            });

            test('It should return the player.currentTime when a player is loaded', () => {
                const expected = 13.37;
                baseMedia.player = { currentTime: expected };

                expect(baseMedia.currentTime).toBe(expected);
            });
        });

        describe('set currentTime', () => {
            test('It should do nothing when no player is loaded', () => {
                expect(() => {
                    baseMedia.currentTime = 100;
                }).not.toThrow();
            });

            test('It should set the player.duration when a player is loaded', () => {
                const expected = 13.37;
                baseMedia.player = { currentTime: 0 };

                baseMedia.currentTime = expected;
                expect(baseMedia.currentTime).toBe(expected);
            });
        });
    });

    describe('BaseMedia methods', () => {
        const TEST_TYPE = 'test';
        const TEST_SRC = 'src';
        let ITEM_MOCK;

        beforeEach(() => {
            ITEM_MOCK = { type: TEST_TYPE, src: TEST_SRC };
        });

        describe('isItemSupported', () => {
            test('It should resolve supported types with a positive result', async () => {
                expect.assertions(1);

                // Mock the supported type.
                baseMedia.supports = [TEST_TYPE];

                await expect(baseMedia.isItemSupported(ITEM_MOCK)).resolves.toEqual({
                    supported: true,
                });
            });

            test('It should resolve unsupported types with a negative result and the WRONG_TYPE error code', async () => {
                expect.assertions(1);

                // Make sure no types are supported.
                baseMedia.supports = [];

                const EXPECTED_ERROR_CODE = 404;
                global.Meister.ErrorCodes.WRONG_TYPE = EXPECTED_ERROR_CODE;

                const result = await baseMedia.isItemSupported(ITEM_MOCK);

                expect(result).toEqual({
                    supported: false,
                    errorCode: EXPECTED_ERROR_CODE,
                });
            });
        });

        describe('process', () => {
            let getPlayerByTypeMock;

            beforeEach(() => {
                getPlayerByTypeMock = jest.fn();
                meisterInstanceMock.getPlayerByType = getPlayerByTypeMock;
            });

            test('It should call getPlayerByType once with the player type and item', async () => {
                // We need this test to catch the reject.
                await expect(baseMedia.process(ITEM_MOCK)).rejects.toBeDefined();

                expect(getPlayerByTypeMock.mock.calls.length).toBe(1);
                // Should the html5 be hardcoded in here?
                expect(getPlayerByTypeMock).toBeCalledWith('html5', ITEM_MOCK);
            });

            describe('No player available', () => {
                test('It should not save a player when unable to find a player', async () => {
                    await expect(baseMedia.process(ITEM_MOCK)).rejects.toBeDefined();

                    expect(baseMedia.player).not.toBeDefined();
                });

                test('It should reject with a string mentioning the source when unable to find a player', async () => {
                    await expect(baseMedia.process(ITEM_MOCK)).rejects.toMatch(TEST_SRC);
                });

                test('It should not save the item when unable to find a player', async () => {
                    await expect(baseMedia.process(ITEM_MOCK)).rejects.toBeDefined();

                    expect(baseMedia.item).not.toBeDefined();
                });
            });

            describe('Player available', () => {
                let PLAYER_MOCK;
                let triggerMock;

                beforeEach(() => {
                    PLAYER_MOCK = {};

                    triggerMock = jest.fn();
                    meisterInstanceMock.trigger = triggerMock;

                    getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
                });

                test('It should save a player when a player is found', async () => {
                    await baseMedia.process(ITEM_MOCK);

                    expect(baseMedia.player).toBe(PLAYER_MOCK);
                });

                test('It should resolve with the item when a player is found', async () => {
                    await expect(baseMedia.process(ITEM_MOCK)).resolves.toBe(ITEM_MOCK);
                });

                test('It should save the item when a player is found', async () => {
                    await baseMedia.process(ITEM_MOCK);

                    expect(baseMedia.item).toBe(ITEM_MOCK);
                });

                test('It should trigger a ui splash event with item metadata', async () => {
                    const ITEM_METADATA_MOCK = {};
                    ITEM_MOCK.metadata = ITEM_METADATA_MOCK;

                    await baseMedia.process(ITEM_MOCK);

                    expect(triggerMock.mock.calls.length).toBe(1);
                    expect(triggerMock).toBeCalledWith('uiEvent', {
                        type: 'splash',
                        info: ITEM_METADATA_MOCK,
                    });
                });
            });
        });

        describe('load', () => {
            let superLoadMock;
            let triggerMock;
            let oneMock;
            let PLAYER_MOCK;

            beforeEach(() => {
                superLoadMock = jest.fn();
                global.Meister.MediaPlugin.prototype.load = superLoadMock;

                triggerMock = jest.fn();
                meisterInstanceMock.trigger = triggerMock;

                oneMock = jest.fn();
                baseMedia.one = oneMock;

                PLAYER_MOCK = {};
                baseMedia.player = PLAYER_MOCK;
            });

            afterEach(() => {
                delete global.Meister.MediaPlugin.prototype.load;
            });

            test('It should call the super method with the item', () => {
                baseMedia.load(ITEM_MOCK);

                expect(superLoadMock.mock.calls.length).toBe(1);
                expect(superLoadMock).toBeCalledWith(ITEM_MOCK);
            });

            test('It should set the src of the current player to the item src', () => {
                baseMedia.load(ITEM_MOCK);

                expect(baseMedia.player.currentSrc).toBe(ITEM_MOCK.src);
            });

            test('It should trigger itemBitrates with empty bitrates for m3u', () => {
                ITEM_MOCK.type = 'm3u';

                baseMedia.load(ITEM_MOCK);

                expect(triggerMock.mock.calls.length).toBe(1);
                expect(triggerMock).toBeCalledWith('itemBitrates', {
                    bitrates: [{ metadata: { bitrate: 0 } }],
                    currentIndex: 0,
                });
            });

            test('It should trigger itemBitrates with empty bitrates for m3u8', () => {
                ITEM_MOCK.type = 'm3u8';

                baseMedia.load(ITEM_MOCK);

                expect(triggerMock.mock.calls.length).toBe(1);
                expect(triggerMock).toBeCalledWith('itemBitrates', {
                    bitrates: [{ metadata: { bitrate: 0 } }],
                    currentIndex: 0,
                });
            });

            test('It should call register a callback for playerLoadedMetadata', () => {
                baseMedia.load(ITEM_MOCK);

                expect(oneMock.mock.calls.length).toBe(1);
                expect(oneMock).toBeCalledWith('playerLoadedMetadata', expect.any(Function));
            });

            describe('on playerLoadedMetadata', () => {
                const PLAYER_DURATION = 100;

                beforeEach(() => {
                    PLAYER_MOCK = {
                        duration: PLAYER_DURATION,
                    };
                    baseMedia.player = PLAYER_MOCK;

                    oneMock = jest.fn((name, cb) => { cb(); });
                    baseMedia.one = oneMock;
                });

                test('It should trigger itemTimeInfo with the correct time info for items with a duration', () => {
                    baseMedia.load(ITEM_MOCK);

                    expect(triggerMock).toBeCalledWith('itemTimeInfo', {
                        isLive: false,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should trigger itemTimeInfo with the correct time info for items without duration', () => {
                    const NO_DURATION = 0;
                    PLAYER_MOCK.duration = NO_DURATION;

                    baseMedia.load(ITEM_MOCK);

                    expect(triggerMock).toBeCalledWith('itemTimeInfo', {
                        isLive: true,
                        duration: NO_DURATION,
                    });
                });

                test('It should trigger itemTimeInfo with the correct time info for items with an infinite duration', () => {
                    const INFINITE_DURATION = Infinity;
                    PLAYER_MOCK.duration = INFINITE_DURATION;

                    baseMedia.load(ITEM_MOCK);

                    expect(triggerMock).toBeCalledWith('itemTimeInfo', {
                        isLive: true,
                        duration: INFINITE_DURATION,
                    });
                });
            });
        });

        describe('unload', () => {
            let superUnloadMock;

            beforeEach(() => {
                superUnloadMock = jest.fn();
                global.Meister.MediaPlugin.prototype.unload = superUnloadMock;
            });

            afterEach(() => {
                delete global.Meister.MediaPlugin.prototype.unload;
            });

            test('It should call the super method', () => {
                baseMedia.unload();

                expect(superUnloadMock.mock.calls.length).toBe(1);
                expect(superUnloadMock).toBeCalledWith();
            });

            test('It should reset the item', () => {
                baseMedia.item = ITEM_MOCK;
                baseMedia.unload();

                expect(baseMedia.item).toBeNull();
            });

            test('It should reset the player', () => {
                baseMedia.player = {};
                baseMedia.unload();

                expect(baseMedia.player).toBeNull();
            });
        });

        describe('Event proxies', () => {
            let PLAYER_MOCK;
            let triggerMock;

            beforeEach(() => {
                triggerMock = jest.fn();
                meisterInstanceMock.trigger = triggerMock;

                PLAYER_MOCK = {
                    currentTime: 50,
                    duration: 100,
                };
                baseMedia.player = PLAYER_MOCK;
            });

            describe('_onPlayerTimeUpdate', () => {
                test('It should trigger playerTimeUpdate with the current time and duration', () => {
                    baseMedia._onPlayerTimeUpdate();

                    expect(triggerMock.mock.calls.length).toBe(1);
                    expect(triggerMock).toBeCalledWith('playerTimeUpdate', {
                        currentTime: PLAYER_MOCK.currentTime,
                        duration: PLAYER_MOCK.duration,
                    });
                });
            });

            describe('_onPlayerSeek', () => {
                test('It should trigger playerSeek with the current time, duration, and relative position', () => {
                    baseMedia._onPlayerSeek();

                    expect(triggerMock.mock.calls.length).toBe(1);
                    expect(triggerMock).toBeCalledWith('playerSeek', {
                        relativePosition: PLAYER_MOCK.currentTime / PLAYER_MOCK.duration,
                        currentTime: PLAYER_MOCK.currentTime,
                        duration: PLAYER_MOCK.duration,
                    });
                });
            });
        });

        describe('onRequestSeek', () => {
            const PLAYER_TIME = 50;
            const PLAYER_DURATION = 100;
            let PLAYER_MOCK;

            beforeEach(() => {
                PLAYER_MOCK = {
                    currentTime: PLAYER_TIME,
                    duration: PLAYER_DURATION,
                };

                baseMedia.player = PLAYER_MOCK;
            });

            test('It should set the player currentTime to the correct relative position', () => {
                const seekEvent = { relativePosition: 0.1 };
                const expected = PLAYER_DURATION * seekEvent.relativePosition;

                baseMedia.onRequestSeek(seekEvent);

                expect(baseMedia.player).toEqual({
                    currentTime: expected,
                    duration: PLAYER_DURATION,
                });
            });

            test('It should modify the player currentTime with the correct positive timeOffset', () => {
                const seekEvent = { timeOffset: 25 };
                const expected = PLAYER_TIME + seekEvent.timeOffset;

                baseMedia.onRequestSeek(seekEvent);

                expect(baseMedia.player).toEqual({
                    currentTime: expected,
                    duration: PLAYER_DURATION,
                });
            });

            test('It should modify the player currentTime with the correct negative timeOffset', () => {
                const seekEvent = { timeOffset: -25 };
                const expected = PLAYER_TIME + seekEvent.timeOffset;

                baseMedia.onRequestSeek(seekEvent);

                expect(baseMedia.player).toEqual({
                    currentTime: expected,
                    duration: PLAYER_DURATION,
                });
            });

            test('It should set the player currentTime to the targetTime', () => {
                const expected = 42;
                const seekEvent = { targetTime: expected };

                baseMedia.onRequestSeek(seekEvent);

                expect(baseMedia.player).toEqual({
                    currentTime: expected,
                    duration: PLAYER_DURATION,
                });
            });

            test('It should not modify the player currentTime on invalid input', () => {
                // Not sure if this is a good way to go, as you don't see which
                // values are failing tests.
                const invalidTimeValues = ['string', true, false, [], {}, () => {}];

                // Invalid relativePositions.
                invalidTimeValues.forEach((value) => {
                    const seekEvent = { relativePosition: value };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });

                // Invalid timeOffsets.
                invalidTimeValues.forEach((value) => {
                    const seekEvent = { timeOffset: value };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });

                // Invalid targetTimes.
                invalidTimeValues.forEach((value) => {
                    const seekEvent = { targetTime: value };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });
            });

            describe('Block seek forward', () => {
                beforeEach(() => {
                    baseMedia.blockSeekForward = true;
                });

                test('It should not seek beyond the current time with relativePosition', () => {
                    const seekEvent = { relativePosition: 1 };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should not seek beyond the currentTime with timeOffset', () => {
                    const seekEvent = { timeOffset: 20 };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should not seek beyond the currentTime with targetTime', () => {
                    const seekEvent = { targetTime: PLAYER_TIME + 10 };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: PLAYER_TIME,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should seek prior to the currentTime with relativePosition', () => {
                    const seekEvent = { relativePosition: 0.1 };
                    const expected = seekEvent.relativePosition * PLAYER_DURATION;

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: expected,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should seek prior to the currentTime with timeOffset', () => {
                    const seekEvent = { timeOffset: -10 };
                    const expected = PLAYER_TIME + seekEvent.timeOffset;

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: expected,
                        duration: PLAYER_DURATION,
                    });
                });

                test('It should seek prior to the currentTime with targetTime', () => {
                    const expected = 10;
                    const seekEvent = { targetTime: expected };

                    baseMedia.onRequestSeek(seekEvent);

                    expect(baseMedia.player).toEqual({
                        currentTime: expected,
                        duration: PLAYER_DURATION,
                    });
                });
            });
        });
    });
});

