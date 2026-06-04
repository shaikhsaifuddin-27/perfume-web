Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Find and focus Chrome
$chrome = Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinFocus {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
if ($chrome) {
    [WinFocus]::ShowWindow($chrome.MainWindowHandle, 3)
    [WinFocus]::SetForegroundWindow($chrome.MainWindowHandle)
}
Start-Sleep -Milliseconds 1500

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bmp.Save("C:\Users\ASUS\Desktop\Perfume\ss_chrome.png")
$g.Dispose(); $bmp.Dispose()
