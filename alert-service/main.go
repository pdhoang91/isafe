// alert-service/main.go

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sfreiberg/gotwilio"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Alert struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Similarity   float64   `json:"similarity"`
	AlertMessage string    `json:"alert_message"`
	FaceSnapshot string    `json:"face_snapshot"` // Base64 string
	Timestamp    time.Time `json:"timestamp"`
	Status       string    `json:"status"`
}

var db *gorm.DB
var twilioClient *gotwilio.Twilio
var sesClient *ses.Client
var emailSender string
var emailRecipient string

func main() {

	os.Setenv("DB_HOST", "localhost")
	os.Setenv("DB_PORT", "5433")
	os.Setenv("DB_USER", "postgres")
	os.Setenv("DB_PASSWORD", "postgres")
	os.Setenv("DB_NAME", "postgres")

	// Kết nối tới PostgreSQL
	//dsn := "host=localhost user=postgres password=postgres dbname=postgres port=5433 sslmode=disable TimeZone=Asia/Ho_Chi_Minh"
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Ho_Chi_Minh",
		host, user, password, dbname, port)

	fmt.Println("dsn", dsn)
	//database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database!")
	}

	// Tự động migrate schema
	db.AutoMigrate(&Alert{})

	// Cấu hình Twilio
	twilioClient = gotwilio.NewTwilioClient("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN")

	// Cấu hình AWS SES
	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("AWS_REGION"),
	)
	if err != nil {
		panic("Failed to load AWS configuration")
	}
	sesClient = ses.NewFromConfig(awsCfg)

	emailSender = "EMAIL_SENDER"       // Lấy từ biến môi trường
	emailRecipient = "EMAIL_RECIPIENT" // Lấy từ biến môi trường

	router := gin.Default()

	configCors := cors.Config{
		AllowOrigins:     []string{"http://202.92.6.77:3000", "http://localhost:3000", "https://insight.io.vn"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	router.Use(cors.New(configCors))

	router.POST("/send_alert", sendAlertHandler)

	router.Run(":8081")
}
func sendAlertHandler(c *gin.Context) {
	var req struct {
		Similarity   float64 `json:"similarity"`
		AlertMessage string  `json:"alert_message"`
		FaceSnapshot string  `json:"face_snapshot"` // Base64 string
		Timestamp    string  `json:"timestamp"`     // ISO format string
		Status       string  `json:"status"`        // e.g., "unrecognized"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if req.AlertMessage == "" || req.FaceSnapshot == "" || req.Timestamp == "" || req.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	// Parse timestamp
	parsedTime, err := time.Parse(time.RFC3339, req.Timestamp)
	if err != nil {
		log.Printf("Error parsing timestamp: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid timestamp format"})
		return
	}

	alert := Alert{
		Similarity:   req.Similarity,
		AlertMessage: req.AlertMessage,
		FaceSnapshot: req.FaceSnapshot,
		Timestamp:    parsedTime,
		Status:       req.Status,
	}

	if err := db.Create(&alert).Error; err != nil {
		log.Printf("Error creating alert in database: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create alert"})
		return
	}

	// Send SMS via Twilio
	twilioPhoneNumber := os.Getenv("TWILIO_PHONE_NUMBER")
	recipientPhoneNumber := os.Getenv("RECIPIENT_PHONE_NUMBER")
	if twilioPhoneNumber == "" || recipientPhoneNumber == "" {
		log.Printf("Twilio phone numbers are not set")
	} else {
		_, _, err := twilioClient.SendSMS(twilioPhoneNumber, recipientPhoneNumber, alert.AlertMessage, "", "")
		if err != nil {
			log.Printf("Error sending SMS: %v", err)
		}
	}

	// Send Email via AWS SES
	err = sendEmail(alert.AlertMessage)
	if err != nil {
		log.Printf("Error sending email: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"status": "Alert sent"})
}

func sendEmail(message string) error {
	//input := &ses.SendEmailInput{
	//	Destination: &ses.Destination{
	//		ToAddresses: []string{emailRecipient},
	//	},
	//	Message: &ses.Message{
	//		Body: &ses.Body{
	//			Text: &ses.Content{
	//				Charset: aws.String("UTF-8"),
	//				Data:    aws.String(message),
	//			},
	//		},
	//		Subject: &ses.Content{
	//			Charset: aws.String("UTF-8"),
	//			Data:    aws.String("Security Alert"),
	//		},
	//	},
	//	Source: aws.String(emailSender),
	//}
	//
	//_, err := sesClient.SendEmail(context.TODO(), input)
	_, err := sesClient.SendEmail(context.TODO(), nil)
	if err != nil {
		return err
	}
	return nil
}
