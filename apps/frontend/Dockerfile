FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --include=dev
COPY . .
RUN npm run build -w @app/frontend
CMD ["npm","run","start","-w","@app/frontend"]
