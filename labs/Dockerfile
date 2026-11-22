FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 gdb binutils strace ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /course
CMD ["bash"]
