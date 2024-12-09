FROM ghcr.io/astral-sh/uv AS uv

FROM docker.io/python:3.13-bookworm AS python
WORKDIR /app
COPY uv.lock pyproject.toml .
RUN --mount=type=cache,target=/cache \
	--mount=type=bind,from=uv,source=/uv,target=/uv \
	 /uv sync --no-dev --locked --no-install-project
COPY . .
RUN  \
	# we use a cache --mount to reuse the uv cache across builds
	--mount=type=cache,target=/root/.cache/uv \
	# we use a bind --mount to use the uv binary from the uv stage
	--mount=type=bind,from=uv,source=/uv,target=/uv \
	/uv sync --no-dev --locked
ENV GRADIO_SERVER_NAME="0.0.0.0"
EXPOSE 7860
CMD ["/app/.venv/bin/python", "main.py"]
