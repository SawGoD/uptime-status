#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Название контейнера
CONTAINER_NAME="uptime-status"
IMAGE_NAME="uptime-status"
PORT="34481"

# Функция для обновления версии
update_version() {
    echo -e "${YELLOW}Обновление версии...${NC}"
    if [ -f "scripts/update-version.js" ] && [ -f "package.json" ]; then
        node scripts/update-version.js
        echo -e "${GREEN}Версия обновлена${NC}"
    else
        echo -e "${RED}Не найдены файлы для обновления версии${NC}"
    fi
}

case "$1" in
    build)
        echo -e "${YELLOW}Сборка Docker образа...${NC}"
        update_version
        docker build -t $IMAGE_NAME .
        ;;
    start)
        echo -e "${YELLOW}Запуск контейнера $CONTAINER_NAME...${NC}"
        docker-compose up -d
        echo -e "${GREEN}Приложение запущено на http://localhost:$PORT${NC}"
        ;;
    stop)
        echo -e "${YELLOW}Остановка контейнера...${NC}"
        docker-compose down
        ;;
    restart)
        echo -e "${YELLOW}Перезапуск контейнера...${NC}"
        docker-compose down
        docker-compose up -d
        echo -e "${GREEN}Приложение перезапущено на http://localhost:$PORT${NC}"
        ;;
    logs)
        echo -e "${YELLOW}Логи контейнера:${NC}"
        docker-compose logs -f uptime-status
        ;;
    status)
        echo -e "${YELLOW}Статус контейнера:${NC}"
        docker ps | grep $CONTAINER_NAME
        ;;
    clean)
        echo -e "${YELLOW}Очистка неиспользуемых образов...${NC}"
        docker-compose down
        # Удаляем все образы связанные с проектом
        docker rmi $IMAGE_NAME 2>/dev/null
        docker rmi uptime-uptime-status 2>/dev/null  
        docker rmi $(docker images | grep uptime | awk '{print $3}') 2>/dev/null
        docker system prune -f
        ;;
    rebuild)
        echo -e "${YELLOW}Пересборка и перезапуск...${NC}"
        docker-compose down
        echo -e "${YELLOW}Удаление старых образов...${NC}"
        docker rmi $IMAGE_NAME 2>/dev/null
        docker rmi uptime-uptime-status 2>/dev/null
        update_version
        echo -e "${YELLOW}Сборка нового образа...${NC}"
        docker build -t $IMAGE_NAME .
        echo -e "${YELLOW}Запуск контейнера...${NC}"
        docker-compose up -d
        echo -e "${GREEN}Приложение пересобрано и запущено на http://localhost:$PORT${NC}"
        ;;
    *)
        echo "Использование: $0 {build|start|stop|restart|logs|status|clean|rebuild}"
        echo ""
        echo -e "${GREEN}Команды:${NC}"
        echo "  build    - Собрать Docker образ (с обновлением версии)"
        echo "  start    - Запустить контейнер"
        echo "  stop     - Остановить контейнер"
        echo "  restart  - Перезапустить контейнер"
        echo "  logs     - Показать логи"
        echo "  status   - Показать статус"
        echo "  clean    - Очистить образы и кэш"
        echo "  rebuild  - Пересобрать и запустить (с обновлением версии)"
        exit 1
        ;;
esac 