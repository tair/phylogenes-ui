# phylogenes-ui

> A Vue.js project

## Local Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run serve

# build for production with minification
npm run build
```

For detailed explanation on how things work, consult the [docs for vue-loader](http://vuejs.github.io/vue-loader).


## Docker Setup
> If you are using Docker setup, ignore the "Build Setup" listed above.

``` bash
# build the Docker image for the Vue JS app
docker build -t phylogenes/dockerize-vuejs-app .

# run our Vue.js app in a Docker container
docker run -it -p 8080:80 --rm --name phylogenes-app phylogenes/dockerize-vuejs-app
```
Visit the application at http://localhost:8080
