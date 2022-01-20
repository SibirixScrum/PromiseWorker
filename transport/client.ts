import { v4 as uuidv4 } from 'uuid'
import { EventEmitter } from 'events';
import { IWorkerActionResult } from '../types';

const workerExceedTimeout = 2

function hasListeners(emitter: EventEmitter, message: string) {
    return emitter.eventNames().includes(message);
}

/**
 * Обертка для Worker | SharedWorker | ServiceWorker | WebSocket для отправки подписанных сообщений с ожиданием ответов через Promise
 * 
 */
class PromiseWorkerClient {

    private worker: Worker | SharedWorker | ServiceWorker | WebSocket;
    private emitter: EventEmitter = new EventEmitter();

    constructor(worker: Worker | SharedWorker | ServiceWorker | WebSocket) {
        this.worker = worker;
        // На события от воркеров тригегеррим onMessage, который в свою очередь рергает эмиттер
        if (this.worker instanceof SharedWorker) {
            this.worker.port.addEventListener("message", this.onMessage.bind(this), false);
            this.worker.port.start();
        } else {
            this.worker.addEventListener('message', this.onMessage.bind(this))
        }
    }
    /**
     * Отправляет в воркер, ждет ответа на него
     * @param message 
     * @returns Promise обработки сообщения в воркере
     */
    public postMessage<TResult = unknown, TInput = unknown>(message: TInput): Promise<TResult> {

        // Подписываем сообщения uuidv4. Оборачиваем в формат [uid, message]. Отправляем в воркер.
        // Эмиттер ждет разового ответа на сообщение с заданным id. 
        // Как получает сообщение — реджектит или резовит промис, в зависимости от того, была ли воркере ошибка
        // Кроме того, запускаем таймер. Если сработал таймаут и не было ответа от воркера — реджектим промис, кидаем эксэпшин

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const messageId = uuidv4();
        const messageToSend = [messageId, message];

        return new Promise((resolve, reject) => {
            self.emitter.once(messageId, (error, result) => {
                if (error) reject(error); else resolve(result);
                return result;
            })
            self.postMessageToWorker(messageToSend);
            setTimeout(() => {
                if (hasListeners(self.emitter, messageId)) {
                    reject(new Error(`Timeout exceed, ${workerExceedTimeout} sec`))
                    self.emitter.off(messageId, resolve)
                }
            }, workerExceedTimeout * 1000)
        })
    }

    /**
     * Отправка сообщений в воркер. Обертка, что бы не задумываться, с каким типом воркера мы имеем дело
     * @param message 
     */
    private postMessageToWorker(message: unknown) {

        if (this.worker instanceof Worker) {
            this.worker.postMessage(message); // Веб-воркер
        } else if (this.worker instanceof SharedWorker) {
            this.worker.port.postMessage(message); // Пошареный воркер
        } else if (this.worker instanceof ServiceWorker) {
            // Сервис-воркер. Это не сработает для Chrome < 51. Но и нехер:
            // https://bugs.chromium.org/p/chromium/issues/detail?id=543198
            this.worker.postMessage(message);
        }
    }

    // Добавляем возможность отработки любых событий внутри класса        
    onMessageReceive(e: MessageEvent) { return e } // Обработка выходящего события. Для перегрузки в дочерних классах.
    onResultReceive(result: IWorkerActionResult, e: MessageEvent) { return e } // Получено событие с результатом
    /**
     * Слушает все сообщения. Если соответствуют нашему формату [messageId, error, result] — отправляем сообщение в эмиттер
     * @param e 
     * @returns 
     */
    private onMessage(e: MessageEvent): void {

        console.log("I RECEIVE MESSAGE");
        e = this.onMessageReceive(e);
        const message = e.data
        if (!Array.isArray(message) || message.length < 2) {
            // Ignore - this message is not for us.
            return;
        }
        const messageId = message[0];
        const error = message[1];
        const result = message[2];
        this.onResultReceive(result as IWorkerActionResult, e);
        this.emitter.emit(messageId, error, result);
    }
}

export default PromiseWorkerClient;