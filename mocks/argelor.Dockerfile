FROM node:22.15

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .
COPY mocks/argelor.mock.ts .

RUN npm install express @types/express ts-node typescript

CMD ["npx", "ts-node", "argelor.mock.ts"]