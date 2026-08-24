$gitPath = 'C:\Users\Betopia\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe'

Write-Host "Initializing Git Repository..."
& $gitPath init

Write-Host "Configuring Git Identity..."
& $gitPath config user.name "GetttoHead"
& $gitPath config user.email "siamchowdhury010@gmail.com"

Write-Host "Staging Files..."
& $gitPath add -A

Write-Host "Committing Changes..."
& $gitPath commit -m "Initial release: PIIIVOT Combat & Training E-Commerce platform with Visual CMS Builder"

Write-Host "Setting Branch to main..."
& $gitPath branch -M main

Write-Host "Setting Remote Origin..."
& $gitPath remote remove origin 2>$null
& $gitPath remote add origin "https://github.com/GetttoHead/Piiivot.git"

Write-Host "Pushing to GitHub..."
& $gitPath push -u origin main
