$gitPath = 'C:\Users\Betopia\AppData\Local\GitHubDesktop\app-3.6.4\resources\app\git\cmd\git.exe'

Write-Host "Staging all files..."
& $gitPath add -A

Write-Host "Committing update..."
& $gitPath commit -m "Sync complete storefront: exact design, glassmorphism nav, interactive panels, and full engine"

Write-Host "Pushing to GitHub..."
& $gitPath push origin main

Write-Host "Done!"
