using System;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;


public class CPHInline
{
    private Dictionary<string, Dictionary<string, float>> sourceTransforms;
    public bool Execute()
    {
        try
        {
            CultureInfo culture = new CultureInfo("en-US");

            string heatMapData = args["message"].ToString();
            var json = JObject.Parse(heatMapData);

            if (!json.ContainsKey("type") || !json.ContainsKey("id") || !json.ContainsKey("x") || !json.ContainsKey("y"))
            {
                return false;
            }

            var type = json["type"].ToString();
            var id = json["id"].ToString();
            float x;
            float.TryParse(json["x"].ToString().Replace(",", "."), out x);
            float y;
            float.TryParse(json["y"].ToString().Replace(",", "."), out y);

            sourceTransforms = CPH.GetGlobalVar< Dictionary<string, Dictionary<string, float>>>("ClickMap", false);
            if (sourceTransforms == null)
            {
                throw new Exception("No ClickMap found in global variables.");
            }
            foreach (string sourceName in sourceTransforms.Keys)
            {
                var bounds = sourceTransforms[sourceName];
                var x1 = bounds["x1"];
                var y1 = bounds["y1"];
                var x2 = bounds["x2"];
                var y2 = bounds["y2"];
                // Check on screen position and size
                if (x < x1 || x >= x2 ||
                    y < y1 || y >= y2)
                    continue;
                var x3 = bounds["x3"];
                var y3 = bounds["y3"];
                var x4 = bounds["x4"];
                var y4 = bounds["y4"];
                // Convert to unadulterated on screen position and size for clickThrough itself
                if (sourceName.Length > 6 && sourceName.Substring(5, 1) == "!")
                {
                    var clickArgsLoc = sourceName.IndexOf("?");
                    if (clickArgsLoc < 6)
                    {
                        clickArgsLoc = sourceName.Length;
                    }
                    var clickTarget = sourceName.Substring(6, clickArgsLoc - 6);
                    var clickargs = sourceName.Substring(clickArgsLoc + 1, sourceName.Length - clickArgsLoc - 1);
                    var clickX = (x - x3) * x4;
                    var clickY = (y - y3) * y4;
                    CPH.SetArgument("clickdata", json.ToString());
                    CPH.SetArgument("id", id);
                    CPH.SetArgument("type", type);
                    CPH.SetArgument("x", clickX);
                    CPH.SetArgument("y", clickY);
                    CPH.SetArgument("button", json["button"].ToString());
                    bool old_format = json.ContainsKey("modifiers");
                    if (old_format)
                    {
                        var modifiers = json["modifiers"].ToObject<Dictionary<string, bool>>();
                        CPH.SetArgument("shift", modifiers.ContainsKey("shift") ? modifiers["shift"] : false);
                        CPH.SetArgument("ctrl", modifiers.ContainsKey("ctrl") ? modifiers["ctrl"] : false);
                        CPH.SetArgument("alt", modifiers.ContainsKey("alt") ? modifiers["alt"] : false);
                    }
                    else
                    {
                        CPH.SetArgument("shift", json.ContainsKey("shift") ? json["shift"].ToString() : false);
                        CPH.SetArgument("ctrl", json.ContainsKey("ctrl") ? json["ctrl"].ToString() : false);
                        CPH.SetArgument("alt", json.ContainsKey("alt") ? json["alt"].ToString() : false);
                    }
                    try
                    {
                        CPH.SetArgument("time", float.Parse(json["time"].ToString().Replace(",", "."), culture));
                    }
                    catch (Exception)
                    {
                        CPH.SetArgument("time", 0);
                    }
                    try
                    {
                        CPH.SetArgument("latency", int.Parse(json["latency"].ToString()));
                    }
                    catch (Exception)
                    {
                        CPH.SetArgument("latency", 0);
                    }
                    CPH.SetArgument("target", clickTarget);
                    CPH.SetArgument("args", clickargs);
                    foreach (var arg in clickargs.Split('&'))
                    {
                        var split = arg.Split('=');
                        if (split.Length == 2)
                        {
                            CPH.SetArgument(split[0], split[1]);
                        }
                    }
                    CPH.RunAction(clickTarget, true);
                }
            }
            return true;

            // // // The below is a workaround for the original heat, and a built in clickrate thing. This can be kicked down stream.

            // // Debouncing/rate limiting.
            // DateTime lastClick;
            // var clickTimestamp = DateTime.Parse(args["actionQueuedAt"].ToString());
            // if (LastHeatClicked.ContainsKey(id))
            // {
            //     lastClick = LastHeatClicked[id];
            //     if (ClickCooldown >= clickTimestamp - lastClick &&
            //         LastHeatX.ContainsKey(id) && LastHeatY.ContainsKey(id) &&
            //            LastHeatX[id] == x && LastHeatY[id] == y)
            //         return false;
            // }

            // AddClickToQueue(id, x, y);

            // // TODO: If you still need more speed, move this to the ParseClickFromQueue method.
            // LastHeatClicked[id] = clickTimestamp;
            // LastHeatX[id] = x;
            // LastHeatY[id] = y;

            // while (RecentClicks.Count > 0 && TimeSpan.FromSeconds(15) < clickTimestamp - (DateTime)RecentClicks.Last())
            //     RecentClicks.RemoveAt(RecentClicks.Count - 1);
            // RecentClicks.Insert(0, clickTimestamp);
            // //CPH.SendMessage(RecentClicks.Count.ToString());
            // var clickRate = RecentClicks.Count / 15.0f;
            // CPH.SetGlobalVar("ClickRate", clickRate, true);
            // var clickRateHighScore = CPH.GetGlobalVar<float>("ClickRateHighScore", false);
            // if (clickRate > clickRateHighScore)
            //     CPH.SetGlobalVar("ClickRateHighScore", clickRate, false);
            // //CPH.SendMessage(clickRate.ToString() + " " + clickRateHighScore.ToString());
            // return true;
        }
        catch (Exception e)
        {
            CPH.LogError(e.Message);
            CPH.LogError(e.StackTrace);
            return false;
        }
    }

    public bool SendWebsocketClick()
    {
        string args_ = "";
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
