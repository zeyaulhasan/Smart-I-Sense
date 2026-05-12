# Use the official Node.js 18 Alpine image for a small footprint
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the backend source code
COPY . .

# Expose the API port
EXPOSE 5000

# Expose the MQTT Broker port
EXPOSE 1883

# Define environment variables with defaults (can be overridden in docker-compose or run command)
ENV PORT=5000
ENV NODE_ENV=production
ENV MONGODB_URI=mongodb://mongo:27017/smart-i-sense
ENV JWT_SECRET=your_jwt_secret_key
ENV MQTT_BROKER_URL=mqtt://localhost:1883
ENV MQTT_USERNAME=admin
ENV MQTT_PASSWORD=smartisense
ENV CORS_ORIGIN=http://localhost:5173

# Start the application
CMD ["npm", "start"]
