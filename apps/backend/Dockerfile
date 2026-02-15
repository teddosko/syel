FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run prisma:generate -w @app/backend && npm run build -w @pkg/shared && npm run build -w @app/backend
CMD ["sh","-c","npm run prisma:migrate -w @app/backend && npm run seed -w @app/backend || true && npm run start -w @app/backend"]
