using System;
using System.Text.Json;

public class CPHInline
{
    public bool Execute()
    {
        string args_;
        CPH.TryGetArg("args", out args_);
        foreach (var arg in args_.Split('&'))
        {
            var split = arg.Split('=');
            if (split.Length == 2)
            {
                CPH.SetArgument(split[0], split[1]);
            }
        }

        string id;
        CPH.TryGetArg("id", out id);
        string type;
        CPH.TryGetArg("type", out type);
        float x;
        float.TryParse(args["x"].ToString().Replace(",", "."), out x);
        float y;
        float.TryParse(args["y"].ToString().Replace(",", "."), out y);
        string button;
        CPH.TryGetArg("button", out button);
        bool shift;
        CPH.TryGetArg("shift", out shift);
        bool ctrl;
        CPH.TryGetArg("ctrl", out ctrl);
        bool alt;
        CPH.TryGetArg("alt", out alt);
        long time;
        CPH.TryGetArg("time", out time);
        float latency;
        float.TryParse(args["latency"].ToString().Replace(",", "."), out latency);
        string target;
        CPH.TryGetArg("target", out target);
        string sessionId = "unspecified_clicks";
        CPH.TryGetArg("sessionId", out sessionId);
        var click = new
        {
            id = id,
            type = type,
            x = x,
            y = y,
            button = button,
            shift = shift,
            ctrl = ctrl,
            alt = alt,
            time = time,
            latency = latency,
            args = args_,
            target = target,
            sessionId = sessionId
        };
        CPH.WebsocketBroadcastJson(JsonSerializer.Serialize(click));
        return true;
    }
}