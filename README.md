# y25 (stack branch)

## Requirements

- Node.js v20+
- (Optional) MySQL – not currently used. Current demo uses an in-memory data store.

## Getting Started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and open the `Items Demo` link or go directly to http://localhost:3000/items.

## Dynamic Routes & API

This branch adds a simple dynamic items feature with pages and API endpoints backed by an in-memory store (resets on restart).

### Pages

- `/items` – Index listing items and a form to create new ones (server action).
- `/items/[id]` – Dynamic page showing a single item.

### API Endpoints (App Router)

- `GET /api/items` – List items.
- `POST /api/items` – Create item. Body JSON: `{ "title": "string", "description": "string?" }`.
- `GET /api/items/:id` – Get single item.
- `PUT /api/items/:id` – Update item. Body JSON may include `title`, `description`.
- `DELETE /api/items/:id` – Delete item.

### Example Requests

```bash
# List
curl http://localhost:3000/api/items | jq

# Create
curl -X POST http://localhost:3000/api/items \
	-H 'Content-Type: application/json' \
	-d '{"title":"Test Item","description":"Hello"}' | jq

# Get one
curl http://localhost:3000/api/items/1 | jq

# Update
curl -X PUT http://localhost:3000/api/items/1 \
	-H 'Content-Type: application/json' \
	-d '{"description":"Updated description"}' | jq

# Delete
curl -X DELETE http://localhost:3000/api/items/1 -i
```

### Data Layer

Implemented in `lib/data/items.ts` with simple CRUD helpers.

## Next Steps (Ideas)

- Persist data (e.g. MySQL, Postgres, SQLite via Prisma).
- Input validation (Zod) & error boundaries.
- Add optimistic UI / client components for faster interactions.
- Pagination & search on `/items`.
- Unit tests for data layer + API route integration tests.
- Authentication & ownership for items.

## Reproducing Original Scaffold

Original scaffold was created with:

```bash
npx create-next-app@latest my-app --yes
```

Then modified as described above.
