# build stage
FROM node:14.1-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# dev stage
FROM build-stage as dev-stage
RUN apk update && apk add bash
EXPOSE 8081
CMD [ "npm", "run", "serve" ]
