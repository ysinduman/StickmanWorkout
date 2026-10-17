Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\yasin\.gemini\antigravity-ide\brain\2235a333-e1b1-41c4-840b-8bd00cf68f01\stickman_icon_edge_1792244238709.jpg"
$baseResPath = "c:\Users\yasin\OneDrive\Desktop\SticmanWorkout\android\app\src\main\res"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

$densities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

function Create-RoundedRectPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

foreach ($entry in $densities.GetEnumerator()) {
    $folderName = $entry.Key
    $size = $entry.Value
    $targetDir = Join-Path $baseResPath $folderName

    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # 1. Standard ic_launcher.png (Rounded rectangle)
    $bmpLauncher = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g1 = [System.Drawing.Graphics]::FromImage($bmpLauncher)
    $g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g1.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g1.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g1.Clear([System.Drawing.Color]::Transparent)

    $radius = [Math]::Max(4.0, [float]$size * 0.18)
    $rectPath = Create-RoundedRectPath 0 0 $size $size $radius
    $g1.SetClip($rectPath)
    $g1.DrawImage($sourceImg, 0, 0, $size, $size)
    $g1.ResetClip()

    # Subtle inner glow / border for extra pop
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 107, 53)), 1.5
    $g1.DrawPath($pen, $rectPath)
    $pen.Dispose()
    $rectPath.Dispose()
    $g1.Dispose()

    $launcherFile = Join-Path $targetDir "ic_launcher.png"
    $bmpLauncher.Save($launcherFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpLauncher.Dispose()
    Write-Host "Created: $launcherFile ($sizex$size)"

    # 2. Round ic_launcher_round.png (Circular)
    $bmpRound = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g2 = [System.Drawing.Graphics]::FromImage($bmpRound)
    $g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g2.Clear([System.Drawing.Color]::Transparent)

    $circlePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $circlePath.AddEllipse(0.5, 0.5, [float]($size - 1), [float]($size - 1))
    $g2.SetClip($circlePath)
    $g2.DrawImage($sourceImg, 0, 0, $size, $size)
    $g2.ResetClip()

    # Subtle glowing gold-orange rim
    $circlePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 255, 140, 0)), 1.5
    $g2.DrawEllipse($circlePen, 0.5, 0.5, [float]($size - 1), [float]($size - 1))
    $circlePen.Dispose()
    $circlePath.Dispose()
    $g2.Dispose()

    $roundFile = Join-Path $targetDir "ic_launcher_round.png"
    $bmpRound.Save($roundFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()
    Write-Host "Created: $roundFile ($sizex$size)"
}

$sourceImg.Dispose()
Write-Host "All Android icons generated successfully!"
