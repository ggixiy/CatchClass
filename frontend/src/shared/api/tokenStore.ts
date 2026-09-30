// Токен тримаємо лише в пам'яті процесу (звичайна змінна модуля), а НЕ в localStorage.
// Якщо на сторінку потрапить шкідливий скрипт (XSS), він прочитає все з localStorage,
// але не дістанеться змінної, яка живе лише всередині цього JS-модуля.
// Плата за це: токен губиться при F5 — доведеться увійти знову.
// Це виправимо, коли додамо refresh-токени (наступна частина кроку auth).
let accessToken: string | null = null

export const tokenStore = {
    getAccessToken: () => accessToken,
    setAccessToken: (token: string | null) => {
        accessToken = token
    },
}