# Onboarding

The Onboarding tools enable in-session account creation and authentication without
requiring a browser or external registration flow. An AI agent can create a new Merx
account, receive an API key, and begin trading resources -- all within a single
conversation.

This is designed for agent-first workflows where the user may not have a pre-existing
Merx account. The `create_account` tool handles registration and immediately returns
a usable API key and deposit address. The `login` tool authenticates an existing account
and sets the API key for the current session. Both tools store the API key in the
session context so subsequent authenticated tools (trading, balance, orders) work
without additional configuration.

---

## create_account

Create a new Merx account with email and password. Returns an API key, deposit address,
and account ID. The API key is automatically set for the current session, enabling
immediate use of all authenticated tools.

**Auth:** none (this tool creates credentials)

**Input schema:**
```json
{
  "email": {
    "type": "string",
    "required": true,
    "description": "Email address for the account."
  },
  "password": {
    "type": "string",
    "required": true,
    "description": "Password (min 8 characters)."
  }
}
```

**Example input:**
```json
{
  "email": "agent@example.com",
  "password": "s3cur3P@ssw0rd"
}
```

**Example output:**
```
Account Created:

Email:           agent@example.com
Account ID:      usr_a1b2c3d4e5f6
API key:         merx_sk_7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w

Deposit address: TKVSaJQEkWYv5oCbQxPzL7adx1S4MRvSPa
Network:         TRON (TRX only)
Min deposit:     1.000 TRX

API key has been set for this session. You can now use:
  - create_order
  - get_balance
  - list_orders
  - ensure_resources
  - All other authenticated tools

Next step: Deposit TRX to the address above to fund your account.
```

**Related tools:** login, set_api_key, get_deposit_info, get_balance

---

## login

Log in to an existing Merx account using email and password. Returns and sets the API
key for the current session. Use this when the user already has an account but has not
yet provided an API key.

**Auth:** none (this tool retrieves credentials)

**Input schema:**
```json
{
  "email": {
    "type": "string",
    "required": true,
    "description": "Email address."
  },
  "password": {
    "type": "string",
    "required": true,
    "description": "Password."
  }
}
```

**Example input:**
```json
{
  "email": "agent@example.com",
  "password": "s3cur3P@ssw0rd"
}
```

**Example output:**
```
Login Successful:

Email:       agent@example.com
Account ID:  usr_a1b2c3d4e5f6
API key:     merx_sk_7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w
Balance:     84.200 TRX

API key has been set for this session. All authenticated tools are now available.
```

**Related tools:** create_account, set_api_key, get_balance
