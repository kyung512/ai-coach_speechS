# Stage 1: Frontend Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# from claude
# Build arguments for frontend environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL
ARG VITE_TTS_ENGINE

# Set environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_TTS_ENGINE=$VITE_TTS_ENGINE
# end of claude

RUN npm run build

# Verify build output
RUN echo "Build complete - checking files:" && ls -la dist/ && echo "vite.svg present:" && ls -la dist/vite.svg

# Stage 2: Backend & Final Image
FROM node:18-alpine AS runner

# This is where we handle the backend dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

# Now change back to the root of the app
WORKDIR /app
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# COPY server/gcloud-key.json ./gcloud-key.json
# ENV GOOGLE_APPLICATION_CREDENTIALS="/app/server/gcloud-key.json"

RUN echo "Files copied to runner stage:" && ls -la dist/ && echo "vite.svg in runner:" && ls -la dist/vite.svg || echo "vite.svg missing!"

# Create directory for secrets
RUN mkdir -p /app/server/secrets

# Expose the port your server will listen on
EXPOSE 3000

# Set the command to start the backend server
CMD ["node", "server/index.js"]