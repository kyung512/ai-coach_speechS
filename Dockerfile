FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with dummy values (we'll replace at runtime)
ENV VITE_SUPABASE_URL="PLACEHOLDER_SUPABASE_URL"
ENV VITE_SUPABASE_ANON_KEY="PLACEHOLDER_SUPABASE_KEY" 
ENV VITE_API_URL="PLACEHOLDER_API_URL"
ENV VITE_TTS_ENGINE="PLACEHOLDER_TTS_ENGINE"

RUN npm run build

RUN npm ci --only=production

# Copy and make the startup script executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]