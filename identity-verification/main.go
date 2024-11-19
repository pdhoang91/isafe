package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// User là mô hình người dùng trong cơ sở dữ liệu
type User struct {
	ID            uint `gorm:"primaryKey"`
	Name          string
	FaceEmbedding pq.Float64Array `gorm:"type:float8[]"`
	Role          string
	LastSeen      time.Time
}

// Alert là mô hình cảnh báo trong cơ sở dữ liệu
type Alert struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Similarity   float64   `json:"similarity"`
	AlertMessage string    `json:"alert_message"`
	FaceSnapshot string    `json:"face_snapshot"` // Base64 string
	Timestamp    time.Time `json:"timestamp"`
	Status       string    `json:"status"`
}

// VerificationRequest là yêu cầu xác thực khuôn mặt
type VerificationRequest struct {
	Embedding []float64 `json:"embedding"`
}

// VerificationResponse là phản hồi sau khi xác thực khuôn mặt
type VerificationResponse struct {
	Match        bool    `json:"match"`
	User         User    `json:"user,omitempty"`
	Similarity   float64 `json:"similarity,omitempty"`
	AlertMessage string  `json:"alert_message,omitempty"`
}

var db *gorm.DB

func main() {
	// Thiết lập các biến môi trường (có thể được thiết lập bên ngoài trong thực tế)
	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5433")
	os.Setenv("DB_USER", "postgres")
	os.Setenv("DB_PASSWORD", "postgres")
	os.Setenv("DB_NAME", "postgres")

	// Lấy các biến môi trường cho kết nối cơ sở dữ liệu
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// Kiểm tra các biến môi trường
	if host == "" || port == "" || user == "" || password == "" || dbname == "" {
		log.Fatal("Database connection parameters are not set")
	}

	// Tạo chuỗi kết nối (DSN)
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Ho_Chi_Minh",
		host, user, password, dbname, port)

	log.Println("Connecting to database with DSN:", dsn)
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Tự động migrate schema
	if err := db.AutoMigrate(&User{}, &Alert{}); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	// Thiết lập router với CORS
	router := gin.Default()

	config := cors.Config{
		AllowOrigins:     []string{"http://202.92.6.77:3000", "http://localhost:3000", "https://insight.io.vn"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	router.Use(cors.New(config))

	// Định nghĩa các route
	router.POST("/verify_face", verifyFaceHandler)
	router.GET("/alerts", getAlertsHandler)
	router.POST("/add_user", addUserHandler)
	router.GET("/users", getUsersHandler) // Thêm API để lấy danh sách người dùng

	// Chạy server trên cổng 8080
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}

// verifyFaceHandler xử lý yêu cầu xác thực khuôn mặt
func verifyFaceHandler(c *gin.Context) {
	// Lấy hình ảnh từ yêu cầu client
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		log.Printf("Error retrieving image from request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image is required"})
		return
	}
	defer file.Close()

	// Đọc dữ liệu hình ảnh
	imageBytes, err := io.ReadAll(file)
	if err != nil {
		log.Printf("Error reading image data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image"})
		return
	}

	// Tạo một buffer để chứa dữ liệu multipart
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Thêm file hình ảnh vào multipart với trường 'image'
	part, err := writer.CreateFormFile("image", filepath.Base("upload.jpg"))
	if err != nil {
		log.Printf("Error creating form file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create form file"})
		return
	}

	_, err = part.Write(imageBytes)
	if err != nil {
		log.Printf("Error writing image to form file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write image to form"})
		return
	}

	// Kết thúc việc tạo multipart
	if err := writer.Close(); err != nil {
		log.Printf("Error closing multipart writer: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to close form writer"})
		return
	}

	// Gửi yêu cầu POST đến Flask service
	faceRecURL := "http://localhost:5001/process_image"
	resp, err := http.Post(faceRecURL, writer.FormDataContentType(), &requestBody)
	if err != nil {
		log.Printf("Error communicating with Face Recognition service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to communicate with Face Recognition service"})
		return
	}
	defer resp.Body.Close()

	// Xử lý phản hồi từ Flask
	bodyResp, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response from Face Recognition service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response from Face Recognition service"})
		return
	}

	var faceResp map[string]interface{}
	if err := json.Unmarshal(bodyResp, &faceResp); err != nil {
		log.Printf("Error unmarshalling JSON response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response from Face Recognition service"})
		return
	}

	if _, exists := faceResp["error"]; exists {
		log.Printf("Error from Face Recognition service: %v", faceResp["error"])
		c.JSON(http.StatusBadRequest, faceResp)
		return
	}

	// Xử lý embedding nhận được
	embeddingInterface, ok := faceResp["embedding"].([]interface{})
	if !ok || len(embeddingInterface) == 0 {
		log.Printf("Embedding not found or invalid in response: %v", faceResp)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Embedding not found in response"})
		return
	}

	// Chuyển []interface{} thành []float64
	var embeddingFloat []float64
	for _, v := range embeddingInterface {
		if num, ok := v.(float64); ok {
			embeddingFloat = append(embeddingFloat, num)
		} else {
			log.Printf("Invalid type in embedding: %v", v)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid embedding data"})
			return
		}
	}

	// So sánh với tất cả các embeddings trong cơ sở dữ liệu
	var users []User
	if err := db.Find(&users).Error; err != nil {
		log.Printf("Error fetching users from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	highestSimilarity := -1.0
	var matchedUser User

	for _, user := range users {
		similarity := cosineSimilarity(embeddingFloat, user.FaceEmbedding)
		if similarity > highestSimilarity {
			highestSimilarity = similarity
			matchedUser = user
		}
	}

	threshold := 0.7
	if highestSimilarity >= threshold {
		// Cập nhật LastSeen
		if err := db.Model(&matchedUser).Update("LastSeen", time.Now()).Error; err != nil {
			log.Printf("Error updating LastSeen: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update LastSeen"})
			return
		}

		c.JSON(http.StatusOK, VerificationResponse{
			Match:      true,
			User:       matchedUser,
			Similarity: highestSimilarity,
		})
	} else {
		// Gửi cảnh báo tới Alert Service
		alertURL := "http://localhost:8081/send_alert"

		alertData := map[string]interface{}{
			"similarity":    highestSimilarity,
			"alert_message": "Unrecognized face detected",
			"face_snapshot": base64.StdEncoding.EncodeToString(imageBytes), // Encode image to base64
			"timestamp":     time.Now().Format(time.RFC3339),               // ISO format
			"status":        "unrecognized",
		}
		alertBytes, err := json.Marshal(alertData)
		if err != nil {
			log.Printf("Error marshalling alert data: %v", err)
		}
		alertBody := bytes.NewBuffer(alertBytes)

		respAlert, err := http.Post(alertURL, "application/json", alertBody)
		if err != nil {
			log.Printf("Error sending alert: %v", err)
		} else {
			defer respAlert.Body.Close()
			log.Printf("Alert sent successfully with status: %s", respAlert.Status)
		}

		c.JSON(http.StatusOK, VerificationResponse{
			Match:        false,
			Similarity:   highestSimilarity,
			AlertMessage: "Unrecognized face detected",
		})
	}
}

