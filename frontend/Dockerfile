FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Start React dev server (development mode)
CMD ["npm", "start"]
EXPOSE 3000
