set export
IMG := "ghcr.io/agile-athletes/ai-playground"

image:
	podman build -t $IMG .

up:
	podman run -p 7860:7860 $IMG
