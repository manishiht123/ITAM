FROM node:18

WORKDIR /app

# Copy package.json first
COPY package.json ./

# Force install dependencies explicitly
RUN npm install \
  sequelize \
  mysql2 \
  express \
  cors \
  dotenv \
  bcryptjs \
  jsonwebtoken

# Copy application code
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]

