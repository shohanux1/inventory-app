# POS Backend with Socket.io

## Features
- **Supabase-compatible API** - Easy migration from Supabase
- **Real-time updates** via Socket.io
- **Docker support** for easy deployment
- **PostgreSQL** database with Prisma ORM
- **JWT authentication**

## Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Development without Docker

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Start dev server
npm run dev
```

## API Endpoints (Supabase Compatible)

- `POST /auth/signup` - Register user
- `POST /auth/signin` - Login
- `GET /rest/v1/products` - Get products
- `GET /rest/v1/customers` - Get customers
- `POST /rest/v1/sales` - Create sale
- `GET /rest/v1/inventory` - Get inventory

## Socket.io Events

### Client → Server
- `inventory:update` - Update stock levels
- `sale:new` - New sale notification
- `join:store` - Join store room

### Server → Client
- `inventory:changed` - Stock level changed
- `sale:created` - New sale created
- `alert:low-stock` - Low stock warning

## Migration from Supabase

In your React Native app, replace:
```javascript
import { supabase } from '../lib/supabase';
```

With:
```javascript
import { api } from '../lib/api'; // Your new backend API
```

The API structure remains the same!