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
EXPOSE 8080
CMD [ "npm", "run", "serve" ]

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
