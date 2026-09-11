# 1. Use a version-matched Playwright image (matches the version in package.json)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# 2. Set the working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Ensure the browsers for THIS version of Playwright are installed
RUN npx playwright install chromium

# 6. Copy the rest of your code
COPY . .

# 7. Environment setup
ENV NODE_ENV=production

# 8. Entrypoint for the CLI
ENTRYPOINT ["node", "index.js"]
