# envcast

> A CLI tool that validates and documents environment variables across multiple `.env` files with schema enforcement.

---

## Installation

```bash
npm install -g envcast
```

---

## Usage

Define a schema in `envcast.config.ts`:

```ts
import { defineSchema } from "envcast";

export default defineSchema({
  DATABASE_URL: { type: "string", required: true },
  PORT: { type: "number", default: 3000 },
  DEBUG: { type: "boolean", required: false },
});
```

Then run the CLI against your `.env` files:

```bash
envcast validate --env .env,.env.production
```

To generate documentation from your schema:

```bash
envcast docs --output ENV_DOCS.md
```

### Example Output

```
✔ DATABASE_URL   — valid
✔ PORT           — valid (default applied)
✖ API_SECRET     — missing required variable
```

---

## Commands

| Command            | Description                              |
|--------------------|------------------------------------------|
| `validate`         | Validate `.env` files against the schema |
| `docs`             | Generate markdown documentation          |
| `check`            | Dry-run check with exit code support     |

---

## License

[MIT](./LICENSE)