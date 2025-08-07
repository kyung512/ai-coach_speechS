FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Debug: Print the values from environment
RUN echo "ENV VITE_SUPABASE_URL: $VITE_SUPABASE_URL"
RUN echo "ENV VITE_API_URL: $VITE_API_URL"

# Build the app (Vite will pick up VITE_ env vars automatically)
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy built app and server code
COPY --from=0 /app/dist ./dist
COPY --from=0 /app/server ./server
COPY --from=0 /app/package*.json ./

RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "start"]