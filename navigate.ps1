Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$chrome = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinF2 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
if ($chrome) {
    [WinF2]::ShowWindow($chrome.MainWindowHandle, 3)
    [WinF2]::SetForegroundWindow($chrome.MainWindowHandle)
}
Start-Sleep -Milliseconds 800

# Click address bar, type URL and hit Enter to reload from top
[System.Windows.Forms.SendKeys]::SendWait("%d")
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("http://localhost:3000{ENTER}")
Start-Sleep -Seconds 6

# Take screenshot
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bmp.Save("C:\Users\ASUS\Desktop\Perfume\ss_reload.png")
$g.Dispose(); $bmp.Dispose()
