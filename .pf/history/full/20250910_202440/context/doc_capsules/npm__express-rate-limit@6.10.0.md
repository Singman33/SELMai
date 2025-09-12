# express-rate-limit@6.10.0 (npm)

## Quick Start

```javascript
import { rateLimit } from 'express-rate-limit'
```

## Examples

```ts
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
})
```

## 📄 Full Documentation Available

**Full content**: `./.pf/context/docs/npm/express-rate-limit@6.10.0/doc.md`
**Size**: 159 lines

## Source

- URL: https://registry.npmjs.org/express-rate-limit/6.10.0
- Fetched: 2025-09-10T20:23:40.781697