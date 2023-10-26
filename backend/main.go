package main

import (
	"net/http"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

type Model struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"create_at"`
	UpdatedAt time.Time `json:"update_at"`
}

type ImgPreview struct {
	Model
	Dx        int    `json:"dx"`
	Dy        int    `json:"dy"`
	Dw        int    `json:"dw"`
	Dh        int    `json:"dh"`
	Imgbase64 string `json:"imgbase64"`
	// ShowMask  bool   `json:"showMask"`
}

func Cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		origin := c.Request.Header.Get("Origin") //请求头部
		if origin != "" {
			// 当Access-Control-Allow-Credentials为true时，将*替换为指定的域名
			c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE")
			c.Header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-Extra-Header, Content-Type, Accept, Authorization")
			c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type")
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Max-Age", "86400") // 可选
			c.Set("content-type", "application/json")   // 可选
		}

		if method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
		}

		c.Next()
	}
}

func main() {
	server := InitWebServer()

	db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// Mirgat
	// db.AutoMigrate(&Product{})
	db.AutoMigrate(&ImgPreview{})

	server.Use(Cors())

	// server.Use(cors.New(cors.Config{
	// 	AllowCredentials: true,
	// 	AllowedHeaders:   []string{"Content-Type"}, // 允许带上的请求头
	// 	AllowOriginFunc: func(origin string) bool { // 允许哪些来源
	// 		return true
	// 		// return strings.HasPrefix(origin, "http://localhost:3000")
	// 	},
	// 	MaxAge: 12 * time.Hour,
	// }))

	server.GET("/test", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"message": "ok",
		})
	})

	server.GET("/retire_mask/:jobId", func(ctx *gin.Context) {
		jobId := ctx.Param("jobId")

		var imgPrev ImgPreview
		db.First(&imgPrev, "ID = ?", jobId)

		ctx.JSON(200, gin.H{
			"code":    0,
			"message": "ok",
			"data":    imgPrev,
		})
	})

	server.POST("/save_mask", func(ctx *gin.Context) {
		var imgPrev ImgPreview
		if err := ctx.BindJSON(&imgPrev); err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		}

		db.Create(&imgPrev)

		ctx.JSON(200, gin.H{
			"code":    0,
			"message": "ok",
			"data":    imgPrev,
		})
	})

	server.Run(":8080")
}
