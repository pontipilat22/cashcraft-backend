# RAILWAY BACKEND BUILD - ROOT LEVEL
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install ALL dependencies including dev for TypeScript build
RUN npm ci

# Debug: Check TypeScript installation
RUN npm list typescript
RUN npx tsc --version

# Copy backend source code
COPY backend/ ./

# Build TypeScript using npx to ensure tsc is available
RUN npx tsc

# Make start script executable
RUN chmod +x start.sh

# Create user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Graceful shutdown
STOPSIGNAL SIGTERM

# Start application
CMD ["./start.sh"]
