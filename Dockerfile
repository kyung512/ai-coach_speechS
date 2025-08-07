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

# Build arguments from Render
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_TTS_ENGINE

# Build with placeholder values
ENV VITE_SUPABASE_URL="PLACEHOLDER_SUPABASE_URL"
ENV VITE_SUPABASE_ANON_KEY="PLACEHOLDER_SUPABASE_KEY" 
ENV VITE_API_URL="PLACEHOLDER_API_URL"
ENV VITE_TTS_ENGINE="PLACEHOLDER_TTS_ENGINE"

# Debug: Show what we're building with
RUN echo "Building with VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
RUN echo "Building with VITE_API_URL: $VITE_API_URL"

RUN npm run build

# Copy and make the startup script executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]