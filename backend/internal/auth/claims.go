package auth

func UserID(claims map[string]interface{}) string {
	if claims == nil {
		return ""
	}
	sub, _ := claims["sub"].(string)
	return sub
}

func Email(claims map[string]interface{}) string {
	if claims == nil {
		return ""
	}
	email, _ := claims["email"].(string)
	return email
}

func ExtractClaims(authorizer map[string]interface{}) map[string]interface{} {
	if authorizer == nil {
		return nil
	}
	jwtRaw, ok := authorizer["jwt"]
	if !ok {
		return nil
	}
	jwtMap, ok := jwtRaw.(map[string]interface{})
	if !ok {
		return nil
	}
	claimsRaw, ok := jwtMap["claims"]
	if !ok {
		return nil
	}
	claims, _ := claimsRaw.(map[string]interface{})
	return claims
}
