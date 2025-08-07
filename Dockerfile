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

EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\n\
# Replace placeholders in JS files\n\
find /app/dist -name "*.js" -exec sed -i "s/PLACEHOLDER_SUPABASE_URL/$VITE_SUPABASE_URL/g" {} \\;\n\
find /app/dist -name "*.js" -exec sed -i "s/PLACEHOLDER_SUPABASE_KEY/$VITE_SUPABASE_ANON_KEY/g" {} \\;\n\
find /app/dist -name "*.js" -exec sed -i "s/PLACEHOLDER_API_URL/$VITE_API_URL/g" {} \\;\n\
find /app/dist -name "*.js" -exec sed -i "s/PLACEHOLDER_TTS_ENGINE/$VITE_TTS_ENGINE/g" {} \\;\n\
# Start server\n\
exec node server/index.js' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]