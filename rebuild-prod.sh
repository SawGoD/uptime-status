#!/bin/bash

# Скрипт для деплоя на сервере
# Использование: ./rebuild-prod.sh

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Деплой Uptime Status ===${NC}"

# Остановка текущего контейнера
echo -e "${YELLOW}Остановка контейнера...${NC}"
docker-compose down

# Обновление версии
echo -e "${YELLOW}Обновление версии...${NC}"
if [ -f "scripts/update-version.js" ] && [ -f "package.json" ]; then
    node scripts/update-version.js
    echo -e "${GREEN}Версия обновлена${NC}"
else
    echo -e "${RED}Не найдены файлы для обновления версии${NC}"
fi

# Очистка старых образов
echo -e "${YELLOW}Очистка старых образов...${NC}"
docker rmi uptime-status 2>/dev/null
docker rmi $(docker images | grep uptime | awk '{print $3}') 2>/dev/null

# Сборка нового образа
echo -e "${YELLOW}Сборка нового образа...${NC}"
docker build -t uptime-status . --no-cache

# Запуск контейнера
echo -e "${YELLOW}Запуск контейнера...${NC}"
docker-compose up -d

echo -e "${GREEN}✅ Деплой завершен!${NC}"
echo -e "${GREEN}Приложение запущено на порту 34481${NC}"

# Показать статус
echo -e "${YELLOW}Статус контейнера:${NC}"
docker ps | grep uptime-status 