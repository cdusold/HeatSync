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

function toViewportCoordinates(x, y) {
    return { cx: Math.round(x * window.innerWidth), cy: Math.round(y * window.innerHeight) };
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