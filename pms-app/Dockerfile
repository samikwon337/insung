# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치 (package-lock.json 기반 재현 가능한 설치)
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사
COPY . .

# Firebase 환경변수 (빌드 시 NEXT_PUBLIC_* 변수는 번들에 포함됨)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_USE_EMULATOR=false

# 정적 빌드 (output: export → out/ 디렉토리 생성)
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve (nginx)
# ─────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

# 기본 nginx 설정 제거
RUN rm /etc/nginx/conf.d/default.conf

# SPA용 nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사 (out/ → nginx html 루트)
COPY --from=builder /app/out /usr/share/nginx/html

# Cloud Run은 PORT 환경변수로 포트를 주입함
# nginx는 envsubst로 PORT를 동적으로 적용
ENV PORT=8080

EXPOSE 8080

# nginx.conf의 $PORT를 실제 값으로 치환 후 실행
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
