# HeatSync
A series of scripts that are intended to give the quickest setup for running your own Heat widgets on stream as possible while giving people the power to make things however they want.

The primary goal is to enable quick syncing between clicks and elements in OBS and enable callbacks in various programs to make use of the results.

That is to say, if you label a source in OBS as clickable properly, this should run the action you specify anytime a click on stream overlaps said source. It also gives the relative coodinates within that source, so you can do things like run an Autohotkey-L script to click in the program that's in the source, or you can send the relative position over websocket to the webpage in the source to run a simulated click so the viewers can interact with webpages by proxy.

It's broken up into a few options, and you're going to need to set up one of each.

The OBS side is setup to connect to a local OBS webserver. There are two versions currently, Streamer.Bot and javascript. The one in Streamer.Bot uses the built in authentication if you have it set up, and only needs OBS raw access to get what it needs. The Javascript one assumes the OBS is on localhost with port 4455 and can authenticate via v5. Pulls are welcome to incorporate more options.

The Heat side needs to receive the click mapping from the OBS side, and once it has that, it can trigger actions either within the program that called it or externally via websocket. There are two versions available here as well, Streamer.Bot and javascript. It doesn't matter what you choose for either side, Javascript can send runaction commands via Streamer.Bot's websockets, and Streamer.Bot can send details to Javascript to run similarly.

And the triggered actions can be whatever you want. I have a Autohotkey-L script set up as an example. There's also a javascript stub available that clicks in page for you.

Finally, an all-in-one copy pasteable snippet is available for Javascript that connects to OBS and Heat and clicks in whatever HTML page it's run in. This one is the one I use on my streams to connect Heat to [The Minesweeper game in 100 lines of JavaScript](https://slicker.me/javascript/mine/minesweeper.htm) (the code provided on that page specifically, not the page itself). And a patch for [the markers overlay from the original heat](https://heat.j38.net/markers/) to get it to work with GreenHeat directly is also provided to show what you can set up more directly. Once you have it downloaded you can run it directly in OBS.

NOTE: The only caveat to agnostic uses is, all javascript websocket connections are set up client only, so one javascript page cannot talk to another unless you set up an intermediary or your own websocket server.

# Sections

