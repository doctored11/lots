# Тестовая настройка Google OAuth2.0

## Описание

Этот проект представляет тренировочку для интеграции авторизации через Google OAuth 2.0 в веб-приложение. Пример демонстрирует вход пользователя и функционал обновления токена. Токен живет минуту.

Вроде работает корректно, не смотря на код-минимум (особенно с серверной части)

_В первую очередь это подсказка для меня в будущем_

---

## Как получить ключи Google OAuth2.0

> ⚠️ без ключей гугл выдаст ошибку - это важно

1. Надо перейти в [Google Cloud Console](https://console.cloud.google.com/).
2. Создайть новый проект.
3. В разделе **API & Services** найти **OAuth consent screen** и настроить экран с необходимыми данными. (Жмяк на external, и потом заполняем название и прочее)
4. В разделе **Credentials** сверху нажать на **+Create Credentials** → **OAuth Client IDs**.
5. Перейти в **Web Application** и указать следующие url-ки в **Authorized Redirect URIs**:
   - `http://localhost:3000/auth/google/callback`
   - `http://localhost:3003/auth/google/callback`
6. Надо запомнить **Client ID** и **Client Secret**.

---

## Как настроить ключи

### Для клиента, создайте файл `.env` (или измените):

```bash
REACT_APP_CLIENT_ID=client-id
CLIENT_SECRET=client-secret
REACT_APP_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Для сервера, создайте файл `.env` (или измените):

```bash
CLIENT_ID=client-id
CLIENT_SECRET=client-secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Как запустить

1. так:

   > npm install

   откройте два терминала, для сервера и клиента и запустите соответственно:

   > ..\gitAPITEST\TestAPI> npm run dev

   > ..\gitAPITEST\TestAPI>server> node server.js


## Описание кода

Этот проект пытается реализовать и реализует OAuth 2.0 авторизацию через Google. При успешной аутентификации пользователя на сервер отправляется код авторизации, который сервер обменивает на токен доступа и сохраняет его в cookies. Клиент может обновлять токен доступа через функцию refresh token, когда сессия пользователя истекает. Для примера на сервере установлена жизнь ключа порядка минуты, по истечению которой требуется обновление токена для продления сессии. По идее так же работает и с остальными сервисами.

---

### Пример настроек OAuth в Google Console

![Google OAuth Настройки](./rSrc/googleKeys.png)

- На скриншоте показано, где посмотреть **Client ID** и **Client Secret**.
- Важно, чтоб в поле **Authorized redirect URIs** было указано: `http://localhost:3000/auth/google/callback` (*так как он указан на сервере*)
