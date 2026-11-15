SetKeyDelay -1
SetBatchLines -1
SetControlDelay -1
CoordMode Mouse, Window

winTitle = %1%
(winTitle != "%clickTarget%") || Exit
WinGetPos, , , winW, winH, %winTitle%
; MsgBox %winH%,%winW%,%1%,%4%,%5%,%6%,%7%,%8%


; Click args:
; [script] [window] [x percentile] [y percentile] [click type] [x percentile start] [y percentile start] [click length]

; Click types:
; defaults to Left
; Right
; drag (requires x start and y start)
; Hover (always foreground)
; EnvGet, winX, CLICKX
winX = %2%
(winX !=  "%clickX%" ) || Exit
; EnvGet, winY, CLICKY
winY = %3%
(winY != "%clickY%") || Exit
; EnvGet, type_, CLICKTYPE
type_ = %4%
(type_ != "%clickType%") || type_ := "Left"
; EnvGet, winX2, CLICKXSTART
WinX2 = %5%
(winX2 != "%clickXStart%") || WinX2 := ""
; EnvGet, winY2, CLICKYSTART
WinY2 = %6%
(winY2 != "%clickYStart%") || WinY2 := ""
; EnvGet, clickLength, CLICKLENGTH
clickLength = %7%
(clickLength != "%clickLength%") || clickLength := 0
; EnvGet, fg, CLICKFG
fg = %8%
(fg != "%opt_fg%") || fg := 0
(clickLength) || clickLength := 0
winX := winW * winX
winY := winH * winY

; Activate if fg is required
if (fg || type_ == "Hover")
{
    WinActivate %winTitle%
    MouseGetPos, origX, origY
    MouseMove, %winX%, %winY%, 0
    if (type_ == "Hover")
    {
        if (clickLength)
        {
            Sleep, %clickLength%
            MouseMove, %origX%, %origY%, 0
        }
        Exit
    }
}

; Click
if (type_ == "Drag")
{
    winX2 := winW * winX2
    winY2 := winH * winY2
}
else
{
    if (!clickLength)
    {
        ControlClick,X%winX% Y%winY%,%winTitle%,,%type_%,,Pos
        Exit
    }
    WinX2 := WinX
    WinY2 := WinY
}

ControlClick,X%winX2% Y%winY2%,%winTitle%,,%type_%,,Pos D
if (clickLength)
{
    Sleep, %clickLength%
}
ControlClick,X%winX% Y%winY%,%winTitle%,,%type_%,,Pos U

if (clickLength)
{
    Sleep, %clickLength%
    MouseMove, %origX%, %origY%, 0
}
