package version

import "runtime"

var (
	Version   = "0.1.0"
	Commit    = "dev"
	BuildDate = ""
)

func Info() map[string]string {
	return map[string]string{
		"version":    Version,
		"commit":     Commit,
		"buildDate":  BuildDate,
		"goVersion":  runtime.Version(),
		"platform":   runtime.GOOS + "/" + runtime.GOARCH,
		"serverName": "kubezen",
	}
}
