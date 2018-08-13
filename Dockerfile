FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN npm run-script build

EXPOSE 4000
CMD [ "node", "/usr/src/app/dist/index.js" ]