1. [OBS Sync Layer](#obs-sync-layer)
2. [Heat Sync Layer](#heat-sync-layer)
3. [Example Actions](#example-actions)
4. [Complete examples](#complete-examples)

# OBS Sync Layer

## Contents

1. [Streamer.Bot](#streamerbot-obs-setup)
2. [Javascript](#javascript-obs-setup)
3. [OBS Sync API and Details](#obs-sync-api-and-details)

## Streamer.Bot OBS setup

[File lives here.](./streamer.bot/obs.cs)

### Quick setup

Make sure to have OBS studio connected. If you're not sure how to, [click here](https://docs.streamer.bot/guide/stream-apps/obs-studio) to be taken to the official guide.

If you're using websocket connected actions, you will have to open the websocket server. There's a configuration guide [here](https://docs.streamer.bot/api/websocket/guide/configuration) if you need more information. Otherwise you can skip this step if you're just using Streamer.Bot actions, to include launching Autohotkey-L scripts or the like, as will be detailed in the [Examples Actions](#example-actions) section.

Once you have that setup, you should just need to drag [streamer.bot/obs.sbi](./streamer.bot/obs.sbi) into your Streamer.Bot instance or to import this string into Streamer.Bot:

<details>
<summary>Click here to expand import string</summary>

```
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
```
</details>

<br/>

The script, when run, will collect all sources with names starting with `click!`. The next part of the name, up to `?` will be used to select an action, and everything after the `?` will be parsed as argument with `arg=value` format, `&` delineated, like in a URL. It should automatically run if a you switch scenes or OBS connects.

More details on this is available below, or you can skip to the [Heat Sync layer](#Heat-Sync-Layer)

#### Refer to API and details

The details are in [the OBS Sync API details section](#obs-sync-api-and-details) as the input and output are the same accross implementation.

## Javascript OBS setup

### Quick setup

Javascript is a bit more manual than the other methods for now. The best way to set this up is in combination with the other two parts. An example with everything together [lives here](#complete-all-in-one-javascript-stub).

The whole script [lives here](./js/obs.js). You can also expand the below collapsed section and just copy the code that's there into your HTML page.
<details>
<summary>Click here to expand HTML tagged script</summary>

```
<script>
// Set this to your OBS WebSocket password, or to null.
const OBS_PASSWORD = null;
// Set this to your OBS WebSocket URL, or to null to use the default.
const OBS_URL = null;

function openWebSocket(url, handler) {
    let ws;
    ws = new WebSocket(url);
    ws.onopen = () => console.log("WebSocket opened to " + url);
    ws.onclose = () => console.log("WebSocket to " + url + " closed");
    ws.onerror = (e) => {
        console.error(url + " WebSocket error", e);
        setTimeout(() => openWebSocket(url, handler), RECONNECT_MS);
    };
    ws.onmessage = handler;
    return ws;
}

async function sha256base64(toHash) {
    let bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(toHash)));
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#creating-an-authentication-string
// Steps:
// 1) base64_secret = base64( SHA256( password + salt ) )
// 2) authentication = base64( SHA256( base64_secret + challenge ) )
async function computeObsV5Auth(password, challenge, salt) {
    const secretHash = await sha256base64(password + salt);
    return await sha256base64(secretHash + challenge);
}

class OBS extends EventTarget {
    constructor(password = OBS_PASSWORD) {
        super();
        this.password = (password === null || password === undefined) ? OBS_PASSWORD : password;
        this.connect();
    }

    connect() {
        let url = OBS_URL || "ws://localhost:4455";
        console.log(`Connecting to OBS WebSocket at ${url}.`);

        // Handler for obs-websocket v5 protocol messages
        this.ws = openWebSocket(url, async (message) => {
            let msg;
            try {
                msg = JSON.parse(message.data);
            } catch (e) {
                console.error('Invalid JSON from OBS websocket', e);
                return;
            }

            // v5 messages use { op: number, d: object }
            if (typeof msg.op === 'number' && msg.d) {
                switch (msg.op) {
                    case 0: // Hello
                        if (msg.d.authentication && this.password) {
                            try {
                                const auth = await computeObsV5Auth(this.password, msg.d.authentication.challenge, msg.d.authentication.salt);
                                const identify = { op: 1, d: { rpcVersion: 1, authentication: auth } };
                                this.ws.send(JSON.stringify(identify));
                            } catch (e) {
                                console.error('Failed to compute v5 auth', e);
                                this.ws.close();
                            }
                        } else {
                            // No auth required or no password set
                            const identify = { op: 1, d: { rpcVersion: 1 } };
                            this.ws.send(JSON.stringify(identify));
                        }
                        break;
                    case 7: // RequestResponse
                        try {
                            const rid = msg.d.requestId;
                            if (this.pendingRequests && this.pendingRequests.has(rid)) {
                                const entry = this.pendingRequests.get(rid);
                                const payload = msg.d.responseData || msg.d;
                                entry.resolve(payload);
                                this.pendingRequests.delete(rid);
                            }
                        } catch (e) {
                            console.error('Error handling response', e);
                        }
                        break;
                    case 2: // Identified
                        console.log('OBS websocket identified, negotiated rpcVersion=', msg.d.negotiatedRpcVersion);
                        try { this.dispatchEvent(new CustomEvent('Identified', { detail: msg.d })); } catch (e) { /* ignore */ }
                        break;
                    case 5: // Event
                        try {
                            const evType = msg.d.eventType;
                            const evData = msg.d.eventData || {};
                            const event = new CustomEvent(evType, { detail: evData });
                            this.dispatchEvent(event);
                        } catch (e) {
                            console.error('Error dispatching event', e);
                        }
                        break;
                    default:
                        // ignore other opcodes for now
                        break;
                }
                return;
            }

            // Fallback: try v4-style messages (legacy)
            try {
                // TODO
                throw new Error('Legacy v4 message handling not implemented yet');
            } catch (e) {
                console.error('Unhandled OBS websocket message', e);
            }
        });
    }

    async sendRequest(requestType, requestData = {}) {
        if (!this.ws || this.ws.readyState !== 1) throw new Error('WebSocket not connected');
        this.requestIdCounter = this.requestIdCounter || 1;
        this.pendingRequests = this.pendingRequests || new Map();
        const id = `req_${this.requestIdCounter++}`;
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            const payload = { op: 6, d: { requestType, requestId: id, requestData } };
            try {
                this.ws.send(JSON.stringify(payload));
            } catch (e) {
                this.pendingRequests.delete(id);
                return reject(e);
            }
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('OBS request timeout: ' + requestType));
                }
            }, 5000);
        });
    }

    async clickMap() {
        // If we're not identified wait.
        if (!this._identified) {
            await new Promise((resolve) => {
                const onIdentified = () => {
                    this.removeEventListener('Identified', onIdentified);
                    resolve();
                };
                this.addEventListener('Identified', onIdentified);
            });
        }

        const now = Date.now();
        this._clickMapCache = this._clickMapCache || { value: null, ts: 0, ttl: 3000 };
        // if computation already in progress, await it
        try {
            await this._clickMapPromise;
        } catch (error) {
        }
        // else check the cache
        if (this._clickMapCache.value && (now - this._clickMapCache.ts) < this._clickMapCache.ttl) {
            return this._clickMapCache.value;
        }

        this._clickMapPromise = (async () => {
            try {
                const result = await this._computeClickMap();
                this._clickMapCache.value = result;
                this._clickMapCache.ts = Date.now();
                return result;
            } finally {
                delete this._clickMapPromise;
            }
        })();

        return await this._clickMapPromise;
    }

    async _computeClickMap() {
        let SceneWidthDefault = 1920;
        let SceneHeightDefault = 1080;
        const MaxRecursion = 3;
        const sourceTransforms = {};

        function toFloat(v) {
            if (v === undefined || v === null) return 0;
            const n = parseFloat(String(v).replace(',', '.'));
            return Number.isFinite(n) ? n : 0;
        }

        function getRects(transform, currentTransform, SceneWidth, SceneHeight) {
            const output = {};
            const boundsType = transform.boundsType || 'OBS_BOUNDS_NONE';
            const align = parseInt(transform.alignment || 0, 10);
            const posX = toFloat(transform.positionX);
            const posY = toFloat(transform.positionY);
            const wid = toFloat(transform.width);
            const hei = toFloat(transform.height);
            const boW = toFloat(transform.boundsWidth);
            const boH = toFloat(transform.boundsHeight);
            const crL = toFloat(transform.cropLeft);
            const crT = toFloat(transform.cropTop);
            const crB = toFloat(transform.cropBottom);
            const crR = toFloat(transform.cropRight);
            const soH = toFloat(transform.sourceHeight);
            const soW = toFloat(transform.sourceWidth);
            let boA = parseInt(transform.boundsAlignment || 0, 10) || 0;
            let scW = toFloat(transform.scaleX || 1);
            let scH = toFloat(transform.scaleY || 1);

            let widthAdj;
            if (align % 2 === 1) widthAdj = 0; // Left
            else if (align % 4 === 0) widthAdj = 0.5; // Center
            else widthAdj = 1; // Right

            let heightAdj;
            if (align < 4) heightAdj = 0.5; // Center
            else if (align < 8) heightAdj = 0; // Top
            else heightAdj = 1; // Bottom

            const croppedWid = Math.max(soW - crL - crR, 1);
            const croppedHei = Math.max(soH - crT - crB, 1);

            switch (boundsType) {
                case 'OBS_BOUNDS_NONE': {
                    const adjW = croppedWid * scW;
                    const adjH = croppedHei * scH;
                    output.x1 = (posX - widthAdj * adjW) / SceneWidth;
                    output.x2 = output.x1 + adjW / SceneWidth;
                    output.y1 = (posY - heightAdj * adjH) / SceneHeight;
                    output.y2 = output.y1 + adjH / SceneHeight;
                    output.x3 = output.x1 - (crL * scW / SceneWidth);
                    output.y3 = output.y1 - (crT * scH / SceneHeight);
                    output.x4 = SceneWidth / (adjW + (crL + crR) * scW);
                    output.y4 = SceneHeight / (adjH + (crT + crB) * scH);
                }
                    break;
                case 'OBS_BOUNDS_STRETCH': {
                    scW = boW / croppedWid;
                    scH = boH / croppedHei;
                    output.x1 = (posX - widthAdj * boW) / SceneWidth;
                    output.x2 = output.x1 + boW / SceneWidth;
                    output.y1 = (posY - heightAdj * boH) / SceneHeight;
                    output.y2 = output.y1 + boH / SceneHeight;
                    output.x3 = output.x1 - (crL * scW / SceneWidth);
                    output.y3 = output.y1 - (crT * scH / SceneHeight);
                    output.x4 = SceneWidth / (boW + (crL + crR) * scW);
                    output.y4 = SceneHeight / (boH + (crT + crB) * scH);
                }
                    break;
                case 'OBS_BOUNDS_SCALE_INNER':
                    scW = Math.min(boW / croppedWid, boH / croppedHei);
                    scH = scW;
                    // fallthrough
                case 'OBS_BOUNDS_SCALE_OUTER':
                    if (boundsType === 'OBS_BOUNDS_SCALE_OUTER') {
                        scW = Math.max(boW / croppedWid, boH / croppedHei);
                        scH = scW;
                    }
                    // fallthrough
                case 'OBS_BOUNDS_SCALE_TO_WIDTH':
                    if (boundsType === 'OBS_BOUNDS_SCALE_TO_WIDTH') {
                        scW = boW / croppedWid;
                        scH = scW;
                    }
                    // fallthrough
                case 'OBS_BOUNDS_SCALE_TO_HEIGHT':
                    if (boundsType === 'OBS_BOUNDS_SCALE_TO_HEIGHT') {
                        scW = boH / croppedHei;
                        scH = scW;
                    }
                    // fallthrough
                case 'OBS_BOUNDS_MAX_ONLY':
                    if (boundsType === 'OBS_BOUNDS_MAX_ONLY') {
                        scW = Math.max(Math.max(1.0, boW / croppedWid), boH / croppedHei);
                        scH = scW;
                    }
                    if (['OBS_BOUNDS_SCALE_INNER','OBS_BOUNDS_SCALE_OUTER','OBS_BOUNDS_SCALE_TO_WIDTH','OBS_BOUNDS_SCALE_TO_HEIGHT','OBS_BOUNDS_MAX_ONLY'].includes(boundsType)) {
                        const newW = croppedWid * scW;
                        const newH = croppedHei * scH;
                        const trW = boW - newW;
                        const trH = boH - newH;
                        let nHeiAdj;
                        if (boA < 4) nHeiAdj = 0.5;
                        else if (boA < 8) nHeiAdj = 0;
                        else nHeiAdj = 1;
                        let nWidAdj;
                        if (boA % 2 === 1) nWidAdj = 0;
                        else if (boA % 4 === 0) nWidAdj = 0.5;
                        else nWidAdj = 1;
                        output.x1 = (posX - widthAdj * boW - nWidAdj * trW) / SceneWidth;
                        output.x2 = output.x1 + newW / SceneWidth;
                        output.y1 = (posY - heightAdj * boH - nHeiAdj * trH) / SceneHeight;
                        output.y2 = output.y1 + newH / SceneHeight;
                        output.x3 = output.x1 - (crL * scW / SceneWidth);
                        output.y3 = output.y1 - (crT * scH / SceneHeight);
                        output.x4 = SceneWidth / (newW + (crL + crR) * scW);
                        output.y4 = SceneHeight / (newH + (crT + crB) * scH);
                    }
                    break;
                default:
                    throw new Error('Unsupported boundsType: ' + boundsType);
            }

            // Now scale by parent scene
            const currentWidthScale = 1 / currentTransform.x4;
            const currentHeightScale = 1 / currentTransform.y4;
            // Left most visible pixel in ratio position.
            output.x1 = output.x1 * currentWidthScale + currentTransform.x3;
            // If the parent crop doesn't include a pixel, this source won't either.
            output.x1 = Math.max(output.x1, currentTransform.x1);
            // Right most visible pixel in ratio position.
            output.x2 = output.x2 * currentWidthScale + currentTransform.x3;
            // Same parent crop check from before.
            output.x2 = Math.min(output.x2, currentTransform.x2);
            // Top most visible pixel in ratio position.
            output.y1 = output.y1 * currentHeightScale + currentTransform.y3;
            // Crop check.
            output.y1 = Math.max(output.y1, currentTransform.y1);
            // Bottom most visible pixel in ratio position.
            output.y2 = output.y2 * currentHeightScale + currentTransform.y3;
            // Crop check.
            output.y2 = Math.min(output.y2, currentTransform.y2);
            // Left most pixel including cropped area in ratio position.
            output.x3 = output.x3 * currentWidthScale + currentTransform.x3;
            // Top most pixel including cropped area in ratio position.
            output.y3 = output.y3 * currentHeightScale + currentTransform.y3;
            // The ratio of the original canvas over the full width including cropped area.
            output.x4 = output.x4 * currentTransform.x4;
            // The ratio of the original canvas over the full height including cropped area.
            output.y4 = output.y4 * currentTransform.y4;

            // Legacy values
            output.x = Math.floor(output.x1 * SceneWidth);
            output.y = Math.floor(output.y1 * SceneHeight);
            output.w = Math.floor((output.x2 - output.x1) * SceneWidth);
            output.h = Math.floor((output.y2 - output.y1) * SceneHeight);
            output.crx = Math.floor((output.x3 - output.x1) * SceneWidth);
            output.cry = Math.floor((output.y3 - output.y1) * SceneHeight);
            output.crw = Math.floor(SceneWidth / output.x4) - output.w - output.crx;
            output.crh = Math.floor(SceneHeight / output.y4) - output.h - output.cry;

            return output;
        }

        this._videoSettingsCache = this._videoSettingsCache || null;
        if (!this._videoSettingsCache)
        {
            try {
                const vs = await this.sendRequest('GetVideoSettings', {});
                this._videoSettingsCache = vs;
            } catch (e) {
                console.warn('GetVideoSettings failed, falling back to defaults', e);
                this._videoSettingsCache = { baseWidth: SceneWidthDefault, baseHeight: SceneHeightDefault };
            }
        }

        const SceneWidth = this._videoSettingsCache.baseWidth;
        const SceneHeight = this._videoSettingsCache.baseHeight;

        async function recurseOverScenes(self, currentScene, currentTransform, sourceTransformsObj, recurse) {
            if (recurse <= 0) return;
            let resp;
            try {
                resp = await self.sendRequest('GetSceneItemList', { sceneName: currentScene });
            } catch (e) {
                console.error('GetSceneItemList failed for', currentScene, e);
                return;
            }
            const sources = resp.sceneItems || resp.sceneItems || [];
            for (let i = sources.length - 1; i >= 0; i--) {
                const source = sources[i];
                const sceneItemEnabled = !!source.sceneItemEnabled;
                if (!sceneItemEnabled) continue;
                const isGroup = !!source.isGroup;
                if (isGroup) continue;
                const sourceType = source.sourceType || '';
                const sourceName = source.sourceName || '';
                if (sourceType === 'OBS_SOURCE_TYPE_SCENE' && recurse > 0) {
                    const nestedTransform = getRects(source.sceneItemTransform || {}, currentTransform, SceneWidth, SceneHeight);
                    await recurseOverScenes(self, sourceName, nestedTransform, sourceTransformsObj, recurse - 1);
                }
                if (sourceName && sourceName.toLowerCase().startsWith('click!') && !sourceTransformsObj[sourceName]) {
                    const rects = getRects(source.sceneItemTransform || {}, currentTransform, SceneWidth, SceneHeight);
                    if (rects.x1 > 1 || rects.x2 < 0 || rects.y1 > 1 || rects.y2 < 0 || rects.x1 > rects.x2 || rects.y1 > rects.y2) {
                        console.warn(`Source ${sourceName} has zero clickable pixels on screen.`);
                        continue;
                    }
                    sourceTransformsObj[sourceName] = rects;
                }
            }
        }

        const initialTransform = { x1: 0, y1: 0, x2: 1, y2: 1, x3: 0, y3: 0, x4: 1, y4: 1 };
        let sceneName = null;
        try {
            const resp = await this.sendRequest('GetCurrentProgramScene', {});
            if (resp && (resp.currentProgramSceneName || resp.currentScene)) { sceneName = resp.currentProgramSceneName || resp.currentScene; }
            else if (resp && resp.name) { sceneName = resp.name; }
        } catch (e) {
            // ignore and try next
        }
        if (!sceneName) sceneName = 'Scene';

        await recurseOverScenes(this, sceneName, initialTransform, sourceTransforms, MaxRecursion);
        return sourceTransforms;
    }
}

</script>
```
</details>

<br/>

I recommend copying the script into your page if you're running the page as just a browser source in OBS pointed at a local file. If you run a local webserver, or otherwise host it, you can import it with `<script src="/js/obs.js"></script>` or pointed to wherever you're hosting the file from. If you're running it as a file, browsers will not allow importing javascript from a file directly, but javascript that's in the page will work.

**After you have the code in the page you want it to run in**, one way or another, you will have to specify the OBS websocket password, if you are using one (recommended). You can get your current password by navigating the drop down menus, `Tools -> WebSocket Server Settings`, then clicking on `Show Connect Info`. The websocket information will all be there, though if you're running locally, you can ignore the Server IP and just use `localhost`. When you instantiate the OBS instance in your page, pass it in as a parameter, or provide the password as an argument to the webpage when it is run.

To pass an argument to a page run off disk instead of served, when you setup the Browser Source in OBS, uncheck Local File, and enter the full file path as the URL, then add a question mark to indicate the start of arguments, and specify each argument in `arg=value` format delineated by ampersands (`&`). The password argument will be just that for simplicity, `password=[...]`. For example: `C:/path/to/your/files/Minesweeper.html?x=6&y=20&m=20&password=s0m3str1ng`

The script, when run, will collect all sources with names starting with `click!`. The next part of the name, up to `?` will be used to select an action, and everything after the `?` will be parsed as argument with `arg=value` format, `&` delineated, like in a URL. By itself, it doesn't do anything or connect to anything else because pages can't have websocket servers within them. An example to send the json object to a websocket server, such as the one in Streamer.Bot will be available in [example actions below](#javascript-calling-streamerbot-actions).

To use the values in your own scripts, instantiate the OBS object with your OBS websocket password, and call `OBS.clickMap()` to receive the click map.

More details are below in in [the OBS Sync API details section](#obs-sync-api-and-details) as the input and output are the same across implementation.

## OBS Sync API and Details

### Collected input messages from OBS Raw

Used OBS Raw calls include:
- GetVideoSettings
  - Pulls out:
    - baseHeight: The height of the canvas resolution
    - baseWidth: The width of the canvas resolution
  - These are used to scale the source sizes to ratios for easier processing described above
- GetSceneItemList
  - Pulls out:
    - sceneItems
      - sceneItemEnabled: Skip on false
      - isGroup: Skip on true
      - sourceType: Recurse on OBS_SOURCE_TYPE_SCENE
      - sourceName: Add to ClickMap if it starts with "click!"
      - sceneItemTransform:
        - boundsType: One of `{"OBS_BOUNDS_NONE", "OBS_BOUNDS_STRETCH", "OBS_BOUNDS_SCALE_INNER", "OBS_BOUNDS_SCALE_OUTER", "OBS_BOUNDS_SCALE_TO_WIDTH", "OBS_BOUNDS_SCALE_TO_HEIGHT", "OBS_BOUNDS_MAX_ONLY"}`. These are somewhat intuitive in the transform edittor in OBS, but mathematically they are a little less intuitive. Check the source code for how I deal with them.
        - alignment: The anchor point from the source to the scene.
          This is complex
          |        | left | center | right |
          |--------|------|--------|-------|
          | top    | 5    | 4      | 6     |
          | center | 1    | 0      | 2     |
          | bottom | 9    | 8      | 10    |
        - positionX: of the anchor of source bounds in parent scene
        - positionY: same
        - width: All the rest of these values change bepending on the boundsType because OBS can't make this easy.
        - height
        - boundsWidth
        - boundsHeight
        - cropLeft
        - cropTop
        - cropBottom
        - cropRight
        - sourceHeight
        - sourceWidth
        - boundsAlignment: Similar to the alignment, with the same value to position mapping, but it aligns the source within the bounds, in boundsType's where the two are not forced to be the same size (which is all of them except OBS_BOUNDS_NONE and OBS_BOUNDS_STRETCH from testing).
        - scaleX
        - scaleY

### Output

The following click map structure is broadcast over websocket if setup as the JSON payload: `{type: "cachemap", map:[ClickMap]}`, saved as a temperary global in Streamer.Bot as ClickMap, with an already pulled arg available if this action is called from other actions, if Streamer.Bot is used. For Javascript, it is stored in a cache as the output to `obs.clickMap()` where it will be refetched periodically (at most every three seconds) to prevent spaming the OBS webserver. (The cache is declared stale every three seconds because the javascript isn't subscribed to OBS's scene changes to invalidate the cache automatically.)

The ClickMap structure is a object mapping each source name to a set of values:
```
{
  [sourceName (string)]: {
    "x1": [first visible pixel from left to right from the source on screen (float)],
    "y1": [first visible pixel from top to bottom on screen (float)],
    "x2": [last visible pixel from left to right on screen (float)],
    "y2": [last visible pixel from top to bottom on screen (float)],
    "x3": [the first pixel hidden by cropping on the left side of the source (float)],
    "y3": [the first pixel hidden by cropping on the top of the source (float)],
    "x4": [the ratio of the scale of the source over the scale of the source in the scene in the x direction (float)],
    "y4": [the ratio of the scale of the source over the scale of the source in the scene in the y direction (float)],
  },
  [...]
}
```
These entries are designed for speed, as the 1s and 2s are bounds on screen to check for clicks (i.e. `x1 < xclick < x2`), and the x3 and x4 can be used to scale the result (i.e. `(xclick - x3) * x4`). This minimizes the processing per received message, and per successful passthrough, so the bottleneck should be outside of this code, hopefully...

# Heat Sync Layer

## Contents

1. [Streamer.Bot](#streamerbot-heat-setup)
2. [Javascript](#javascript-heat-setup)
3. [Heat Sync API and Details](#heat-sync-api-and-details)

## Streamer.Bot Heat Setup

[File lives here.](./streamer.bot/heat.cs)

### Quick setup

First and foremost, setup the [GreenHeat](https://dashboard.twitch.tv/extensions/yvswtbzy4fj9h89rk06e0wuw2ghfwv-0.2.0) overlay on your Twitch stream. You should just need to install it to your channel on that page, then activate it as Overlay 1 in your channel's dashboard. More details [on the official GreenHeat website](https://heat.prod.kr/tutorial). Alternatively, setup [Heat](https://dashboard.twitch.tv/extensions/cr20njfkgll4okyrhag7xxph270sqk-2.1.1), although it may be less supported and less full featured. More details [on the official Heat website](https://heat.j38.net/about/).

Once you have that setup, you should just need to import this string into Streamer.Bot:

<details>
<summary>Click here to expand import string</summary>

```
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
```
</details>

<br/>

More details on this is available below, or you can skip to the [example actions](#example-actions) to see examples of what you can do with these.

#### Refer to API and details

The details are in [the OBS Sync API details section](#heat-sync-api-and-details) as the input and output are the same accross implementation.

## Javascript Heat Setup

### Quick setup

Javascript is a bit more manual than the other methods for now. The best way to set this up is in combination with the other two parts. An example with everything together [lives here](#complete-all-in-one-javascript-stub).

The whole script [lives here](./js/heat.js). You can also expand the below collapsed section and just copy the code that's there into your HTML page.
<details>
<summary>Click here to expand HTML tagged script</summary>

```
<script>
function openWebSocket(url, handler) {
    let ws;
    ws = new WebSocket(url);
    ws.onopen = () => console.log("WebSocket opened to " + url);
    ws.onclose = () => console.log("WebSocket to " + url + " closed");
    ws.onerror = (e) => {
        console.error(url + " WebSocket error", e);
        setTimeout(() => openWebSocket(url, handler), RECONNECT_MS);
    };
    ws.onmessage = handler;
    return ws;
}

class Heat extends EventTarget {
    channelId;
    users;

    constructor(channelId, obsSync) {
        super();

        if (!channelId) {
            this.log("Invalid channel ID.");
            return;
        }

        // The only real requirement of this is that awaiting this.obsSync.clickMap() returns the array of clickable areas.
        this.obsSync = obsSync;

        this.channelId = channelId
        this.connect();

        this.users = new Map();
        this.actions = new Map();
    }

    connect() {
        let url = "wss://heat.prod.kr/" + this.channelId;
        this.log(`Connecting to ${url}.`);
        let ws = openWebsocket(url, (message) => {
            let data = JSON.parse(message.data);
            let event = new CustomEvent(data.type, { detail: data });
            // this.log("Event: " + JSON.stringify(event));
            // this.log("Event detail: " + JSON.stringify(event.detail));
            this.dispatchEvent(event);

            if (data.type == "system") {
                this.log(data.type + " message: " + JSON.stringify(data));
            }

            this.addEventListener('click', async(e) => {
                let clickData = e.detail.data;
                const clickMap = await this.obsSync.clickMap();
                clickMap.forEach((name, bounds) => {
                    if (clickData.x < bounds.x1 || clickData.x > bounds.x2 ||
                        clickData.y < bounds.y1 || clickData.y > bounds.y2) {
                        return;
                    }
                    let clickX = (clickData.x - bounds.x3) * bounds.x4;
                    let clickY = (clickData.y - bounds.y3) * bounds.y4;
                    let tempName = actionName.replace("click!", "");
                    var calledAction = tempName.split("?")[0];
                    var args_ = tempName.split("?")[1];
                    if (this.actions.has(calledAction)) {
                        let sendClick = JSON.parse(JSON.stringify(clickData));
                        sendClick.x = clickX;
                        sendClick.y = clickY;
                        sendClick.target = calledAction;
                        sendClick.args = args_;
                        for (let arg of args_.split("&")) {
                            let [key, value] = arg.split("=");
                            sendClick[key] = value;
                        }
                        this.actions.get(calledAction)(sendClick);
                    }
                });
            });
        });
    }

    registerClickHandler(actionName, handler) {
        this.actions.set(actionName, handler);
    }

    async getUserById(id) {
        // Check user map first.
        if (this.users.has(id)) return this.users.get(id);

        // Ignore invalid names.
        if (id.startsWith("A")) return { display_name: "Anonymous" };
        if (id.startsWith("U")) return { display_name: "Unverified" };

        // Query Twitch for user details.
        const url = `https://prod.kr/api/twitchprofilefromid?id=${id}`;

        // Handle response.
        let response = await fetch(url);
        if (response.ok) {
            let data = await response.json();
            this.users.set(id, data);
            this.log("User for id " + id + " found: " + data.display_name);
            return data;
        } else {
            return { display_name: "Unknown" };
        }
    }

    log(message) {
        let prefix = "%c::HEAT::%c"
        console.log(prefix + " " + message, "color: white; background:orange;", "color:initial;background:initial;");
    }
}

</script>
```
</details>

<br/>

I recommend copying the script into your page if you're running the page as just a browser source in OBS pointed at a local file. If you run a local webserver, or otherwise host it, you can import it with `<script src="/js/heat.js"></script>` or pointed to wherever you're hosting the file from. If you're running it as a file, browsers will not allow importing javascript from a file directly, but javascript that's in the page will work.

**After you have the code in the page you want it to run in**, one way or another, you will have to specify your twitch channel. For GreenHeat, you can just use your channel name. For Heat, you'll have to get your channel id, which Heat will give you if you go into your extensions on Twitch and open the extension configuration (the gear on the bottom right).

To pass an argument to a page run off disk instead of served, when you setup the Browser Source in OBS, uncheck Local File, and enter the full file path as the URL, then add a question mark to indicate the start of arguments, and specify each argument in `arg=value` format delineated by ampersands (`&`). The channel specifier argument will be `channel=[...]`. For example: `C:/path/to/your/files/Markers.html?channel=mycoolchannel`

## Heat Sync API and Details

### Inputs

Part of the input is the click map from the OBS Sync layer detailed in [the OBS Sync API details section](#obs-sync-api-and-details).

[GreenHeat messages come in the form](https://heat.prod.kr/tutorial#websocket-schema):
```
  - id: the twitch id (or an opaque id if permission was not given) of the person.
  - type: the type of the message. could be "click", "drag", "hover" or "release".
  - x and y: the position normalized from 0 to 1. it is made this way to be compatible with legacy heat's schema.
  - button: the mouse button that was used, defaults to "left" for mobile and unknown, but also can be "middle" or "right".
  - shift, ctrl and alt: boolean, whether these modifier buttons are used while clicking.
  - time: the timestamp in milliseconds when the message was formed.
  - latency: the stream latency between source and viewer. ONLY ACCOUNTS ONE WAY! you might have to figure out your delay to twitch and add it to the total latency.
```
The time value is an int in milliseconds and the latency value is a float in seconds... I believe this was for legacy compatibility reasons with Heat.

### Output

Parsed clicks will be passed into the action on successful click messages in the same form as GreenHeat's schema, with x and y adjusted to be the normalized position within the uncropped source that was selected along with the arguments in the source name (after the ? if put in) so the same action can control multiple things if the user wants, the target action to run. More formally:
```
{
  - id: the twitch id (or an opaque id if permission was not given) of the person.
  - type: the type of the message. could be "click", "drag", "hover" or "release".
  - x: the position normalized from 0 to 1. I continue to use the legacy heat's schema because it makes it end source scaling agnostic.
  - y: the same but vertical.
  - button: the mouse button that was used, defaults to "left" for mobile and unknown, but also can be "middle" or "right".
  - shift, ctrl and alt: boolean, whether these modifier buttons are used while clicking.
  - time: the timestamp in milliseconds when the message was formed.
  - latency: the stream latency between source and viewer. ONLY ACCOUNTS ONE WAY! you might have to figure out your delay to twitch and add it to the total latency.
  - target: The name of the action, in the source name after "`!`" and before, optionally, "`?`".
  - args: The string after "`?`" in the source name, if provided. Otherwise a blank string.
}
```
If you need the full name of the source, it's simply `f"click!{target}" + f"?{args}" if args else ""` (in python, but similar for other languages) so I'm not putting in redundant info here. There is one case where this isn't true, and that's if the user ended the sourcename with a "?" for some reason and didn't use args.

The `args` will also be parsed before this and values in the structure will be overriden if specified. So you can do cheeky little hacks like having a screenwide source with nothing in it that has the args `x=0.15&y=0.4` when targetting Cookie Clicker with the [autohotkey script in the examples](#autohotkey-l-clicks) to have every click on screen click on the cookie (I think those x and y values work no matter the size of the program, in the Steam version of the game).

# Example Actions

[Files live here.](./actions/)

## Contents

1. [Autohotkey-L clicks](#Autohotkey-l-clicks)
2. [Javascript clicks](#Javascript-clicks)
3. [Javascript calling Streamer.Bot actions](#Javascript-calling-streamerbot-actions)
4. [Streamer.Bot calling Javascript actions](#streamerbot-calling-javascript-actions)

## Autohotkey-L Clicks

I set this up to have a dedicated folder for scripts so the actions can be a little more portable, but that means you do have to set a persisted global variable, `ScriptFolder` that points to the top level where you install these scripts.

Within the script folder, copy the `click.exe` from [actions/autohotkey](./actions/autohotkey/), or `click.ahk` and use Autohotkey to compile it (or you'll have to edit the streamer.bot action to call the script through Autohotkey).

Then you should be able to click and drag the `click.sbi` from [actions/autohotkey](./actions/autohotkey/) into streamer.bot to install.

Alternatively, and equivalently, you can copy the following string into the import dialog in Streamer.Bot:

<details>
<summary>Click to expand</summary>

```
U0JBRR+LCAAAAAAABADdWFlv3DYQfi/Q/yAs4LdyoYO6+makOQr0IaiNoEVtBDxGu4S1okpR9i4M57dnqMN7ae0gaWCkelgt+Q3JmflmOCLvf/7J82YrsGz2q3fvGtis2AqwOTtvrV5qewMb7/WareoSZr8MIqy1S22c0Hutbi5qZZR9BG/BNEpXDg3m/tx/BCQ0wqjaDuDlUjXeziK1vgMD0hOlEjce9Et6TDh5T7DK4+C1DQqwxmMeZw0OL7TxhK4qQKlq4b01ANU7YNazup/H9UplEC83nqo8VtfYzdycjWeXRreLpedGXGwqMd81UP/ZVudiULZqy3LEVqpSq3b14dFMBzrsoZOYSbbnzt6ABnv+6Xu8EepgJZ0vKI05yDgnPhQ5oTyISAaZT7gUaVFQnkZxPCrXDfu3hbZjyR8eMvEzPnsjoWK8BLeqNS3sIWtRthLeGL16pxqrzQaFClY2p6TeQyXRwVNSYxBdoMiW41eOkj1tFshA3UXbI3d7OCvv2KZBKqYWMaySevVI0hGOkSFaY6CyU6g1arFAEneZOWCnj2dmlHNZsyV1B7WbujNUHJo24OuOpHkQT2CbHqMTEG+t7dOkhMJOCHTrXTKzAGfcjC1vPsIavFda3yh8ORTMHLtm+0MfDqYaAjCjIhFZEJCYBwwDMExJJhglechinos8j6P8UIvR9tQPD5GTQdajLoSaMSuud9GHbeN6l6ym5efHieSeQ7pUVbedS856F6GOZ0eau/y+7LU/jItnlptYshshWAMY7I2y6ham7e7kblnZwuSsHSwNW8yOkeupqfrwP2HChBmTkwz0pzJLCwYkzVhMaJKnyDxuQnEUcx7KJKIwEcA4/A7UYuncjRv9FD6ESJ7nfjSF18yl5++dEixPU+BxQpJMUEIzXJ+HtCA+S4rMj4tMxsmkEk9GW29lJcFlon+IHabDdyV3qbE2vgC7MY1p5gt0ZxELTG6J/1gkiR9RHsVhkkQ5/z+wG7wou30F+E7sTq04YUuviF6tcHrn9E8X3RfXG11KMJ+urjodu6owsWQ3GCtKu0LS3Kqzq3ET7erM2dXMw5718N4M7+02u9P+68IyY3d7/j7q+QOqhV0OPbq2H4sFNk5qdqeN+5z7TZljy04Ogur2A+tq/P1xMIwTM4XzmNdr1YX6KbGxUPpZmGSUCAh8QkOOhRKKgEDAacDTHKLgqFBuV3o6nzqZIaeSU/huTgVSRkkkGGYS7tgUJCMsgIQAixOXb2nCxBOueSaveqtP7ZzuefjCaFffpO2Ptg2FL7oNGSgBZ3qBMpOkYYZfkSkJM5caMkixzASUhD4PgYU0yLPJfedH4zf6On7/Q0/zIogD349JkGb4uSbxJ0+zkOSM8kTSpACafaun6TOe3jkS74l8uR/pkR/3Ow4dMBj/NQw/ZfhodBCmh8jT5j5zypncDk6db4QuS1Y3IN+6A/H+uWgYM8r3Z/+9EBlL/n7nHfBG4zHQXoC5HQ66xyAeFYdyvwWtWo3yrme42Nhe7IR9GuJBrtbGgnSXAeN9z3CaPb4m6W+DCCvrJZsHuD89fAbbbxqLfxIAAA==
```
</details>

<br/>

Currently, it's set up to send a click on mouse down events. If you'd rather have it send during mouse up events, drag the subaction `Run a Program (~ScriptFolder~\click.exe)` from the case `click` to the case `release`.

There is actually some logic in the AHK script to click and drag if the from location is specified, but I never finished it to satisfaction, so it's left to the user to finish it (or provide a pull request). I plan to eventually finish it, but I may switch to AutoIt instead since that also supports Linux.

## Javascript clicks

This is a quick stub that can be used as the target action in a javascript page. The code lives at [actions/js/click.js](./actions/js/click.js), or you can copy it from below. You should update the url for your websocket, and the websocket_message_id for the sessionId you want this script to pay attention to.

<details>
<summary>Click to show code for copying and pasting into an HTML page...</summary>

```
<script>
const url = (window.WS_CLICK_SERVER_URL || 'ws://127.0.0.1:8080');
let ws;
let websocket_message_id;
try {
    const w = params.get("w");
    websocket_message_id = w ? w : 'javascript_clicks';
} catch (e) {
    websocket_message_id = 'javascript_clicks';
}
const RECONNECT_MS = 1000;

function toViewportCoordinates(x, y, coordMode) {
    if (coordMode === 'page') return { cx: x - window.scrollX, cy: y - window.scrollY };
    if (coordMode === 'normalized') return { cx: Math.round(x * window.innerWidth), cy: Math.round(y * window.innerHeight) };
    return { cx: x, cy: y };
}

function simulateClickAt(x, y, button = 0) {
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return;
    const el = document.elementFromPoint(x, y);
    if (!el) return;

    const props = { view: window, bubbles: true, cancelable: true, clientX: x, clientY: y, button: button };
    ['mousedown', 'mouseup', 'click'].forEach((type) => {
        const evt = new MouseEvent(type, props);
        el.dispatchEvent(evt);
    });
}

function handleMessageData(event) {
    try {
        const msg = (typeof event.data === 'string') ? JSON.parse(event.data) : event.data;
        console.debug("Received WebSocket message:", msg);
        console.debug("Received WebSocket session ID:", msg.data?.sessionId);
        console.debug("Expected WebSocket session ID:", websocket_message_id);
        if (msg.data?.sessionId !== websocket_message_id) return;
        // console.log('Received click data:', msg);
        // console.debug("Window size:", window.innerWidth, "x", window.innerHeight);
        const msgData = msg.data;
        if (typeof msgData.x !== 'number' || typeof msgData.y !== 'number') return;
        const coord = msgData.coord || 'normalized';
        const { cx, cy } = toViewportCoordinates(msgData.x, msgData.y, coord);
        console.debug("Click coordinates (viewport):", cx, cy);
        if (msgData.button === 'right') {
            simulateClickAt(cx, cy, 2);
        } else {
            simulateClickAt(cx, cy);
        }
    } catch (err) {
        // ignore parse errors
    }
}

function connect() {
    ws = new WebSocket(url);
    ws.onopen = onConnected;
    ws.onmessage = handleMessageData;
    ws.addEventListener('close', () => setTimeout(connect, RECONNECT_MS));
    ws.addEventListener('error', () => ws.close());
}

function onConnected() {
    console.log('ws-click-client connected');
    console.log('Subscribing to click events');
    ws.send(JSON.stringify({ "request": 'Subscribe', "events": { "general": ['Custom'] }, "id": websocket_message_id }));
}

connect();
</script>
```
</details>

<br/>

The code as is only supports right and left clicks, and the clicked elements must be accessible via the [Document: elementFromPoint function](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementFromPoint), which may not support all use cases. Clicks have to be sent from a websocket server to this stub or as events manually, which can be done with Streamer.Bot. The manually sending click events is doable if you want the page itself to have the Heat Sync layer in it.

On line 22, there's an iteration through `mousedown`, `mouseup`, and `click` MouseEvents because some elements key in on different MouseEvents, but I didn't see many, if any, that key into multiple at the same time. This is covering the basics and can be altered to fit your needs, of course.

## Javascript calling Streamer.Bot actions

This is a pretty simple one, all it's doing is packaging up the click action from the output of the Heat Sync layer it received and sending it to Streamer.Bot's websocket. You'll have to have the websocket server on on Streamer.Bot and an action for it to call. This uses [Streamer.Bot's DoAction](https://docs.streamer.bot/api/websocket/requests#doaction) request to call an arbitrarily named action within Streamer.Bot.

<details>
<summary>Click to show code for copying and pasting into an HTML page...</summary>

```
<script>
const url = (window.WS_CLICK_SERVER_URL || 'ws://127.0.0.1:8080');
let ws;
let websocket_message_id;
try {
    const w = params.get("w");
    websocket_message_id = w ? w : 'test';
} catch (e) {
    websocket_message_id = 'test';
}
const RECONNECT_MS = 1000;

function streamerBotAction(actionName, actionData) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }
    ws.send(JSON.stringify({ "request": "DoAction", "action": { "name": actionName }, "args": actionData, "id": websocket_message_id }));
}

function connect() {
    ws = new WebSocket(url);
    ws.onopen = () => console.log('ws-click-client connected');
    ws.addEventListener('close', () => setTimeout(connect, RECONNECT_MS));
    ws.addEventListener('error', () => ws.close());
}

connect();
</script>
```
</details>

<br/>

Whatever javascript callback you use, make sure it calls streamerBotAction with a string matching the Action name in Streamer.Bot for the actionName and an object mapping strings to either strings or numbers for the actionData.

## Streamer.Bot calling Javascript actions

This is a pretty simple one, all it's doing is packaging up the click action from the output of the Heat Sync layer it received and broadcasting it from Streamer.Bot's websocket. You'll have to have the websocket server on on Streamer.Bot and the receipient will need logic for receiving it.

To set this up, just import [actions/streamerbotCallingJS/sendToWS.sbi](./actions/streamerbotCallingJS/sendToWS.sbi) or import the below string into Streamer.Bot's Import dialog:

<details>
<summary>Click to expand Streamer.Bot export code...</summary>

```
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
```
</details>

<br/>

As is, this can be called via a source in OBS with the name `click!SendWebsocketClick?[...]` and you can setup any args you want. It should pass them through in the standard way for the Heat Sync API.

# Complete Examples
[Files live here.](./examples/)

## Contents

1. [Complete All-In-One Javascript stub](#complete-all-in-one-javascript-stub)
2. [Markers diff](#markers-diff)

## Complete All-In-One Javascript stub

The aio.js script [here](./examples/aio/aio.js) provides a full pipeline from GreenHeat to Streamer.Bot action and is ready for you to modify it to your needs. All you have to do is embed the script in a HTML page and run it in an OBS browser source and it should take care of everything for you. Details on getting it to register click commands are in the [OBS Sync section above](#javascript-obs-setup). You can also expand the below collapsed section and just copy the code that's there into your HTML page. Be sure to set the relevant settings at the top of the script.
<details>
<summary>Click here to expand HTML tagged script</summary>

```
<script>
// Set this to your OBS WebSocket password, or to null.
const OBS_PASSWORD = null;
// Set this to your OBS WebSocket URL, or to null to use the default.
const OBS_URL = null;
// Set this to your Streamer.Bot WebSocket URL, or to null to use the default.
const STREAMERBOT_URL = null;
// Set this to your twitch channel ID.
const CHANNEL_ID = null;
// These are less important than the above.
const WEBSOCKET_MESSAGE_ID = "heat";
const RECONNECT_MS = 1000;

function openWebSocket(url, handler) {
    let ws;
    ws = new WebSocket(url);
    ws.onopen = () => console.log("WebSocket opened to " + url);
    ws.onclose = () => console.log("WebSocket to " + url + " closed");
    ws.onerror = (e) => {
        console.error(url + " WebSocket error", e);
        setTimeout(() => openWebSocket(url, handler), RECONNECT_MS);
    };
    ws.onmessage = handler;
    return ws;
}

// This is the default action if a click matches a click! source.
function streamerBotAction(actionName, actionData) {
    if (!sbWs || sbWs.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not open');
        return;
    }
    sbWs.send(JSON.stringify({ "request": "DoAction", "action": { "name": actionName }, "args": actionData, "id": WEBSOCKET_MESSAGE_ID }));
}
sbWs = openWebSocket(STREAMERBOT_URL || 'ws://127.0.0.1:8080', (message) => { })

class Heat extends EventTarget {
    channelId;
    users;

    constructor(channelId, obsSync) {
        super();

        if (!channelId) {
            this.log("Invalid channel ID.");
            return;
        }

        // The only real requirement of this is that awaiting this.obsSync.clickMap() returns the array of clickable areas.
        this.obsSync = obsSync;

        this.channelId = channelId
        this.connect();

        this.users = new Map();
        this.actions = new Map();
    }

    connect() {
        let url = "wss://heat.prod.kr/" + this.channelId;
        this.log(`Connecting to ${url}.`);
        let ws = openWebSocket(url, (message) => {
            let data = JSON.parse(message.data);
            let event = new CustomEvent(data.type, { detail: data });
            // this.log("Event: " + JSON.stringify(event));
            // this.log("Event detail: " + JSON.stringify(event.detail));
            this.dispatchEvent(event);

            if (data.type == "system") {
                this.log(data.type + " message: " + JSON.stringify(data));
            }

            this.addEventListener('click', async (e) => {
                let clickData = e.detail;
                const clickMap = Object.entries(await this.obsSync.clickMap());
                clickMap.forEach(([name, bounds]) => {
                    if (clickData.x < bounds.x1 || clickData.x > bounds.x2 ||
                        clickData.y < bounds.y1 || clickData.y > bounds.y2) {
                        return;
                    }
                    let clickX = (clickData.x - bounds.x3) * bounds.x4;
                    let clickY = (clickData.y - bounds.y3) * bounds.y4;
                    let tempName = name.replace("click!", "");
                    var calledAction = tempName.split("?")[0];
                    var args_ = tempName.split("?")[1] || "";
                    let sendClick = JSON.parse(JSON.stringify(clickData));
                    sendClick.x = clickX;
                    sendClick.y = clickY;
                    sendClick.target = calledAction;
                    sendClick.args = args_;
                    for (let arg of args_.split("&")) {
                        let [key, value] = arg.split("=");
                        sendClick[key] = value;
                    }
                    if (this.actions.has(calledAction)) {
                        this.actions.get(calledAction)(sendClick);
                    } else {
                        // Send it to Streamer.Bot
                        streamerBotAction(calledAction, sendClick);
                    }
                });
            });
        });
    }

    registerClickHandler(actionName, handler) {
        this.actions.set(actionName, handler);
    }

    async getUserById(id) {
        // Check user map first.
        if (this.users.has(id)) return this.users.get(id);

        // Ignore invalid names.
        if (id.startsWith("A")) return { display_name: "Anonymous" };
        if (id.startsWith("U")) return { display_name: "Unverified" };

        // Query Twitch for user details.
        const url = `https://prod.kr/api/twitchprofilefromid?id=${id}`;

        // Handle response.
        let response = await fetch(url);
        if (response.ok) {
            let data = await response.json();
            this.users.set(id, data);
            this.log("User for id " + id + " found: " + data.display_name);
            return data;
        } else {
            return { display_name: "Unknown" };
        }
    }

    log(message) {
        let prefix = "%c::HEAT::%c"
        console.log(prefix + " " + message, "color: white; background:orange;", "color:initial;background:initial;");
    }
}

async function sha256base64(toHash) {
    let bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(toHash)));
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

// https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#creating-an-authentication-string
// Steps:
// 1) base64_secret = base64( SHA256( password + salt ) )
// 2) authentication = base64( SHA256( base64_secret + challenge ) )
async function computeObsV5Auth(password, challenge, salt) {
    const secretHash = await sha256base64(password + salt);
    return await sha256base64(secretHash + challenge);
}

class OBS extends EventTarget {
    constructor(password = OBS_PASSWORD) {
        super();
        this.password = (password === null || password === undefined) ? OBS_PASSWORD : password;
        this.connect();
    }

    connect() {
        let url = OBS_URL || "ws://localhost:4455";
        console.log(`Connecting to OBS WebSocket at ${url}.`);

        // Handler for obs-websocket v5 protocol messages
        this.ws = openWebSocket(url, async (message) => {
            let msg;
            try {
                msg = JSON.parse(message.data);
            } catch (e) {
                console.error('Invalid JSON from OBS websocket', e);
                return;
            }

            // v5 messages use { op: number, d: object }
            if (typeof msg.op === 'number' && msg.d) {
                switch (msg.op) {
                    case 0: // Hello
                        if (msg.d.authentication && this.password) {
                            try {
                                const auth = await computeObsV5Auth(this.password, msg.d.authentication.challenge, msg.d.authentication.salt);
                                const identify = { op: 1, d: { rpcVersion: 1, authentication: auth } };
                                this.ws.send(JSON.stringify(identify));
                            } catch (e) {
                                console.error('Failed to compute v5 auth', e);
                                this.ws.close();
                            }
                        } else {
                            // No auth required or no password set
                            const identify = { op: 1, d: { rpcVersion: 1 } };
                            this.ws.send(JSON.stringify(identify));
                        }
                        break;
                    case 7: // RequestResponse
                        try {
                            const rid = msg.d.requestId;
                            if (this.pendingRequests && this.pendingRequests.has(rid)) {
                                const entry = this.pendingRequests.get(rid);
                                const payload = msg.d.responseData || msg.d;
                                entry.resolve(payload);
                                this.pendingRequests.delete(rid);
                            }
                        } catch (e) {
                            console.error('Error handling response', e);
                        }
                        break;
                    case 2: // Identified
                        console.log('OBS websocket identified, negotiated rpcVersion=', msg.d.negotiatedRpcVersion);
                        try {
                            this.dispatchEvent(new CustomEvent('Identified', { detail: msg.d }));
                            this._identified = true;
                        } catch (e) { /* ignore */ }
                        break;
                    case 5: // Event
                        try {
                            const evType = msg.d.eventType;
                            const evData = msg.d.eventData || {};
                            const event = new CustomEvent(evType, { detail: evData });
                            this.dispatchEvent(event);
                        } catch (e) {
                            console.error('Error dispatching event', e);
                        }
                        break;
                    default:
                        // ignore other opcodes for now
                        break;
                }
                return;
            }

            // Fallback: try v4-style messages (legacy)
            try {
                // TODO
                throw new Error('Legacy v4 message handling not implemented yet');
            } catch (e) {
                console.error('Unhandled OBS websocket message', e);
            }
        });
    }

    async sendRequest(requestType, requestData = {}) {
        if (!this.ws || this.ws.readyState !== 1) throw new Error('WebSocket not connected');
        this.requestIdCounter = this.requestIdCounter || 1;
        this.pendingRequests = this.pendingRequests || new Map();
        const id = `req_${this.requestIdCounter++}`;
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            const payload = { op: 6, d: { requestType, requestId: id, requestData } };
            try {
                this.ws.send(JSON.stringify(payload));
            } catch (e) {
                this.pendingRequests.delete(id);
                return reject(e);
            }
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('OBS request timeout: ' + requestType));
                }
            }, 5000);
        });
    }

    async clickMap() {
        // If we're not identified wait.
        if (!this._identified) {
            await new Promise((resolve) => {
                const onIdentified = () => {
                    this.removeEventListener('Identified', onIdentified);
                    resolve();
                };
                this.addEventListener('Identified', onIdentified);
            });
        }

        const now = Date.now();
        this._clickMapCache = this._clickMapCache || { value: null, ts: 0, ttl: 3000 };
        // if computation already in progress, await it
        try {
            await this._clickMapPromise;
        } catch (error) {
        }
        // else check the cache
        if (this._clickMapCache.value && (now - this._clickMapCache.ts) < this._clickMapCache.ttl) {
            return this._clickMapCache.value;
        }

        this._clickMapPromise = (async () => {
            try {
                const result = await this._computeClickMap();
                this._clickMapCache.value = result;
                this._clickMapCache.ts = Date.now();
                return result;
            } finally {
                delete this._clickMapPromise;
            }
        })();

        return await this._clickMapPromise;
    }

    async _computeClickMap() {
        let SceneWidthDefault = 1920;
        let SceneHeightDefault = 1080;
        const MaxRecursion = 3;
        const sourceTransforms = {};

        function toFloat(v) {
            if (v === undefined || v === null) return 0;
            const n = parseFloat(String(v).replace(',', '.'));
            return Number.isFinite(n) ? n : 0;
        }

        function getRects(transform, currentTransform, SceneWidth, SceneHeight) {
            const output = {};
            const boundsType = transform.boundsType || 'OBS_BOUNDS_NONE';
            const align = parseInt(transform.alignment || 0, 10);
            const posX = toFloat(transform.positionX);
            const posY = toFloat(transform.positionY);
            const wid = toFloat(transform.width);
            const hei = toFloat(transform.height);
            const boW = toFloat(transform.boundsWidth);
            const boH = toFloat(transform.boundsHeight);
            const crL = toFloat(transform.cropLeft);
            const crT = toFloat(transform.cropTop);
            const crB = toFloat(transform.cropBottom);
            const crR = toFloat(transform.cropRight);
            const soH = toFloat(transform.sourceHeight);
            const soW = toFloat(transform.sourceWidth);
            let boA = parseInt(transform.boundsAlignment || 0, 10) || 0;
            let scW = toFloat(transform.scaleX || 1);
            let scH = toFloat(transform.scaleY || 1);

            let widthAdj;
            if (align % 2 === 1) widthAdj = 0; // Left
            else if (align % 4 === 0) widthAdj = 0.5; // Center
            else widthAdj = 1; // Right

            let heightAdj;
            if (align < 4) heightAdj = 0.5; // Center
            else if (align < 8) heightAdj = 0; // Top
            else heightAdj = 1; // Bottom

            const croppedWid = Math.max(soW - crL - crR, 1);
            const croppedHei = Math.max(soH - crT - crB, 1);

            switch (boundsType) {
                case 'OBS_BOUNDS_NONE': {
                    const adjW = croppedWid * scW;
                    const adjH = croppedHei * scH;
                    output.x1 = (posX - widthAdj * adjW) / SceneWidth;
                    output.x2 = output.x1 + adjW / SceneWidth;
                    output.y1 = (posY - heightAdj * adjH) / SceneHeight;
                    output.y2 = output.y1 + adjH / SceneHeight;
                    output.x3 = output.x1 - (crL * scW / SceneWidth);
                    output.y3 = output.y1 - (crT * scH / SceneHeight);
                    output.x4 = SceneWidth / (adjW + (crL + crR) * scW);
                    output.y4 = SceneHeight / (adjH + (crT + crB) * scH);
                }
                    break;
                case 'OBS_BOUNDS_STRETCH': {
                    scW = boW / croppedWid;
                    scH = boH / croppedHei;
                    output.x1 = (posX - widthAdj * boW) / SceneWidth;
                    output.x2 = output.x1 + boW / SceneWidth;
                    output.y1 = (posY - heightAdj * boH) / SceneHeight;
                    output.y2 = output.y1 + boH / SceneHeight;
                    output.x3 = output.x1 - (crL * scW / SceneWidth);
                    output.y3 = output.y1 - (crT * scH / SceneHeight);
                    output.x4 = SceneWidth / (boW + (crL + crR) * scW);
                    output.y4 = SceneHeight / (boH + (crT + crB) * scH);
                }
                    break;
                case 'OBS_BOUNDS_SCALE_INNER':
                    scW = Math.min(boW / croppedWid, boH / croppedHei);
                    scH = scW;
                // fallthrough
                case 'OBS_BOUNDS_SCALE_OUTER':
                    if (boundsType === 'OBS_BOUNDS_SCALE_OUTER') {
                        scW = Math.max(boW / croppedWid, boH / croppedHei);
                        scH = scW;
                    }
                // fallthrough
                case 'OBS_BOUNDS_SCALE_TO_WIDTH':
                    if (boundsType === 'OBS_BOUNDS_SCALE_TO_WIDTH') {
                        scW = boW / croppedWid;
                        scH = scW;
                    }
                // fallthrough
                case 'OBS_BOUNDS_SCALE_TO_HEIGHT':
                    if (boundsType === 'OBS_BOUNDS_SCALE_TO_HEIGHT') {
                        scW = boH / croppedHei;
                        scH = scW;
                    }
                // fallthrough
                case 'OBS_BOUNDS_MAX_ONLY':
                    if (boundsType === 'OBS_BOUNDS_MAX_ONLY') {
                        scW = Math.max(Math.max(1.0, boW / croppedWid), boH / croppedHei);
                        scH = scW;
                    }
                    if (['OBS_BOUNDS_SCALE_INNER', 'OBS_BOUNDS_SCALE_OUTER', 'OBS_BOUNDS_SCALE_TO_WIDTH', 'OBS_BOUNDS_SCALE_TO_HEIGHT', 'OBS_BOUNDS_MAX_ONLY'].includes(boundsType)) {
                        const newW = croppedWid * scW;
                        const newH = croppedHei * scH;
                        const trW = boW - newW;
                        const trH = boH - newH;
                        let nHeiAdj;
                        if (boA < 4) nHeiAdj = 0.5;
                        else if (boA < 8) nHeiAdj = 0;
                        else nHeiAdj = 1;
                        let nWidAdj;
                        if (boA % 2 === 1) nWidAdj = 0;
                        else if (boA % 4 === 0) nWidAdj = 0.5;
                        else nWidAdj = 1;
                        output.x1 = (posX - widthAdj * boW - nWidAdj * trW) / SceneWidth;
                        output.x2 = output.x1 + newW / SceneWidth;
                        output.y1 = (posY - heightAdj * boH - nHeiAdj * trH) / SceneHeight;
                        output.y2 = output.y1 + newH / SceneHeight;
                        output.x3 = output.x1 - (crL * scW / SceneWidth);
                        output.y3 = output.y1 - (crT * scH / SceneHeight);
                        output.x4 = SceneWidth / (newW + (crL + crR) * scW);
                        output.y4 = SceneHeight / (newH + (crT + crB) * scH);
                    }
                    break;
                default:
                    throw new Error('Unsupported boundsType: ' + boundsType);
            }

            // Now scale by parent scene
            const currentWidthScale = 1 / currentTransform.x4;
            const currentHeightScale = 1 / currentTransform.y4;
            // Left most visible pixel in ratio position.
            output.x1 = output.x1 * currentWidthScale + currentTransform.x3;
            // If the parent crop doesn't include a pixel, this source won't either.
            output.x1 = Math.max(output.x1, currentTransform.x1);
            // Right most visible pixel in ratio position.
            output.x2 = output.x2 * currentWidthScale + currentTransform.x3;
            // Same parent crop check from before.
            output.x2 = Math.min(output.x2, currentTransform.x2);
            // Top most visible pixel in ratio position.
            output.y1 = output.y1 * currentHeightScale + currentTransform.y3;
            // Crop check.
            output.y1 = Math.max(output.y1, currentTransform.y1);
            // Bottom most visible pixel in ratio position.
            output.y2 = output.y2 * currentHeightScale + currentTransform.y3;
            // Crop check.
            output.y2 = Math.min(output.y2, currentTransform.y2);
            // Left most pixel including cropped area in ratio position.
            output.x3 = output.x3 * currentWidthScale + currentTransform.x3;
            // Top most pixel including cropped area in ratio position.
            output.y3 = output.y3 * currentHeightScale + currentTransform.y3;
            // The ratio of the original canvas over the full width including cropped area.
            output.x4 = output.x4 * currentTransform.x4;
            // The ratio of the original canvas over the full height including cropped area.
            output.y4 = output.y4 * currentTransform.y4;

            // Legacy values
            output.x = Math.floor(output.x1 * SceneWidth);
            output.y = Math.floor(output.y1 * SceneHeight);
            output.w = Math.floor((output.x2 - output.x1) * SceneWidth);
            output.h = Math.floor((output.y2 - output.y1) * SceneHeight);
            output.crx = Math.floor((output.x3 - output.x1) * SceneWidth);
            output.cry = Math.floor((output.y3 - output.y1) * SceneHeight);
            output.crw = Math.floor(SceneWidth / output.x4) - output.w - output.crx;
            output.crh = Math.floor(SceneHeight / output.y4) - output.h - output.cry;

            return output;
        }

        this._videoSettingsCache = this._videoSettingsCache || null;
        if (!this._videoSettingsCache) {
            try {
                const vs = await this.sendRequest('GetVideoSettings', {});
                this._videoSettingsCache = vs;
            } catch (e) {
                console.warn('GetVideoSettings failed, falling back to defaults', e);
                this._videoSettingsCache = { baseWidth: SceneWidthDefault, baseHeight: SceneHeightDefault };
            }
        }

        const SceneWidth = this._videoSettingsCache.baseWidth;
        const SceneHeight = this._videoSettingsCache.baseHeight;

        async function recurseOverScenes(self, currentScene, currentTransform, sourceTransformsObj, recurse) {
            if (recurse <= 0) return;
            let resp;
            try {
                resp = await self.sendRequest('GetSceneItemList', { sceneName: currentScene });
            } catch (e) {
                console.error('GetSceneItemList failed for', currentScene, e);
                return;
            }
            const sources = resp.sceneItems || resp.sceneItems || [];
            for (let i = sources.length - 1; i >= 0; i--) {
                const source = sources[i];
                const sceneItemEnabled = !!source.sceneItemEnabled;
                if (!sceneItemEnabled) continue;
                const isGroup = !!source.isGroup;
                if (isGroup) continue;
                const sourceType = source.sourceType || '';
                const sourceName = source.sourceName || '';
                if (sourceType === 'OBS_SOURCE_TYPE_SCENE' && recurse > 0) {
                    const nestedTransform = getRects(source.sceneItemTransform || {}, currentTransform, SceneWidth, SceneHeight);
                    await recurseOverScenes(self, sourceName, nestedTransform, sourceTransformsObj, recurse - 1);
                }
                if (sourceName && sourceName.toLowerCase().startsWith('click!') && !sourceTransformsObj[sourceName]) {
                    const rects = getRects(source.sceneItemTransform || {}, currentTransform, SceneWidth, SceneHeight);
                    if (rects.x1 > 1 || rects.x2 < 0 || rects.y1 > 1 || rects.y2 < 0 || rects.x1 > rects.x2 || rects.y1 > rects.y2) {
                        console.warn(`Source ${sourceName} has zero clickable pixels on screen.`);
                        continue;
                    }
                    sourceTransformsObj[sourceName] = rects;
                }
            }
        }

        const initialTransform = { x1: 0, y1: 0, x2: 1, y2: 1, x3: 0, y3: 0, x4: 1, y4: 1 };
        let sceneName = null;
        try {
            const resp = await this.sendRequest('GetCurrentProgramScene', {});
            if (resp && (resp.currentProgramSceneName || resp.currentScene)) { sceneName = resp.currentProgramSceneName || resp.currentScene; }
            else if (resp && resp.name) { sceneName = resp.name; }
        } catch (e) {
            // ignore and try next
        }
        if (!sceneName) sceneName = 'Scene';

        await recurseOverScenes(this, sceneName, initialTransform, sourceTransforms, MaxRecursion);
        return sourceTransforms;
    }
}

let obsSync = new OBS(OBS_PASSWORD);
let heat = new Heat(CHANNEL_ID, obsSync);
</script>
```


</details>

<br/>

I recommend copying the script into your page if you're running the page as just a browser source in OBS pointed at a local file. If you run a local webserver, or otherwise host it, you can import it with `<script src="/js/obs.js"></script>` or pointed to wherever you're hosting the file from. If you're running it as a file, browsers will not allow importing javascript from a file directly, but javascript that's in the page will work.


## Markers diff

Click markers were a provided thing with Heat, and were particularly useful for debugging. The code almost directly works for GreenHeat, but a few changes are necessary. The diff is provided at [examples/markers/markers.diff](./examples/markers/markers.diff) and can be applied to the downloaded page from [Heat's Markers demo](https://heat.j38.net/markers/) after a couple changes.

There should be five `<script>` tags in the page. Three of them are loaded from files that get downloaded with the page.
- The first one only applies to the demo and you should delete it.
- The second you want to copy the code from the file it points to into the HTML tags. (So remove the `src=[file path]` in the tag and copy the file contents directly in between the `<script>` and `</script>`.)
- The third is the bulk of the script needed. Don't touch it (yet).
- The fourth is the marker class which has been separated for some reason?
- The fifth doesn't seen relevant. Might be ad sense stuff. Remove it.

Once you do that, you should have three `<script>` closures and about 196 lines of code.

<details>
<summary>You can apply the patch at examples/markers/markers.diff or make the changes manually.</summary>

``` diff
--- Markers.htm.old	Wed Nov  4 16:40:37 2026
+++ Markers.htm	Wed Nov  4 17:33:34 2026
@@ -42,7 +42,7 @@
                 animation: blinkWarning 1s linear infinite;
             }</style></head>
 
-<body class="demo vsc-initialized">
+<body class="vsc-initialized">
 
     <script>
         class Heat extends EventTarget {
@@ -64,7 +64,7 @@
                 }
 
                 connect() {
-                    let url = `wss://heat-api.j38.net/channel/${this.channelId}`;
+                    let url = "wss://heat.prod.kr/" + this.channelId;
                     this.log(`Connecting to ${url}.`);
                     let ws = new WebSocket(url);
 
@@ -104,21 +104,21 @@
                     if (this.users.has(id)) return this.users.get(id);
 
                     // Ignore invalid names.
-                    if (id.startsWith("A")) return { display_name: "Anonymous" };
-                    if (id.startsWith("U")) return { display_name: "Unverified" };
+                    if (id.startsWith("A")) return { name: "Anonymous" };
+                    if (id.startsWith("U")) return { name: "Unverified" };
 
                     // Query Twitch for user details.
-                    const url = `https://heat-api.j38.net/user/${id}`;
+                    const url = `https://prod.kr/api/twitchprofilefromid?id=${id}`;
 
                     // Handle response.
                     let response = await fetch(url);
                     if (response.ok) {
-                        let data = await response.json();
+                        let data = (await response.json()).res;
                         this.users.set(id, data);
-                        this.log("User for id " + id + " found: " + data.display_name);
+                        this.log("User for id " + id + " found: " + data.name);
                         return data;
                     } else {
-                        return { display_name: "Unknown" };
+                        return { name: "Unknown" };
                     }
                 }
 ```
</details>

<br/>

Once you're updated the file, you only need to make sure there's a marker available for the code (in the location specified in the `<style>` block which defaults to `sprites/marker.svg`). I noticed this doesn't automatically download for me, but I recommend getting creative with it anyway.

<details>
<summary>If you click here, I add this to mine as well so that people's profile pictures are displayed if they authenticate with GreenHeat.</summary>

``` diff
             z-index: 1;
             top: 0;
             left: 0;
-            background-image: url('sprites/marker.svg');
+            background-image: url('./sprites/marker.svg');
+            /** Only the -webkit-mask-image version works in the OBS browser source */
+            /* mask: url("./sprites/mask.svg"); */
+            /* mask-image: url("./sprites/marker.svg"); */
+            -webkit-mask-image: url("./sprites/marker.svg");
+            background-repeat: no-repeat;
             background-size: 100% 100%;
         }
     </style>
@@ -137,7 +142,6 @@
         "use strict";
 
         // Initialize Heat.
-        {
             const params = (new URL(document.location)).searchParams;
             const channel = params.get("channel") ||
                 params.get("channelId") ||
@@ -145,8 +149,9 @@
                 97032862;
 
             const heat = new Heat(channel);
-            heat.addEventListener('click', (e) => {
-                drawClick(e.detail.x, e.detail.y, e.detail.id);
+        {
+            heat.addEventListener('click', async (e) => {
+                await drawClick(e.detail.x, e.detail.y, e.detail.id);
             });
         }
 
@@ -154,11 +159,12 @@
         let markers = new Map();
 
         // Create/update markers.
-        function drawClick(x, y, id) {
+        async function drawClick(x, y, id) {
             if (markers.has(id)) {
                 markers.get(id).update(x, y);
             } else {
-                let marker = new Marker(x, y);
+                const user = await heat.getUserById(id);
+                let marker = new Marker(x, y, user.profile);
                 markers.set(id, marker);
             }
         }
@@ -176,9 +182,12 @@
     <script>
         // Marker class.
         class Marker {
-            constructor(x, y) {
+            constructor(x, y, profile = null) {
                 this.element = document.createElement("div");
                 this.element.classList.add("marker");
+                if (profile) {
+                    this.element.style.backgroundImage = `url("${profile}")`;
+                }
                 document.body.appendChild(this.element);
                 this.update(x, y);
             }
```
</summary>