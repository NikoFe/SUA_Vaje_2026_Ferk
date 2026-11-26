
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

EXPOSE 3010

# Start the server
CMD ["npm", "run", "dev"]