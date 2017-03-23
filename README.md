BaseMedia plugin for meister
===========

This plugin allows basic media types to be played. They are directly put in the video element.

Getting started
-----------

Load the plugin by adding a `BaseMedia` configuration object to the Meister initialisation options. As of yet there are no configuration options for BaseMedia so an empty object is enough.

Example:

``` JavaScript
var meisterPlayer = new Meister('#player', {
    BaseMedia: {}
});

meisterPlayer.setItem({
    src: 'INSERT_URL_TO_MP4_HERE',
    type: 'mp4',
});

meisterPlayer.load();

```

Supported types
---------

Currently the following types are supported:

- *mp4* - For MP4 playback.
- *mp3* - For MP3 playback.
- *icecast* - For Icecast streams.
- *m3u8* - **NOTE**: Only for Samsung android devices that do not support the MediaSource API. For a HLS plugin please visit [HLS plugin for Meister](https://github.com/meisterplayer/media-hls)