// getAlertsHandler lấy danh sách cảnh báo từ cơ sở dữ liệu
func getAlertsHandler(c *gin.Context) {
	var alerts []Alert
	if err := db.Find(&alerts).Error; err != nil {
		log.Printf("Error fetching alerts from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, alerts)
}

// addUserHandler thêm người dùng mới vào cơ sở dữ liệu
func addUserHandler(c *gin.Context) {
	var req struct {
		Name         string `json:"name"`
		Role         string `json:"role"`
		FaceSnapshot string `json:"face_snapshot"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" || req.Role == "" || req.FaceSnapshot == "" {
		log.Printf("Missing fields in request: %+v", req)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing fields"})
		return
	}

	// Giải mã base64
	decodedImage, err := decodeBase64Image(req.FaceSnapshot)
	if err != nil {
		log.Printf("Error decoding base64 image: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid face_snapshot"})
		return
	}

	// Tạo multipart/form-data
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)
	part, err := writer.CreateFormFile("image", "capture.jpg")
	if err != nil {
		log.Printf("Error creating form file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create form file"})
		return
	}

	_, err = io.Copy(part, bytes.NewReader(decodedImage))
	if err != nil {
		log.Printf("Error copying image data to form file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to copy image data"})
		return
	}

	// Kết thúc việc tạo multipart
	if err := writer.Close(); err != nil {
		log.Printf("Error closing multipart writer: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to close form writer"})
		return
	}

	// Gửi ảnh tới face-recognition service
	faceRecURL := "http://localhost:5001/process_image" // Đảm bảo URL đúng
	log.Printf("Sending POST request to Face Recognition service: %s", faceRecURL)

	resp, err := http.Post(faceRecURL, writer.FormDataContentType(), &requestBody)
	if err != nil {
		log.Printf("Error communicating with Face Recognition service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to communicate with Face Recognition service"})
		return
	}
	defer resp.Body.Close()

	// Xử lý phản hồi từ Flask
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response from Face Recognition service: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response from Face Recognition service"})
		return
	}

	log.Printf("Response from Face Recognition service: %s", string(body))

	var faceResp map[string]interface{}
	if err := json.Unmarshal(body, &faceResp); err != nil {
		log.Printf("Error unmarshalling JSON response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid response from Face Recognition service"})
		return
	}

	if _, exists := faceResp["error"]; exists {
		log.Printf("Error from Face Recognition service: %v", faceResp["error"])
		c.JSON(http.StatusBadRequest, faceResp)
		return
	}

	embeddingInterface, ok := faceResp["embedding"].([]interface{})
	if !ok || len(embeddingInterface) == 0 {
		log.Printf("Embedding not found or invalid in response: %v", faceResp)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Embedding not found in response"})
		return
	}

	// Chuyển []interface{} thành []float64
	var embeddingFloat []float64
	for _, v := range embeddingInterface {
		if num, ok := v.(float64); ok {
			embeddingFloat = append(embeddingFloat, num)
		} else {
			log.Printf("Invalid type in embedding: %v", v)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid embedding data"})
			return
		}
	}

	log.Printf("Received embedding: %v", embeddingFloat)

	// Kiểm tra xem embedding đã tồn tại trong cơ sở dữ liệu hay chưa
	var existingUser User
	if err := db.Where("face_embedding = ?", pq.Array(embeddingFloat)).First(&existingUser).Error; err == nil {
		// Nếu đã tồn tại, trả về thông tin người dùng
		c.JSON(http.StatusOK, VerificationResponse{
			Match:      true,
			User:       existingUser,
			Similarity: 1.0,
		})
		return
	}

	// Nếu không tồn tại, thêm người dùng mới vào cơ sở dữ liệu
	newUser := User{
		Name:          req.Name,
		Role:          req.Role,
		FaceEmbedding: pq.Float64Array(embeddingFloat),
		LastSeen:      time.Now(),
	}

	if err := db.Create(&newUser).Error; err != nil {
		log.Printf("Error creating new user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("New user created: %+v", newUser)

	c.JSON(http.StatusOK, VerificationResponse{
		Match:      true,
		User:       newUser,
		Similarity: 1.0,
	})
}

// getUsersHandler lấy danh sách người dùng từ cơ sở dữ liệu
func getUsersHandler(c *gin.Context) {
	var users []User
	if err := db.Find(&users).Error; err != nil {
		log.Printf("Error fetching users from database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// decodeBase64Image giải mã hình ảnh từ chuỗi base64
func decodeBase64Image(encoded string) ([]byte, error) {
	// Xóa tiền tố nếu có (ví dụ: "data:image/png;base64,")
	if idx := strings.Index(encoded, ","); idx != -1 {
		encoded = encoded[idx+1:]
	}
	decoded, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, errors.New("invalid base64 encoding")
	}
	return decoded, nil
}

// cosineSimilarity tính độ tương tự cosine giữa hai vector
func cosineSimilarity(a, b pq.Float64Array) float64 {
	if len(a) != len(b) {
		return 0.0
	}
	dotProduct := 0.0
	normA := 0.0
	normB := 0.0
	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	if normA == 0 || normB == 0 {
		return 0.0
	}
	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB))
}
