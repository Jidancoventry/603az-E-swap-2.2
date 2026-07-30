# E-Swap 2.2 — Manual Cognito and Amplify Deployment (`us-east-1`)

This is the AWS Academy-compatible path for an existing E-Swap 2.2 backend. It does not update CloudFormation and does not require you to create CloudFront resources.

## Role model

E-Swap has only two account roles:

| Role | Capabilities |
|---|---|
| `user` | Buy, sell, publish listings, message, review and submit recycling requests |
| `admin` | Supervise users, listings, orders, escrow, conversations and recycling |

Buyer and seller are not registration roles. A standard user becomes the buyer or seller for a particular transaction. Public registration always creates a standard user. Administrator access comes only from the Cognito `Admins` group.

## 1. Preserve the existing backend

1. Wait until the `e-swap-2-2` stack reaches `UPDATE_ROLLBACK_COMPLETE`.
2. Do not delete the stack or run another template update.
3. Confirm the existing health URL returns `"status":"ok"`.

## 2. Create Cognito manually

In **Cognito → User pools**, create a user pool in `us-east-1`:

- Application type: **Single-page application (SPA)**
- Application name: `e-swap-2-2-web`
- Sign-in identifier: **Email**
- Self-registration: enabled
- Required attributes: `email` and `name`
- Email verification: verification code
- Account recovery: verified email
- MFA: optional/off for the university build
- Minimum password length: 8
- Require uppercase, lowercase, number and symbol
- Cognito email provider
- App client secret: **do not generate one**
- Authentication flows: SRP, username/password and refresh token

If a return URL is required during setup, use `http://localhost:5173`. E-Swap uses its own login form, not Cognito managed login.

Copy the **User pool ID** and **App client ID**.

## 3. Create the administrator group

In the user pool, open **Groups** and create:

```text
Admins
```

Do not create demo users. Normal users will register through E-Swap with their own accessible email address.

## 4. Build the frontend

Open PowerShell in `frontend` and create `.env.production`:

```powershell
@"
VITE_API_URL=https://he2403n8z4.execute-api.us-east-1.amazonaws.com
VITE_STORAGE_MODE=aws
VITE_COGNITO_USER_POOL_ID=PASTE_USER_POOL_ID
VITE_COGNITO_USER_POOL_CLIENT_ID=PASTE_APP_CLIENT_ID
"@ | Set-Content -Encoding utf8 .env.production

npm.cmd install
npm.cmd test
npm.cmd run build
Compress-Archive -Path .\dist\* -DestinationPath .\e-swap-2-2-amplify.zip -Force
```

The Amplify ZIP must contain `index.html` at its root.

## 5. Update Lambda manually

1. Open **Lambda** → the existing `e-swap-2-2-api` function.
2. Choose **Code → Upload from → .zip file**.
3. Upload `aws\backend\dist\e-swap-api-cognito.zip`.
4. Confirm the handler is `src/handler.handler`.
5. Under **Configuration → Environment variables**, preserve `TABLE_NAME` and `IMAGE_BUCKET`, then add:

```text
ALLOWED_ORIGIN = *
USER_POOL_ID = your Cognito user pool ID
```

The old `AUTH_SECRET` can remain but is no longer used for browser authentication.

## 6. Configure API Gateway JWT authorization

Open the existing E-Swap **HTTP API** in API Gateway.

Create public routes attached to the existing Lambda integration:

```text
GET /health
GET /public-state
OPTIONS /{proxy+}
```

Create a JWT authorizer:

```text
Name: e-swap-cognito-jwt
Identity source: $request.header.Authorization
Audience: your Cognito app client ID
Issuer: https://cognito-idp.us-east-1.amazonaws.com/YOUR_USER_POOL_ID
```

Attach `e-swap-cognito-jwt` to `$default`. Keep `/health`, `/public-state` and `OPTIONS` as `NONE`.

Configure CORS:

```text
Allowed origins: *
Allowed methods: GET, POST, OPTIONS
Allowed headers: authorization, content-type
Max age: 300
Allow credentials: off
```

Ensure the `$default` stage has auto-deploy enabled.

## 7. Test the API

- `/health` must return `ok`.
- `/public-state` must return public marketplace data.
- `/state` without a token must return `Unauthorized`.

## 8. Deploy with Amplify Hosting

1. Open **Amplify → Create new app → Deploy without Git**.
2. App name: `e-swap-2-2`.
3. Branch: `production`.
4. Method: drag and drop.
5. Upload `frontend\e-swap-2-2-amplify.zip`.
6. Choose **Save and deploy**.

Under **Hosting → Rewrites and redirects**, add:

```text
Source: /<*>
Target: /index.html
Type: 200 (Rewrite)
```

## 9. Register real users

Each user:

1. Opens the Amplify URL.
2. Chooses **Register**.
3. Enters their own name, real email, location and password.
4. Enters the verification code Cognito sends.
5. Receives a standard `user` account and 100 starter E-Tokens.

The same account can buy and sell. There is no buyer/seller role selector.

## 10. Promote the real administrator

1. Register the administrator's own real email through E-Swap.
2. Confirm the email code.
3. In **Cognito → User pools → your pool → Groups → Admins**, add that confirmed user.
4. Log out of E-Swap.
5. Log in again with the same email.

The new Cognito token contains the `Admins` group. E-Swap maps it to the `admin` role and opens the administrator dashboard.

Removing the account from `Admins` and signing in again returns it to the normal `user` role.

## 11. Final checks

1. Register two real user accounts.
2. Confirm either account can publish a listing and purchase another user's listing.
3. Confirm there is no buyer/seller role selection.
4. Confirm the real administrator reaches the admin dashboard.
5. Confirm an ordinary user cannot access `/admin`.
6. Test public profiles, reviews, messaging, escrow and recycling.

Seeded sample marketplace records may remain in the existing DynamoDB state, but `.local` demo identities are not created in Cognito and cannot sign in. Removing existing sample records is a separate data-cleanup operation and should only be done after backing up the table.
