FROM python:3.11-slim

RUN apt-get update && apt-get install -y stockfish wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN mkdir -p coach/openings_data && \
    for letter in a b c d e; do \
        wget -q -O coach/openings_data/$letter.tsv \
            https://raw.githubusercontent.com/lichess-org/chess-openings/master/$letter.tsv || true; \
    done

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "app.py"]