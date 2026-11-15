using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using System.Globalization;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.Json;

public class CPHInline
{
    public int SceneWidth = 1920;
    public int SceneHeight = 1080;
    public const int MaxRecursion = 3;
    private Dictionary<string, Dictionary<string, float>> sourceTransforms;
    public void printStackCaller(string message = "",
        [CallerMemberName] string callingMethod = "",
        [CallerFilePath] string callingFilePath = "",
        [CallerLineNumber] int callingFileLineNumber = 0)
    {
        CPH.LogError($"{message}@{callingFileLineNumber} in {callingMethod} ({callingFilePath})");
    }
    public bool Execute()
    {
        try
        {
            printStackCaller();
            var jstring = CPH.ObsSendRaw("GetVideoSettings", "{}", 0);
            JObject jobj = JObject.Parse(jstring);
            SceneHeight = (int)jobj["baseHeight"];
            SceneWidth = (int)jobj["baseWidth"];
            CPH.SetGlobalVar("SceneHeight", SceneHeight, false);
            CPH.SetGlobalVar("SceneWidth", SceneWidth, false);

            var sceneName = CPH.ObsGetCurrentScene(0);
            // printStackCaller(sceneName);
            sourceTransforms = new Dictionary<string, Dictionary<string, float>>();
            var currentTransform = new Dictionary<string, float>
            {
                ["x1"] = 0,
                ["y1"] = 0,
                ["x2"] = 1,
                ["y2"] = 1,
                ["x3"] = 0,
                ["y3"] = 0,
                ["x4"] = 1,
                ["y4"] = 1
            };

            recurseOverScenes(sceneName, currentTransform, sourceTransforms);

            CPH.SetArgument("ClickMap", sourceTransforms);
            CPH.SetGlobalVar("ClickMap", sourceTransforms, false);
        }
        catch (Exception e)
        {
            CPH.LogError(e.Message);
            CPH.LogError(e.StackTrace);
        }

        // Now send it out through the Streamer.bot websocket.
        var jsonToSend = new
        {
            type = "cachemap",
            map = sourceTransforms
        };
        CPH.WebsocketBroadcastJson(JsonSerializer.Serialize(jsonToSend));
        return true;
    }

    public void recurseOverScenes(string currentScene, Dictionary<string, float> currentTransform, Dictionary<string, Dictionary<string, float>> sourceTransforms, int recurse = MaxRecursion)
    {
        printStackCaller(currentScene);
        var jstring = CPH.ObsSendRaw("GetSceneItemList", "{\"sceneName\":\"" + currentScene + "\"}", 0);
        JObject jobj = JObject.Parse(jstring);
        // printStackCaller(jstring.ToString());

        JArray sources = jobj["sceneItems"] as JArray;

        // Check scenes from foreground to background.
        foreach (JObject source in sources.Reverse())
        {
            bool sceneItemEnabled = (bool?)source["sceneItemEnabled"] ?? false;
            if (!sceneItemEnabled)
                continue;
            bool isGroup = (bool?)source["isGroup"] ?? false;
            if (isGroup)
                continue;
            string sourceType = source["sourceType"].ToString();
            string sourceName = source["sourceName"].ToString();
            if (sourceType.Equals("OBS_SOURCE_TYPE_SCENE") && recurse > 0)
            {
                CPH.LogDebug($"Recursing into {sourceName}");
                recurseOverScenes(sourceName, GetRects(source["sceneItemTransform"], currentTransform), sourceTransforms, recurse - 1); // Recursive
            }
            if (sourceName.Length > 6 && sourceName.ToLower().Substring(0, 6) == "click!" && !sourceTransforms.ContainsKey(sourceName))
            {
                CPH.LogDebug($"Adding {sourceName}");
                // printStackCaller(source.ToString());
                var rects = GetRects(source["sceneItemTransform"], currentTransform);
                if (rects["x1"] > 1 || rects["x2"] < 0 ||
                    rects["y1"] > 1 || rects["y2"] < 0 ||
                    rects["x1"] > rects["x2"] || rects["y1"] > rects["y2"])
                {
                    CPH.LogWarn($"Source {sourceName} has zero clickable pixels on screen.");
                    continue;
                }
                sourceTransforms.Add(sourceName, rects); // Add to output
            }
        }
        return;
    }

