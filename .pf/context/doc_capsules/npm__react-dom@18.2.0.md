# react-dom@18.2.0 (npm)

## Quick Start

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}
```

## Top APIs

- `HelloMessage({ name })`

## Examples

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

## 📄 Full Documentation Available

**Full content**: `./.pf/context/docs/npm/react-dom@18.2.0/doc.md`
**Size**: 86 lines

## Source

- URL: https://registry.npmjs.org/react-dom/18.2.0
- Fetched: 2025-09-10T20:25:37.594863