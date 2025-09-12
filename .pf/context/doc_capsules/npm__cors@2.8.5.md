# cors@2.8.5 (npm)

## Quick Start

```sh
$ npm install cors
```

## Examples

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

app.use(cors())

app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

```

## 📄 Full Documentation Available

**Full content**: `./.pf/context/docs/npm/cors@2.8.5/doc.md`
**Size**: 265 lines

## Source

- URL: https://registry.npmjs.org/cors/2.8.5
- Fetched: 2025-09-10T20:25:31.008494