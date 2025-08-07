#!/bin/bash

# Скрипт для полной пересборки с версионированием
# Использование: ./rebuild_new.sh

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 🚀 Полная пересборка Uptime Status ===${NC}"

# Проверка необходимых файлов
if [ ! -f "scripts/update-version.js" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Не найдены файлы для обновления версии${NC}"
    exit 1
fi

# 1. Остановка и удаление контейнера
echo -e "${YELLOW}🛑 Остановка и удаление контейнера...${NC}"
docker-compose down
docker rm -f uptime-status 2>/dev/null

# 2. Полная очистка образов
echo -e "${YELLOW}🗑️  Полная очистка старых образов...${NC}"
# Удаляем основной образ
docker rmi uptime-status 2>/dev/null || true
# Удаляем все образы с тегом uptime-status
docker rmi $(docker images | grep "uptime-status" | awk '{print $3}') 2>/dev/null || true
# Удаляем dangling образы
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true

# 3. Обновление версии
echo -e "${YELLOW}📝 Обновление версии и кэша...${NC}"
node scripts/update-version.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при обновлении версии${NC}"
    exit 1
fi

# 4. Сборка нового образа
echo -e "${YELLOW}🔨 Сборка нового образа (полная пересборка)...${NC}"
docker build -t uptime-status . --no-cache --pull
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при сборке образа${NC}"
    exit 1
fi

# 5. Запуск контейнера
echo -e "${YELLOW}🚀 Запуск нового контейнера...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при запуске контейнера${NC}"
    exit 1
fi

# 6. Ожидание запуска
echo -e "${YELLOW}⏳ Ожидание запуска (5 сек)...${NC}"
sleep 5

# 7. Проверка статуса
echo -e "${GREEN}✅ Пересборка завершена!${NC}"
echo -e "${GREEN}📱 Приложение запущено на порту 34481${NC}"

# Показать статус
echo -e "${BLUE}📊 Статус контейнера:${NC}"
docker ps | head -1
docker ps | grep uptime-status

# Показать логи последних 10 строк
echo -e "${BLUE}📄 Последние логи:${NC}"
docker logs uptime-status --tail 10

# Показать информацию о версии
if [ -f "public/index.html" ]; then
    VERSION=$(grep -o 'config\.js?v=[^"]*' public/index.html | cut -d'=' -f2)
    echo -e "${GREEN}🔖 Версия: ${VERSION}${NC}"
fi

echo -e "${GREEN}🎉 Готово! Приложение доступно по адресу: http://localhost:34481/uptime/${NC}" 