FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install
COPY . .
RUN npm run build -w @app/frontend
CMD ["npm","run","start","-w","@app/frontend"]
