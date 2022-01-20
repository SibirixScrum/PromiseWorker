/**
 * Отправляет сообщение из воркера — в окно (или main-процесс, в зависимости от источника изначального события)
 * @param {*} sourceEvent Исходное событие, в котором есть канал для обратной отправки. В случае с shared worker нужно использовать событие connect для обратной отправки
 * @param {*} msg — любое сообщение (не обязательно формата [id, error, result])
 */

import { IWorkerAction } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postMessageToClient(sourceEvent: any, msg: any) {    
    if (sourceEvent.source) { 
        // shared worker -> renderer
        sourceEvent.source.postMessage(msg);
    } else if (typeof self.postMessage !== 'function') { 
        // service worker -> renderer
        sourceEvent.ports[0].postMessage(msg);
    } else { 
        // web worker -> renderer
        self.postMessage(msg);
    }
}
// Класс для worker-а. Умеет отправлять сообщения, оборачивая их в Promise
export abstract class PromiseWorker {

    constructor() {

        // Слушаем входящие сообщения
        // self в данном случае указывает на worker (поток, окно), перетрать его нельзя.
        // Shared Worker: Немного иной способ подключения. Ждем connect, далее нужно слушать source первого события
        // source в момент коннекта прилетает корректно -- по нему можно отправлять данные в родительское окно
        // Курить тут https://developer.mozilla.org/ru/docs/Web/API/SharedWorker
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        if (typeof self == 'object') {
            self.addEventListener('message', (e: MessageEvent) => _this.onIncomingMessage(e));

            self.addEventListener("connect", (e: any) => {
                e.source.start();
                e.source.addEventListener("message", (ev: MessageEvent) => {
                    _this.onIncomingMessage(ev, e);
                });
            }, false);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abstract onMessage(message: IWorkerAction, e: MessageEvent): any;

    /**
     * Обработка входящих в worker сообщений
     *
     */
    private onIncomingMessage(e: MessageEvent, transportEvent: MessageEvent = null) {

        // В случае Shared Worker, транспорт, через который надо отправлять события обратно, 
        // хранится событии connect.
        if (!transportEvent)
            transportEvent = e;
        const data = e.data;

        if (!Array.isArray(data) || data.length !== 2) {
            // Сообщение не нашего типа. Пропускаем.
            // todo: тут бы какую-то метку более понятную сделать. 
            // Иначе можно перебивать сообщения через этот канал, и просто сообщения            
            return;
        }
        const messageId = data[0];
        const message = data[1];

        try {
            const result = this.onMessage(message, transportEvent);
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _this = this;
            if (!isPromise(result)) { 
                // Обычный результат, не промис
                _this.postOutgoingMessage(transportEvent, messageId, null, result);
            } else {
                // Колбэк вернул промис.
                // Дожидаемся результата, отправляем либо ошибку, либо результат вычислений промиса
                result.then(function (finalResult: unknown) {
                    _this.postOutgoingMessage(transportEvent, messageId, null, finalResult);
                }, function (finalError: Error) {
                    _this.postOutgoingMessage(transportEvent, messageId, finalError);
                });
            }
        } catch (error) {
            // Ошибка -- вызов колбэка упал
            this.postOutgoingMessage(transportEvent, messageId, error, null);
        }
    }

    /**
     * Формирует и отправляет message с ошибкой или результатом операции [messageId, error|null, result]
     * @param {*} e событие, через которое можно отправлять данные в обратную сторону
     * @param {*} messageId
     * @param {*} error
     * @param {*} result
     */
    private postOutgoingMessage(e: MessageEvent, messageId: string, error: Error = null, result: unknown = null) {
        console.log("postOutgoingMessage", e, messageId, error, result);
        if (error) {
            postMessageToClient(e,
                [messageId, {
                    message: error.message
                }]);
        } else {
            postMessageToClient(e, [messageId, null, result]);
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPromise(obj: any) {
    // via https://unpkg.com/is-promise@2.1.0/index.js
    return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

