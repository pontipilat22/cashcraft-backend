# RAILWAY FORCE REBUILD - SIMPLE VERSION V5
FROM node:18-alpine

# CRITICAL: Install ALL dependencies including dev for TypeScript build
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Debug: Check TypeScript installation
RUN npm list typescript
RUN npx tsc --version

# Copy source code
COPY . .

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