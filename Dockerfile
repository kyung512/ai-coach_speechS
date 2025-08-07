FROM node:20-alpine

WORKDIR /app

# Copy root package files and install frontend dependencies
COPY package*.json ./
RUN npm ci

# Copy server package files and install server dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

# Go back to app root
WORKDIR /app

# Copy all source code
COPY . .

# Build with placeholder values
ENV VITE_SUPABASE_URL="PLACEHOLDER_SUPABASE_URL"
ENV VITE_SUPABASE_ANON_KEY="PLACEHOLDER_SUPABASE_KEY" 
ENV VITE_API_URL="PLACEHOLDER_API_URL"
ENV VITE_TTS_ENGINE="PLACEHOLDER_TTS_ENGINE"

RUN npm run build

# Copy and make the startup script executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]