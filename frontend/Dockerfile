# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Copy source and build
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN echo ">>> DEBUG REACT_APP_BACKEND_URL is: [$REACT_APP_BACKEND_URL]"
RUN yarn build

# --- Runtime stage ---
FROM node:20-slim
WORKDIR /app
RUN yarn global add serve
COPY --from=build /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
