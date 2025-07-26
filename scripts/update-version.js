const fs = require('fs')
const path = require('path')

// Получаем версию из package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
const version = packageJson.version

// Генерируем timestamp для уникальности
const timestamp = Date.now()
const versionString = `${version}.${timestamp}`

// Обновляем index.html
const indexPath = path.join(__dirname, '../public/index.html')
let indexContent = fs.readFileSync(indexPath, 'utf8')

// Заменяем версию в config.js
indexContent = indexContent.replace(/src="\.\/config\.js\?v=[^"]*"/, `src="./config.js?v=${versionString}"`)

fs.writeFileSync(indexPath, indexContent)

// Обновляем версию в Service Worker
const swPath = path.join(__dirname, '../public/sw.js')
if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8')

    // Заменяем версию кеша
    swContent = swContent.replace(/const CACHE_NAME = 'uptime-status-v[^']*'/, `const CACHE_NAME = 'uptime-status-v${versionString}'`)

    fs.writeFileSync(swPath, swContent)
    console.log(`✅ Service Worker обновлен до версии: ${versionString}`)
}

console.log(`✅ Версия обновлена до: ${versionString}`)
