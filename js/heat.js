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

        this.addEventListener('click', async(e) => {
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

(function (window) {
    window.Heat = Heat;
})(window);
export default Heat;