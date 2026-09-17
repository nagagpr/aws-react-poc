# ---------- Stage 1: build the React application ----------
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first so this layer is cached between builds
COPY package*.json ./

RUN npm ci

# Copy the rest of the source and create the production build (dist/)
COPY . .

RUN npm run build


# ---------- Stage 2: serve the static build with Nginx ----------
FROM nginx:alpine

# Copy the production build into the default Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
