// Типы контекстов
export enum IWorkerContexts {
    // Окно электрона или браузера
    renderer = "renderer",
    // Worker или Shared Worker
    worker = "worker",
    // Main-процесс электрона
    main = "main"
}

// В каком контексте работает текущий скрипт
export const __WORKER_CONTEXT__ =
    globalThis.constructor.name == "Window" ?
        IWorkerContexts.renderer :
        globalThis.constructor.name == "Object" ?
            IWorkerContexts.main :
            IWorkerContexts.worker
    ;

/**
 * Воркер может поддерживать похожую на rest нотацию
 */
export enum IWorkerMethodTypes {
    get = "GET",
    post = "POST",
    delete = "DELETE",
    put = "PUT",
    patch = "PATCH",
    call = "CALL"
}

/**
 * Запрос к воркеру
 */
export interface IWorkerAction {
    /**
     * Какую коллекцию обновляем/читаем
     */
    controller: string;
    /**
     * Метод синхронизации (удалить, выбрать...)
     */
    method: IWorkerMethodTypes;
    /**
     * Данные для метода
     */
    payload?: object;
    /**
     * ID клиента, инициализировавшего запрос. Для избежания циклических апдейтов, например
     */
    initiator?: string;
}

/**
 * Результат выполнения запроса
 */
export interface IWorkerActionResult extends IWorkerAction {
    result?: object[]
}
export interface IWorkerActionIDResult extends IWorkerAction {
    result?: { id: string }[]
}