    public Dictionary<string, float> GetRects(JToken sceneItemTransform, Dictionary<string, float> currentTransform)
    {
        var transform = sceneItemTransform.ToObject<Dictionary<string, object>>();
        Dictionary<string, float> output = new Dictionary<string, float>();
        // Seems to be right for "OBS_BOUNDS_NONE" "OBS_BOUNDS_STRETCH"
        // Alignment
        // 546
        // 102
        // 98'xA'
        // 0 == center
        // 4 == top center
        // 5 == top left
        // 6 == top right ...
        // CPH.LogError(string.Join(Environment.NewLine, transform.Select(a => $"{a.Key}: {a.Value}")));
        string boundsType = transform["boundsType"].ToString();
        int align = Convert.ToInt32(transform["alignment"]);
        float posX;
        float.TryParse(transform["positionX"].ToString(), out posX);
        float posY;
        float.TryParse(transform["positionY"].ToString(), out posY);
        float wid;
        float.TryParse(transform["width"].ToString(), out wid);
        float hei;
        float.TryParse(transform["height"].ToString(), out hei);
        float boW;
        float.TryParse(transform["boundsWidth"].ToString(), out boW);
        float boH;
        float.TryParse(transform["boundsHeight"].ToString(), out boH);
        float crL;
        float.TryParse(transform["cropLeft"].ToString(), out crL);
        float crT;
        float.TryParse(transform["cropTop"].ToString(), out crT);
        float crB;
        float.TryParse(transform["cropBottom"].ToString(), out crB);
        float crR;
        float.TryParse(transform["cropRight"].ToString(), out crR);
        float soH;
        float.TryParse(transform["sourceHeight"].ToString(), out soH);
        float soW;
        float.TryParse(transform["sourceWidth"].ToString(), out soW);
        float boA = Convert.ToInt32(transform["boundsAlignment"]);
        float scW;
        float.TryParse(transform["scaleX"].ToString(), out scW);
        float scH;
        float.TryParse(transform["scaleY"].ToString(), out scH);
        float widthAdj;
        if (align % 2 == 1) // Left
        {
            widthAdj = 0;
        }
        else if (align % 4 == 0) // Center
        {
            widthAdj = 0.5f;
        }
        else // Right
        {
            widthAdj = 1;
        }
        float heightAdj;
        if (align < 4) // Center
        {
            heightAdj = 0.5f;
        }
        else if (align < 8) // Top
        {
            heightAdj = 0;
        }
        else // Right
        {
            heightAdj = 1;
        }
        var croppedWid = Math.Max(soW - crL - crR, 1);
        var croppedHei = Math.Max(soH - crT - crB, 1);
        switch (boundsType)
        {
            case "OBS_BOUNDS_NONE":
                // printStackCaller($"OBS_BOUNDS_NONE: {posX} {posY} {wid} {hei} {boW} {boH} {crL} {crT} {crB} {crR} {soH} {soW} {boA} {scW} {scH}");
                var adjW = croppedWid * scW;
                var adjH = croppedHei * scH;
                output["x1"] = (posX - widthAdj * adjW) / SceneWidth;
                output["x2"] = output["x1"] + adjW / SceneWidth;
                output["y1"] = (posY - heightAdj * adjH) / SceneHeight;
                output["y2"] = output["y1"] + adjH / SceneHeight;
                output["x3"] = output["x1"] - (crL * scW / SceneWidth);
                output["y3"] = output["y1"] - (crT * scH / SceneHeight);
                output["x4"] = SceneWidth / (adjW + (crL + crR) * scW);
                output["y4"] = SceneHeight / (adjH + (crT + crB) * scH);
                break;
            case "OBS_BOUNDS_STRETCH":
                // Reuse the unused
                scW = boW / croppedWid;
                scH = boH / croppedHei;
                output["x1"] = (posX - widthAdj * boW) / SceneWidth;
                output["x2"] = output["x1"] + boW / SceneWidth;
                output["y1"] = (posY - heightAdj * boH) / SceneHeight;
                output["y2"] = output["y1"] + boH / SceneHeight;
                output["x3"] = output["x1"] - (crL * scW / SceneWidth);
                output["y3"] = output["y1"] - (crT * scH / SceneHeight);
                output["x4"] = SceneWidth / (boW + (crL + crR) * scW);
                output["y4"] = SceneHeight / (boH + (crT + crB) * scH);
                break;
            case "OBS_BOUNDS_SCALE_INNER":
                scW = Math.Min(boW / croppedWid, boH / croppedHei);
                scH = scW;
                goto case "This is not an OBS enum, it's applying the scale.";
            case "OBS_BOUNDS_SCALE_OUTER":
                scW = Math.Max(boW / croppedWid, boH / croppedHei);
                scH = scW;
                goto case "This is not an OBS enum, it's applying the scale.";
            case "OBS_BOUNDS_SCALE_TO_WIDTH":
                scW = boW / croppedWid;
                scH = scW;
                goto case "This is not an OBS enum, it's applying the scale.";
            case "OBS_BOUNDS_SCALE_TO_HEIGHT":
                scW = boH / croppedHei;
                scH = scW;
                goto case "This is not an OBS enum, it's applying the scale.";
            case "OBS_BOUNDS_MAX_ONLY":
                scW = Math.Max(Math.Max(1.0f, boW / croppedWid), boH / croppedHei);
                scH = scW;
                goto case "This is not an OBS enum, it's applying the scale.";
            case "This is not an OBS enum, it's applying the scale.":
                var newW = croppedWid * scW;
                var newH = croppedHei * scH;
                var trW = boW - newW;
                var trH = boH - newH;
                // Bounds alignment
                // 546
                // 102
                // 98'xA'
                float nHeiAdj;
                if (boA < 4) // Center
                {
                    nHeiAdj = 0.5f;
                }
                else if (boA < 8) // Top
                {
                    nHeiAdj = 0;
                }
                else // Bottom
                {
                    nHeiAdj = 1;
                }
                float nWidAdj;
                if (boA % 2 == 1) // Left
                {
                    nWidAdj = 0;
                }
                else if (boA % 4 == 0) // Center
                {
                    nWidAdj = 0.5f;
                }
                else // Right
                {
                    nWidAdj = 1;
                }
                output["x1"] = (posX - widthAdj * boW - nWidAdj * trW) / SceneWidth;
                output["x2"] = output["x1"] + newW / SceneWidth;
                output["y1"] = (posY - heightAdj * boH - nHeiAdj * trH) / SceneHeight;
                output["y2"] = output["y1"] + newH / SceneHeight;
                output["x3"] = output["x1"] - (crL * scW / SceneWidth);
                output["y3"] = output["y1"] - (crT * scH / SceneHeight);
                output["x4"] = SceneWidth / (newW + (crL + crR) * scW);
                output["y4"] = SceneHeight / (newH + (crT + crB) * scH);
                break;
            default:
                throw new ArgumentException("Congrats! You've found an unsupported boundsType! Please help me fix that. D:");
        }
        // Now scale by the parent scene
        var currentWidthScale = 1 / currentTransform["x4"]; // (float)(currentTransform["w"] + currentTransform["crx"] + currentTransform["crw"]) / SceneWidth;
        var currentHeightScale = 1 / currentTransform["y4"]; // (float)(currentTransform["h"] + currentTransform["cry"] + currentTransform["crh"]) / SceneHeight;
        // Left most visible pixel in ratio position.
        output["x1"] *= currentWidthScale;
        output["x1"] += currentTransform["x3"];
        // If the parent crop doesn't include a pixel, this source won't either.
        output["x1"] = Math.Max(output["x1"], currentTransform["x1"]);
        // Right most visible pixel in ratio position.
        output["x2"] *= currentWidthScale;
        output["x2"] += currentTransform["x3"];
        // Same parent crop check from before.
        output["x2"] = Math.Min(output["x2"], currentTransform["x2"]);
        // Top most visible pixel in ratio position.
        output["y1"] *= currentHeightScale;
        output["y1"] += currentTransform["y3"];
        // Crop check.
        output["y1"] = Math.Max(output["y1"], currentTransform["y1"]);
        // Bottom most visible pixel in ratio position.
        output["y2"] *= currentHeightScale;
        output["y2"] += currentTransform["y3"];
        // Crop check.
        output["y2"] = Math.Min(output["y2"], currentTransform["y2"]);
        // Left most pixel including cropped area in ratio position.
        output["x3"] *= currentWidthScale;
        output["x3"] += currentTransform["x3"];
        // Top most pixel including cropped area in ratio position.
        output["y3"] *= currentHeightScale;
        output["y3"] += currentTransform["y3"];
        // The ratio of the original canvas over the full width including cropped area.
        output["x4"] *= currentTransform["x4"];
        // The ratio of the original canvas over the full height including cropped area.
        output["y4"] *= currentTransform["y4"];
        return output;
    }
}