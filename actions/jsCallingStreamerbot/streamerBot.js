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