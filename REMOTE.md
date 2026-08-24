# Удалённая работа с проектом (на время отъезда)

Две задачи: **видеть результат** и **давать промпты Кими на домашнем ПК**.

## 1. Видеть результат — GitHub Pages (бесплатно, без VPS)

Уже настроено: `.github/workflows/deploy.yml` — при пуше в ветку `v2` собирается
фронтенд и деплоится на ветку `gh-pages`.

Один раз включить:
1. Запушить ветку: `git push -u origin v2`
2. GitHub → репозиторий `lots` → Settings → Pages → Source: ветка `gh-pages`, папка `/ (root)`.
3. Через минуту игра будет на `https://doctored11.github.io/lots/`

Сейв в localStorage — прогресс не потеряется между деплоями.

Альтернатива — VPS Франкфурт: скопировать `frontend/dist` на VPS и раздавать
через nginx/caddy. Но Pages проще и не тратит ресурсы VPS.

## 2. Давать промпты — SSH на домашний ПК через VPS

### Однократная настройка домашнего ПК (нужен админ)

PowerShell **от администратора**:

```powershell
# установить OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
# запустить и сделать автозапуск
Start-Service sshd
Set-Service sshd -StartupType Automatic
# проверка
Get-Service sshd
```

### Однократная настройка VPS

На VPS (Debian/Ubuntu), файл `/etc/ssh/sshd_config`:

```
GatewayPorts yes
```

```bash
systemctl restart ssh
# и авторизовать ключ домашнего ПК:
mkdir -p ~/.ssh
echo "СОДЕРЖИМОЕ C:\Users\turboEd\.ssh\id_ed25519.pub" >> ~/.ssh/authorized_keys
```

(файрвол VPS: порт 2222 открыть не нужно, если заходишь сначала на сам VPS по ssh —
GatewayPorts нужен только если хочешь стучаться на VPS:2222 напрямую извне)

### Перед отъездом (на домашнем ПК)

```bash
# 1. отредактировать VPS_USER/VPS_HOST в scripts/remote-tunnel.sh
# 2. запустить туннель и оставить окно открытым:
bash scripts/remote-tunnel.sh
```

### Как работать из поездки

```bash
ssh root@<VPS>                    # заходишь на VPS
ssh -p 2222 turboEd@localhost     # через туннель попадаешь на домашний ПК
cd /c/Users/turboEd/Desktop/cas   # папка проекта
kimi --resume                     # продолжаешь эту сессию Кими
```

Всё, что я сделаю, коммичу в git — запускай `git push` (или скажи мне), и через
~2 минуты результат на GitHub Pages.

### Заметки

- Домашний ПК не должен засыпать: Панель управления → Электропитание → «Никогда».
- Если SSH не нужен постоянно — туннель можно запускать только когда надо.
- Окно с этой сессией Кими на домашнем ПК можно закрыть — сессия сохраняется на
  диске и продолжается через `kimi --resume` из SSH.
