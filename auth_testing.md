# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Create Test User & Session (mongosh, DB = test_database)
```
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.'+Date.now()+'@example.com', name: 'Test User', picture: 'https://i.pravatar.cc/150', role:'customer', created_at: new Date().toISOString()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(), created_at: new Date().toISOString()});
```

## Backend API test
```
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer <SESSION_TOKEN>"
curl -X GET "$URL/api/incidents" -H "Authorization: Bearer <SESSION_TOKEN>"
```

## Browser test (set cookie then navigate)
```
await page.context.add_cookies([{ "name":"session_token","value":"<TOKEN>","domain":"<host>","path":"/","httpOnly":true,"secure":true,"sameSite":"None" }])
await page.goto("https://<host>/dashboard")
```
Note: This app's frontend authenticates via the httpOnly `session_token` cookie for CUSTOMER routes (/dashboard) and via a `dealer_token` JWT in localStorage for DEALER routes (/dealer). Backend also accepts `Authorization: Bearer <session_token>` as fallback for customer endpoints.

## Checklist
- users doc has custom user_id; user_sessions.user_id matches
- all queries use {"_id":0}
- /api/auth/me returns user (not 401)
- dashboard loads without redirect to /
- Callback detection uses useLocation().hash
