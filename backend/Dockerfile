FROM node:16.14.0-slim

WORKDIR /home/node/app
COPY package*.json ./
COPY knexfile.* ./
COPY migrations ./migrations/
COPY seeds ./seeds/
COPY dist ./dist/

RUN npm install --production

EXPOSE 3000
CMD ["npm", "start"]
