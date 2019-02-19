# install node.js
FROM node

# install Vue CLI
RUN npm install -g @vue/cli

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install
RUN npm audit fix

# Bundle app source
COPY . .

RUN npm run build

EXPOSE 8080
CMD [ "npm", "run", "serve" ]
