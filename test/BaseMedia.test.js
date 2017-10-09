import '@meisterplayer/meister-mock';
import BaseMedia from '../src/js/BaseMedia';

const PLUGIN_NAME = 'BaseMedia';
const TEST_TYPES_DEFAULT = [
    { type: 'mp4', supported: true },
    { type: 'mp3', supported: true },
    { type: 'icecast', supported: true },
    { type: 'mov', supported: true },
    { type: 'm3u', supported: false },
    { type: 'm3u8', supported: false },
    { type: 'random', supported: false },
];

const TEST_TYPES_SAMSUNG = TEST_TYPES_DEFAULT.map(({ type, supported }) => {
    let newSupported = supported;
    if (type === 'm3u' || type === 'm3u8') {
        newSupported = true;
    }

    return { type, supported: newSupported };
});

describe('BaseMedia class', () => {
    test(`pluginName should be ${PLUGIN_NAME}`, () => {
        expect(BaseMedia.pluginName).toBe(PLUGIN_NAME);
    });

    test('pluginVersion should return a version string', () => {
        // Version should match the SemVer pattern (e.g. 2.11.9)
        expect(BaseMedia.pluginVersion).toMatch(/\d+\.\d+\.\d+/);
    });
});

describe('BaseMedia', () => {
    // Mocks and stubs
    let getPlayerByTypeMock;
    let triggerMock;
    let oneMock;
    let browserMock;
    let meisterInstanceMock;
    let baseMediaConfigMock;

    let PLAYER_MOCK;
    let ITEM_MOCK;

    const SRC_STUB = 'https://src.org/src';
    const TYPE_STUB = 'mp4';

    // Instance to test on
    let baseMedia;

    beforeEach(() => {
        getPlayerByTypeMock = jest.fn();
        triggerMock = jest.fn();
        oneMock = jest.fn();
        browserMock = {};

        meisterInstanceMock = {
            browser: browserMock,
            getPlayerByType: getPlayerByTypeMock,
            trigger: triggerMock,
        };

        baseMediaConfigMock = {};

        PLAYER_MOCK = {};
        ITEM_MOCK = { type: TYPE_STUB, src: SRC_STUB };

        global.Meister.MediaPlugin.prototype.one = oneMock;

        baseMedia = new BaseMedia(baseMediaConfigMock, meisterInstanceMock);
    });

    describe('isItemSupported', () => {
        TEST_TYPES_DEFAULT.forEach((typeObject) => {
            test('It should resolve items with the appropriate result for most browsers', async () => {
                const ITEM_STUB = { src: SRC_STUB, type: typeObject.type };

                const result = baseMedia.isItemSupported(ITEM_STUB);
                await expect(result).resolves.toEqual({
                    supported: typeObject.supported,
                });
            });
        });

        TEST_TYPES_SAMSUNG.forEach((typeObject) => {
            test('It should resolve items with the appropriate result for Samsung browsers', async () => {
                browserMock = { isSamsung: true };
                meisterInstanceMock = { browser: browserMock };
                baseMedia = new BaseMedia(baseMediaConfigMock, meisterInstanceMock);

                const ITEM_STUB = { src: SRC_STUB, type: typeObject.type };

                const result = baseMedia.isItemSupported(ITEM_STUB);
                await expect(result).resolves.toEqual({
                    supported: typeObject.supported,
                });
            });
        });
    });

    describe('process', () => {
        test('It should call meisterInstance.getPlayerByType with "html5" and the item', async () => {
            // We need to catch the reject, hence the additional expect
            await expect(baseMedia.process(ITEM_MOCK)).rejects.toBeDefined();

            expect(getPlayerByTypeMock.mock.calls.length).toBe(1);
            expect(getPlayerByTypeMock).toBeCalledWith('html5', ITEM_MOCK);
        });

        describe('Player available', () => {
            beforeEach(() => {
                getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
            });

            test('It should resolve with the item and it should save the item', async () => {
                const result = baseMedia.process(ITEM_MOCK);

                await expect(result).resolves.toBe(ITEM_MOCK);
                expect(baseMedia.currentItem).toBe(ITEM_MOCK);
            });

            test('It should trigger a ui splash event with item metadata', async () => {
                const ITEM_METADATA_STUB = {};
                ITEM_MOCK.metadata = ITEM_METADATA_STUB;

                // We don't care about the result in this case
                await baseMedia.process(ITEM_MOCK);

                expect(triggerMock.mock.calls.length).toBe(1);
                expect(triggerMock).toBeCalledWith('uiEvent', {
                    type: 'splash',
                    info: ITEM_METADATA_STUB,
                });
            });
        });

        describe('No player available', () => {
            test('It should reject with a string including the source when unable to find a player and it should not save the item', async () => {
                const result = baseMedia.process(ITEM_MOCK);

                await expect(result).rejects.toMatch(SRC_STUB);
                expect(baseMedia.currentItem).toBeUndefined();
            });
        });
    });

    describe('load', () => {
        let superLoadMock;

        beforeEach(async () => {
            superLoadMock = jest.fn();
            global.Meister.MediaPlugin.prototype.load = superLoadMock;
            getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);

            await baseMedia.process(ITEM_MOCK);

            // Reset trigger due to uiEvent trigger in process.
            meisterInstanceMock.trigger.mockReset();
        });

        afterEach(() => {
            delete global.Meister.MediaPlugin.prototype.load;
        });

        test('It should call the super method with the item', () => {
            baseMedia.load(ITEM_MOCK);

            expect(superLoadMock.mock.calls.length).toBe(1);
            expect(superLoadMock).toBeCalledWith(ITEM_MOCK);
        });

        test('It should set the player.currentSrc to item.src', () => {
            baseMedia.load(ITEM_MOCK);

            expect(PLAYER_MOCK.currentSrc).toBe(SRC_STUB);
        });

        test('It should trigger "itemBitrates" for m3u and m3u8 with a dummy bitrates object', () => {
            const types = ['m3u', 'm3u8'];

            types.forEach((type) => {
                baseMedia.load({ type, src: SRC_STUB });

                expect(triggerMock).toBeCalledWith('itemBitrates', {
                    bitrates: [{ metadata: { bitrate: 0 } }],
                    currentIndex: 0,
                });
            });
        });

        test('It should register a one time callback "playerLoadedMetadata"', () => {
            baseMedia.load(ITEM_MOCK);

            expect(oneMock.mock.calls.length).toBe(1);
            expect(oneMock).toBeCalledWith('playerLoadedMetadata', expect.any(Function));
        });
    });

    describe('On playerLoadedMetadata', () => {
        let superLoadMock;

        beforeEach(async () => {
            superLoadMock = jest.fn();
            global.Meister.MediaPlugin.prototype.load = superLoadMock;
        });

        afterEach(() => {
            delete global.Meister.MediaPlugin.prototype.load;
        });

        const testCases = [
            { duration: 0, isLive: true },
            { duration: Infinity, isLive: true },
        ];

        // Fuzzed testing
        for (let i = 1; i <= 10; i += 1) {
            const duration = Math.random() * i * i;
            testCases.push({ duration, isLive: false });
        }

        testCases.forEach((testCase) => {
            test('It should trigger "itemTimeInfo" with the duration and whether it is live', async () => {
                PLAYER_MOCK = { duration: testCase.duration };
                getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);

                // Modify mock to trigger callback right away.
                oneMock.mockImplementation((name, cb) => cb());
                await baseMedia.process(ITEM_MOCK);

                // Reset trigger due to uiEvent trigger in process.
                meisterInstanceMock.trigger.mockReset();

                baseMedia.load(ITEM_MOCK);
                expect(triggerMock).toBeCalledWith('itemTimeInfo', {
                    duration: testCase.duration,
                    isLive: testCase.isLive,
                });

                // Reset mock implementation.
                oneMock.mockReset();
            });
        });
    });

    describe('player getters/setters', () => {
        const DURATION_STUB = 100;

        beforeEach(() => {
            PLAYER_MOCK = { duration: DURATION_STUB };
            getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
        });

        describe('duration', () => {
            test('It should return NaN when no player is available', () => {
                expect(baseMedia.duration).toBeNaN();
            });

            test('It should return player.duration when a player is available', async () => {
                await baseMedia.process(ITEM_MOCK);

                expect(baseMedia.duration).toBe(DURATION_STUB);
            });
        });

        describe('currentTime', () => {
            test('It should do nothing when no player is available', () => {
                expect(() => {
                    baseMedia.currentTime = 300;
                }).not.toThrow();
                expect(baseMedia.currentTime).toBeNaN();
            });

            test('It should proxy player currentTime when a player is available', async () => {
                const expected = 300;

                getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
                await baseMedia.process(ITEM_MOCK);

                baseMedia.currentTime = expected;
                expect(baseMedia.currentTime).toBe(expected);
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
        });

        test('It should release references to the active player and item', async () => {
            getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
            await baseMedia.process(ITEM_MOCK);

            baseMedia.unload();

            expect(baseMedia.currentItem).not.toBe(expect.anything());
            expect(baseMedia.duration).toBeNaN();
        });
    });

    describe('event proxies', () => {
        const CURRENT_TIME_STUB = 50;
        const DURATION_STUB = 100;

        beforeEach(async () => {
            PLAYER_MOCK = {
                currentTime: CURRENT_TIME_STUB,
                duration: DURATION_STUB,
            };

            getPlayerByTypeMock.mockReturnValue(PLAYER_MOCK);
            await baseMedia.process(ITEM_MOCK);

            // Reset trigger due to uiEvent trigger in process.
            meisterInstanceMock.trigger.mockReset();
        });

        describe('_onPlayerTimeUpdate', () => {
            test('It should trigger "playerTimeUpdate" with the current player time and duration', () => {
                baseMedia._onPlayerTimeUpdate();

                expect(triggerMock.mock.calls.length).toBe(1);
                expect(triggerMock).toBeCalledWith('playerTimeUpdate', {
                    currentTime: CURRENT_TIME_STUB,
                    duration: DURATION_STUB,
                });
            });
        });

        describe('_onPlayerSeek', () => {
            test('It should trigger "playerSeek" with the current player time, duration, and relative position', () => {
                baseMedia._onPlayerSeek();

                expect(triggerMock.mock.calls.length).toBe(1);
                expect(triggerMock).toBeCalledWith('playerSeek', {
                    relativePosition: CURRENT_TIME_STUB / DURATION_STUB,
                    currentTime: CURRENT_TIME_STUB,
                    duration: DURATION_STUB,
                });
            });
        });

        describe('onRequestSeek', () => {
            /**
             * Test whether a seek leads to the expected result. Also resets
             * the player mock after the seek operation.
             * @param {Object} testCase Object describing the seek operation
             * and the desired result.
             */
            function testSeek(testCase) {
                baseMedia.onRequestSeek(testCase.seekEvent);

                expect(baseMedia.currentTime).toBe(testCase.result.currentTime);
                expect(baseMedia.duration).toBe(testCase.result.duration);

                // Reset player mock values.
                PLAYER_MOCK.duration = DURATION_STUB;
                PLAYER_MOCK.currentTime = CURRENT_TIME_STUB;
            }

            describe('targetTime event', () => {
                test('It should correctly modify the player time', () => {
                    const testCases = [];
                    for (let i = 0; i <= 10; i += 1) {
                        const newTime = Math.random() * i;

                        testCases.push({
                            seekEvent: { targetTime: newTime },
                            result: {
                                currentTime: newTime,
                                duration: DURATION_STUB,
                            },
                        });
                    }

                    testCases.forEach(testSeek);
                });
            });

            describe('timeOffset event', () => {
                test('It should correctly modify the player time', () => {
                    const testCases = [];
                    for (let i = 0; i <= 10; i += 1) {
                        const direction = (i % 2 === 0) ? 1 : -1;
                        const newTimeOffset = Math.random() * i * direction;

                        testCases.push({
                            seekEvent: { timeOffset: newTimeOffset },
                            result: {
                                currentTime: CURRENT_TIME_STUB + newTimeOffset,
                                duration: DURATION_STUB,
                            },
                        });
                    }

                    testCases.forEach(testSeek);
                });
            });

            describe('relativePosition event', () => {
                test('It should correctly modify the player time', () => {
                    const testCases = [];
                    for (let i = 0; i <= 10; i += 1) {
                        const newRelativePosition = Math.random();

                        testCases.push({
                            seekEvent: { relativePosition: newRelativePosition },
                            result: {
                                currentTime: DURATION_STUB * newRelativePosition,
                                duration: DURATION_STUB,
                            },
                        });
                    }

                    testCases.forEach(testSeek);
                });
            });

            describe('Incorrect seek values', () => {
                test('It should not modify the player time', () => {
                    const invalidTimeValues = ['string', true, false, [], {}, () => {}];
                    const seekOperations = ['targetTime', 'timeOffset', 'relativePosition'];

                    const testCases = [];
                    seekOperations.forEach((operation) => {
                        invalidTimeValues.forEach((value) => {
                            testCases.push({
                                seekEvent: { [operation]: value },
                                result: {
                                    currentTime: CURRENT_TIME_STUB,
                                    duration: DURATION_STUB,
                                },
                            });
                        });
                    });

                    testCases.forEach(testSeek);
                });
            });
        });
    });
});
