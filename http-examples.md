# API Test Examples

Replace `<TOKEN>` with a Clerk session JWT from the frontend.

```http
GET http://localhost:5000/health
```

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer <TOKEN>
```

```http
POST http://localhost:5000/api/auth/sync
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "Demo Trainer",
  "email": "trainer@test.com",
  "role": "TRAINER",
  "institutionName": "SkillBridge Demo Institution"
}
```

```http
POST http://localhost:5000/api/batches
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "Web Development Batch A"
}
```
