# Base Node.js image
FROM node:18

# Install prerequisites for Azure CLI
RUN apt-get update && apt-get install -y \
  curl \
  apt-transport-https \
  lsb-release \
  gnupg \
  openssh-client

# Install Microsoft signing key and repo for Azure CLI
RUN curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg && \
  install -o root -g root -m 644 microsoft.gpg /usr/share/keyrings/ && \
  AZ_REPO=$(lsb_release -cs) && \
  echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" > /etc/apt/sources.list.d/azure-cli.list

# Install Azure CLI
RUN apt-get update && apt-get install -y azure-cli && rm -rf /var/lib/apt/lists/* microsoft.gpg

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port (matches your app listening port)
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
