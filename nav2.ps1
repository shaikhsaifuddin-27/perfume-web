Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Find Chrome main window
$chrome = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinF3 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
if ($chrome) {
    [WinF3]::ShowWindow($chrome.MainWindowHandle, 3)
    [WinF3]::SetForegroundWindow($chrome.MainWindowHandle)
}
Start-Sleep -Milliseconds 1000

# Use Ctrl+L to focus address bar and navigate to homepage
[System.Windows.Forms.SendKeys]::SendWait("^l")
Start-Sleep -Milliseconds 600
[System.Windows.Forms.SendKeys]::SendWait("localhost:3000{ENTER}")
Start-Sleep -Seconds 8

# Take the screenshot
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bmp.Save("C:\Users\ASUS\Desktop\Perfume\ss_main.png")
$g.Dispose(); $bmp.Dispose()
