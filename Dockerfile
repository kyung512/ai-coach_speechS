# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build with placeholder values
ENV VITE_SUPABASE_URL="PLACEHOLDER_SUPABASE_URL"
ENV VITE_SUPABASE_ANON_KEY="PLACEHOLDER_SUPABASE_KEY" 
ENV VITE_API_URL="PLACEHOLDER_API_URL"
ENV VITE_TTS_ENGINE="PLACEHOLDER_TTS_ENGINE"

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Copy and make the startup script executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]