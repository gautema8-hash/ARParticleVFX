$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$base = 'http://localhost:8080'
$pass = 0
$fail = 0

function Check($name, $expected, $actual, $detail = '') {
  if ($expected -eq $actual) {
    $script:pass++
    Write-Output ("PASS  | {0} | {1}" -f $name, $detail)
  } else {
    $script:fail++
    Write-Output ("FAIL  | {0} | expected={1} actual={2} {3}" -f $name, $expected, $actual, $detail)
  }
}

# ===== 1. Effect catalog (anonymous) =====
$r = Invoke-RestMethod "$base/api/effect/list"
Check 'effect list total=15' 15 $r.data.total "count=$($r.data.list.Count)"

$r = Invoke-RestMethod "$base/api/effect/1"
Check 'effect detail code=galaxy' 'galaxy' $r.data.effectCode "name=$($r.data.effectName)"

# ===== 2. Register =====
$reg = @{username='testuser'; password='Test123456'; email='test@arpfx.com'; nickname='tester'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/register" -Method Post -Body $reg -ContentType 'application/json'
Check 'register success' 200 $r.code

$r = Invoke-RestMethod "$base/api/user/register" -Method Post -Body $reg -ContentType 'application/json'
Check 'register duplicate -> 1001' 1001 $r.code "msg=$($r.message)"

$weak = @{username='weakuser'; password='123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/register" -Method Post -Body $weak -ContentType 'application/json'
Check 'register weak password -> 400' 400 $r.code

# ===== 3. Login =====
$login = @{username='testuser'; password='Test123456'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $login -ContentType 'application/json'
$token = $r.data.token
Check 'user login' 200 $r.code "role=$($r.data.user.role) tier=$($r.data.user.tier)"

$admin = @{username='admin'; password='Admin123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $admin -ContentType 'application/json'
$adminToken = $r.data.token
Check 'admin login role=1' 1 $r.data.user.role "nickname=$($r.data.user.nickname)"

$bad = @{username='testuser'; password='WrongPass'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $bad -ContentType 'application/json'
Check 'wrong password -> 1003' 1003 $r.code

# ===== 4. User info =====
$h = @{Authorization = "Bearer $token"}
$r = Invoke-RestMethod "$base/api/user/info" -Headers $h
Check 'user info' 200 $r.code "username=$($r.data.username)"

$r = Invoke-RestMethod "$base/api/user/info"
Check 'no token -> 401' 401 $r.code

# ===== 5. Favorite =====
$r = Invoke-RestMethod "$base/api/user/favorite/galaxy" -Method Post -Headers $h
Check 'add favorite galaxy' 200 $r.code

$r = Invoke-RestMethod "$base/api/user/favorite/galaxy" -Method Post -Headers $h
Check 'add favorite duplicate (idempotent)' 200 $r.code

$r = Invoke-RestMethod "$base/api/user/favorite/notexist" -Method Post -Headers $h
Check 'favorite not-exist -> 2001' 2001 $r.code

$r = Invoke-RestMethod "$base/api/user/favorites" -Headers $h
Check 'favorite list contains galaxy' 'galaxy' ($r.data -join ',') "list=$($r.data -join ',')"

$r = Invoke-RestMethod "$base/api/user/favorite/galaxy" -Method Delete -Headers $h
Check 'remove favorite' 200 $r.code

# ===== 6. Reset password =====
$reset = @{username='testuser'; email='test@arpfx.com'; newPassword='NewPass123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/reset-password" -Method Post -Body $reset -ContentType 'application/json'
Check 'reset password' 200 $r.code

$resetBad = @{username='testuser'; email='wrong@xx.com'; newPassword='NewPass123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/reset-password" -Method Post -Body $resetBad -ContentType 'application/json'
Check 'reset password wrong email -> 400' 400 $r.code

$newLogin = @{username='testuser'; password='NewPass123'} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/user/login" -Method Post -Body $newLogin -ContentType 'application/json'
Check 'login with new password' 200 $r.code

# ===== 7. Order =====
$order1 = @{orderType=0; effectId=1} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/order/create" -Method Post -Body $order1 -ContentType 'application/json' -Headers $h
$orderNo1 = $r.data.orderNo
Check 'order single effect' 200 $r.code "orderNo=$orderNo1"

$order2 = @{orderType=1; tier=1} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/order/create" -Method Post -Body $order2 -ContentType 'application/json' -Headers $h
$orderNo2 = $r.data.orderNo
Check 'order membership' 200 $r.code "orderNo=$orderNo2"

$orderBad = @{orderType=9; tier=1} | ConvertTo-Json
$r = Invoke-RestMethod "$base/api/order/create" -Method Post -Body $orderBad -ContentType 'application/json' -Headers $h
Check 'order invalid type -> 400' 400 $r.code

$r = Invoke-RestMethod "$base/api/order/list" -Headers $h
Check 'order list >= 2' $true ($r.data.Count -ge 2) "count=$($r.data.Count)"

# ===== 8. Pay callback =====
$r = Invoke-RestMethod "$base/api/order/pay/callback?orderNo=$orderNo2" -Method Post -Headers $h
Check 'pay callback membership' 200 $r.code

$r = Invoke-RestMethod "$base/api/order/pay/callback?orderNo=$orderNo2" -Method Post -Headers $h
Check 'duplicate callback -> 3002' 3002 $r.code

$r = Invoke-RestMethod "$base/api/user/info" -Headers $h
Check 'tier upgraded to 1' 1 $r.data.tier "tier=$($r.data.tier)"

$adminH = @{Authorization = "Bearer $adminToken"}
$r = Invoke-RestMethod "$base/api/order/pay/callback?orderNo=$orderNo1" -Method Post -Headers $adminH
Check 'cross-user callback -> 403' 403 $r.code

# ===== Summary =====
Write-Output ''
Write-Output ("===== SUMMARY: PASS={0} FAIL={1} =====" -f $pass, $fail)
