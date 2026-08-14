$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$base = 'http://localhost:8080'
$pass = 0; $fail = 0

function Check($name, $expected, $actual, $detail='') {
  if ($expected -eq $actual) { $script:pass++; Write-Output "PASS | $name | $detail" }
  else { $script:fail++; Write-Output "FAIL | $name | expected=$expected actual=$actual $detail" }
}

# admin login
$admin = @{username='admin'; password='Admin123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $admin -ContentType 'application/json'
$adminToken = $r.data.token
Check 'admin login' 200 $r.code

# user login
$user = @{username='testuser'; password='NewPass123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $user -ContentType 'application/json'
$userToken = $r.data.token
Check 'user login' 200 $r.code

$adminH = @{Authorization = "Bearer $adminToken"}
$userH = @{Authorization = "Bearer $userToken"}

# admin apis
$r = Invoke-RestMethod "$base/api/admin/users" -Headers $adminH
Check 'admin users' 200 $r.code "count=$($r.data.Count)"
$r = Invoke-RestMethod "$base/api/admin/orders" -Headers $adminH
Check 'admin orders' 200 $r.code "count=$($r.data.Count)"
$r = Invoke-RestMethod "$base/api/admin/effects" -Headers $adminH
Check 'admin effects' 200 $r.code "count=$($r.data.Count)"

# non-admin forbidden
$r = Invoke-RestMethod "$base/api/admin/users" -Headers $userH
Check 'non-admin forbidden' 403 $r.code

# effect status toggle
$r = Invoke-RestMethod "$base/api/admin/effect/1/status?status=0" -Method Put -Headers $adminH
Check 'effect off-shelf' 200 $r.code
$r = Invoke-RestMethod "$base/api/admin/effect/1/status?status=1" -Method Put -Headers $adminH
Check 'effect on-shelf' 200 $r.code

# order by effectCode
$order = @{orderType=0; effectCode='galaxy'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/order/create" -Method Post -Body $order -ContentType 'application/json' -Headers $userH
Check 'order by effectCode' 200 $r.code

# rate limit
$limited = $false
for ($i = 0; $i -lt 25; $i++) {
  $body = @{username="spam$i"; password='Test123456'} | ConvertTo-Json
  $rr = Invoke-RestMethod "$base/api/user/register" -Method Post -Body $body -ContentType 'application/json'
  if ($rr.code -eq 429) { $limited = $true; break }
}
Check 'rate limit 429' $true $limited

Write-Output ''
Write-Output "===== SUMMARY: PASS=$pass FAIL=$fail ====="
