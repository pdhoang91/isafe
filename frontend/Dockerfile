# frontend-nextjs/Dockerfile

# Stage 1: Build the Next.js app
FROM node:16-alpine AS builder

WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package.json package-lock.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép mã nguồn
COPY . .

# Xây dựng ứng dụng
RUN npm run build

# Stage 2: Serve the Next.js app with a lightweight web server
FROM node:16-alpine

WORKDIR /app

# Sao chép dependencies từ stage builder
COPY package.json package-lock.json ./
RUN npm install --production

# Sao chép build output từ stage builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./package.json

# Expose cổng mà ứng dụng sẽ chạy
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]
