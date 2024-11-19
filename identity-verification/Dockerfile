FROM golang:1.23.0-alpine

WORKDIR /app

# Sao chép go.mod và go.sum để tải các dependencies
COPY go.mod go.sum ./
RUN go mod download

# Sao chép mã nguồn
COPY . .

# Build ứng dụng
RUN go build -o main .

# Expose cổng
EXPOSE 8080

# Chạy ứng dụng
CMD ["./main"]
