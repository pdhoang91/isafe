# face-recognition/Dockerfile

# Sử dụng Python slim làm base image
FROM python:3.9-slim

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt các gói hệ thống cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Sao chép và cài đặt các gói Python
COPY requirements.txt .
RUN pip install --upgrade pip  # Cập nhật pip lên phiên bản mới nhất
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install flask-cors

# Sao chép mã nguồn vào container
COPY . .

# Expose cổng mà ứng dụng sẽ chạy
EXPOSE 5001

# Chạy ứng dụng
CMD ["python", "app.py"]
