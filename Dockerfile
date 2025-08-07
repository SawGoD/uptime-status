# Этап 1: Сборка приложения
FROM node:18-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (включая dev для скриптов)
RUN npm ci

# Копируем исходный код
COPY . .

# Обновляем версию для кэш-бастинга
RUN node scripts/update-version.js

# Устанавливаем публичный путь для React
ENV PUBLIC_URL=/uptime

# Собираем приложение
RUN npm run build

# Этап 2: Запуск с nginx
FROM nginx:alpine

# Копируем собранное приложение в nginx
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"] 