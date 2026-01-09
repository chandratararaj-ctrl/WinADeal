# Build Stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Coolify might expect a different one, verify later, defaulting to 80 for now but we can adjust to 80 or 3000)
# We should probably match the others but let's stick to 80 for standard nginx unless configured otherwise.
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
