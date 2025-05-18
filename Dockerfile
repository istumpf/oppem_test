FROM node:22.15

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g ts-node-dev

CMD ["ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]