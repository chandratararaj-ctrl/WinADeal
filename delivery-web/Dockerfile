# Build Stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install --include=dev

COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 5177 (matching nginx.conf)
EXPOSE 5177

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
