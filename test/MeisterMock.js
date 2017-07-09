function constructorMock(config, meister) {
    this.config = config;
    this.meister = meister;
}

export const MeisterMock = {
    // Plugin types that need to be extended.
    AnalyticsPlugin: constructorMock,
    MiddleWare: constructorMock,
    MediaPlugin: constructorMock,
    ParserPlugin: constructorMock,
    PlayerPlugin: constructorMock,
    ProtoPlugin: constructorMock,
    Ui: constructorMock,
    UiPlugin: constructorMock,

    // Other Meister objects that are used.
    ErrorCodes: {},

    // Plugin registering functions that are called in all plugins.
    registerPlugin: () => {},
    registerMiddleWare: () => {},
};

global.Meister = MeisterMock;
