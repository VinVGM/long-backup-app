package response

import (
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func headers() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	}
}

func JSON(statusCode int, body any) events.APIGatewayProxyResponse {
	b, err := json.Marshal(body)
	if err != nil {
		return Error(500, "Internal server error")
	}
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    headers(),
		Body:       string(b),
	}
}

func Error(statusCode int, message string) events.APIGatewayProxyResponse {
	return JSON(statusCode, map[string]string{"error": message})
}

func BadRequest(message string) events.APIGatewayProxyResponse {
	return Error(400, message)
}

func Unauthorized(message string) events.APIGatewayProxyResponse {
	return Error(401, message)
}

func Forbidden(message string) events.APIGatewayProxyResponse {
	return Error(403, message)
}

func NotFound(message string) events.APIGatewayProxyResponse {
	return Error(404, message)
}

func ServerError(err error) events.APIGatewayProxyResponse {
	return Error(500, "Internal server error")
}

func Options() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 204,
		Headers:    headers(),
	}
}
