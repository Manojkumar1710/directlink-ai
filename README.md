# DirectLink AI — Listings/API service (Member 4)

Backend service owning the `Listing` and `Product` resources, per TDD
Section 4.3 / Section 6. Built to run standalone right now, with clean
seams to plug in real Auth (Member 3) and a real database (Member 5)
the moment they're ready.

## Quick start

```bash
npm install
npm run dev        # nodemon, auto-restarts on file changes
# or
npm start           # plain node
```

Server runs on `http://localhost:4000` by default (`PORT` env var to change).

## Run tests

```bash
npm test
```

11 tests cover product listing, listing creation/validation, search filters,
detail view, ownership-checked status updates, and contact logging.

## Endpoints (TDD Section 6)

| Endpoint                                | Method | Notes                                                      |
| --------------------------------------- | ------ | ---------------------------------------------------------- |
| `/products`                             | GET    | Crop/product master list                                   |
| `/listings`                             | POST   | Farmer creates a listing (auth required)                   |
| `/listings?product=&region=&price_max=` | GET    | Buyer search/filter                                        |
| `/listings/:id`                         | GET    | Listing detail, includes product info                      |
| `/listings/:id`                         | PATCH  | Farmer updates status — only the owning farmer can do this |
| `/listings/:id/contact`                 | POST   | Buyer logs a call/whatsapp contact attempt                 |

## Faking a logged-in user (until real auth lands)

Every request goes through `middleware/fakeAuth.js`, which reads two headers:

```bash
curl -X POST http://localhost:4000/listings \
  -H "Content-Type: application/json" \
  -H "x-user-id: farmer-1" \
  -H "x-user-role: farmer" \
  -d '{"product_id":"p1","region":"Vijayawada","quantity":50,"unit":"kg","asking_price":22}'
```

If you omit the headers, it defaults to `farmer-1`. This is enough to build
and test every endpoint before Member 3 delivers real OTP auth.

## Project layout

```
app.js                    Express app, middleware wiring, error handler
server.js                 Starts the HTTP listener
routes/                   Route → controller mapping (thin)
controllers/               Request/response handling only
services/listingService.js Business logic (ownership checks, product lookup)
services/validators.js     Zod request schemas
data/repository.js         ALL data access goes through here
data/mockData.js           In-memory seed data (stand-in for Postgres)
middleware/fakeAuth.js     TEMP — replace with Member 3's real auth
middleware/validate.js     Generic Zod validation middleware
tests/                     Supertest integration tests
```

## How to swap in the real pieces later

**Real Auth (Member 3):** replace the body of `middleware/fakeAuth.js` with
whatever verifies their session token and sets `req.user = { id, role }`.
Nothing downstream changes — every controller already expects that shape.

**Real Database (Member 5):**
## PostgreSQL Database — Member 5

The Listings/API service is connected to a real **PostgreSQL 15** database using Docker.

### Database Tables

* `users` — Farmer and buyer accounts
* `farmer_profiles` — Farmer details
* `buyer_profiles` — Buyer details
* `products` — Product/crop information
* `price_references` — Regional price references
* `listings` — Farmer product listings
* `contact_logs` — Buyer contact records

Database schema:

```text
database.sql
```

### Run Database

Start the API and PostgreSQL:

```bash
docker compose up -d
```

Check containers:

```bash
docker ps
```

### View Database

Open PostgreSQL:

```bash
docker exec -it directlink-db psql -U user -d urban_db
```

Show tables:

```sql
\dt
```

View listings:

```sql
SELECT * FROM listings;
```

View products:

```sql
SELECT * FROM products;
```

### Testing

The API is tested with the real PostgreSQL database.

```bash
docker compose exec api npm test
```

Current result:

```text
12 tests passed
```

All database queries are handled through:

```text
data/repository.js
```


**Pricing Service (whoever owns `GET /prices`):** not part of this module.
When it's ready, the Farmer module (frontend) calls it directly to
pre-fill `asking_price` before hitting `POST /listings` — no change needed
here.

## Deploying (per TDD Section 11)

Free tier on Render or Railway works fine for demo scale. Set `PORT` from
the platform's env var (already wired via `process.env.PORT`), and point
`DATABASE_URL` at the real Postgres instance once Member 5's schema is live.



