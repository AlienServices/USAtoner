@echo off
cd /d C:\Users\Irvin\Desktop\USAtoner
setlocal
set CRON_SECRET=USAtonerSecretKey12345678
"C:\Program Files\nodejs\node.exe" "C:\Users\Irvin\Desktop\USAtoner\scripts\updateInventory.mjs" > "C:\Users\Irvin\Desktop\USAtoner\scripts\inventory_update_log.txt" 2>&1
endlocal