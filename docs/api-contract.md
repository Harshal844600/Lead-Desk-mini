# API Contract

LeadDesk Mini uses Supabase PostgreSQL and TanStack Start Server Functions to handle backend logic. We have mapped the core database and server operations as REST-like boundaries.

---

## 1. Create Lead

**Purpose**: Submit a new inbound lead from the public landing page.

- **Method**: `POST` (Server Function / RPC)
- **URL**: `/api/public/leads` (or `fetchLeads` via TanStack Start `createServerFn`)
- **Access**: Public (`anon` Role allowed)

### Request Body

```json
{
  "name": "Ada Lovelace",
  "email": "ada@company.com",
  "budget": "$5k-$25k",
  "message": "We need a complete overhaul of our data processing engine by Q4."
}
```

### Example Response (Success)

- **HTTP Status**: `200 OK`
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Ada Lovelace",
  "email": "ada@company.com",
  "budget": "$5k-$25k",
  "message": "We need a complete overhaul of our data processing engine by Q4.",
  "status": "New",
  "created_at": "2026-07-25T14:30:00.000Z",
  "updated_at": "2026-07-25T14:30:00.000Z"
}
```

### Error Responses

- **HTTP Status**: `400 Bad Request` (Validation Error)
```json
{
  "error": {
    "name": ["Name must be at least 2 characters"],
    "email": ["Enter a valid email"]
  }
}
```
- **HTTP Status**: `500 Internal Server Error` (Database Error)
```json
{
  "error": "Failed to create lead due to an internal server error."
}
```

---

## 2. Get Leads (Search & List)

**Purpose**: Retrieve all leads, optionally filtering by a search term.

- **Method**: `GET` (Server Function)
- **URL**: `/api/admin/leads?search={term}`
- **Access**: Protected (`authenticated` Role required via RLS)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | String | No | A query string to filter leads by name or email. |

### Example Request
`GET /api/admin/leads?search=Lovelace`

### Example Response (Success)

- **HTTP Status**: `200 OK`
```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Ada Lovelace",
    "email": "ada@company.com",
    "budget": "$5k-$25k",
    "message": "We need a complete overhaul of our data processing engine by Q4.",
    "status": "New",
    "created_at": "2026-07-25T14:30:00.000Z",
    "updated_at": "2026-07-25T14:30:00.000Z"
  }
]
```

### Error Responses
- **HTTP Status**: `401 Unauthorized` (User not authenticated)
```json
{
  "error": "You must be logged in to view leads."
}
```

---

## 3. Update Lead Status

**Purpose**: Update the lifecycle status of an existing lead.

- **Method**: `PATCH` / `PUT` (Server Function)
- **URL**: `/api/admin/leads/{id}/status`
- **Access**: Protected (`authenticated` Role required via RLS)

### Request Body

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "Contacted"
}
```

### Example Response (Success)

- **HTTP Status**: `200 OK`
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "Contacted",
  "updated_at": "2026-07-25T14:35:00.000Z"
}
```

### Error Responses
- **HTTP Status**: `400 Bad Request` (Invalid Status Enum)
```json
{
  "error": "Invalid status value provided."
}
```
- **HTTP Status**: `404 Not Found` (Lead does not exist)
```json
{
  "error": "Lead not found."
}
```
