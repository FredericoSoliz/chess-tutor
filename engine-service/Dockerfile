FROM python:3.11-slim

RUN apt-get update && apt-get install -y stockfish wget curl gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://tailscale.com/install.sh | sh

WORKDIR /app

COPY . .

RUN mkdir -p coach/openings_data && \
    for letter in a b c d e; do \
        wget -q -O coach/openings_data/$letter.tsv \
            https://raw.githubusercontent.com/lichess-org/chess-openings/master/$letter.tsv || true; \
    done

RUN pip install --no-cache-dir -r requirements.txt

RUN chmod +x /app/tailscale-entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/app/tailscale-entrypoint.sh"]
CMD ["python", "app.py"]
