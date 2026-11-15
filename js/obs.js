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

(function(window) {
    window.OBS = OBS;
})(window);
export default OBS;
