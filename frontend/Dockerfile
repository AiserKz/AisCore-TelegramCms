FROM node:20-alpine AS build

WORKDIR /app

RUN npm install -g serve

COPY dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]