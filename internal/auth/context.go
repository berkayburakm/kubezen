package auth

import "github.com/gin-gonic/gin"

const sessionKey = "kz_session"

func SetSession(c *gin.Context, s Session) {
	c.Set(sessionKey, s)
}

func GetSession(c *gin.Context) (Session, bool) {
	val, ok := c.Get(sessionKey)
	if !ok {
		return Session{}, false
	}
	session, ok := val.(Session)
	return session, ok
}
