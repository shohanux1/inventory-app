FROM node:20-alpine

# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript (for production)
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"]