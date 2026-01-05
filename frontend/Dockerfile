FROM node:18.20.8

WORKDIR /app

# Force npm to use ONLY local config
ENV NPM_CONFIG_USERCONFIG=/app/.npmrc
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

