# Worker / SharedWorker Promise API

This is a small, demo part of the project of interaction with Worker / Shared Woeker through Promise. Written during the refactoring of [SingularityApp](https://singularity-app.com/). For informational purposes and a series of articles for Habr.

Singularity is closer than you think!

----------
SharedWorker is a separate process available to all windows (one instance for all).
  
For debugging purposes, instead of SharedWorker, you can run a regular Worker (created by [index.ts](./index.ts)) - it has easy access to the console.

----------
  
## Contexts

``__WORKER_CONTEXT__`` - contains the context in which the code is currently executing (Main, Worker, Renderer)

----------
## Access SharedWorker from browser/window - Renderer context
In the Renderer context, a [Server](./index.ts) object is created that can communicate with the SharedWorker
Supports sending messages, format ``IWorkerAction`` with waiting for processing response, via Promise
Emitter + Timeout is used to implement Promise. All messages are numbered (uid) and signed by a specific client

```console

Window -> {message: id} -> postMessage -> worker ->
                                        dispatch ->
                                        ResultPromise ->
        emitter -> on(id) -> resolve <-----------------|
        timeout -> reject
    
```

The mechanism of work through Promise + Emitter + Timeout is implemented for [Client](./transport/client.ts) and [Worker](./transport/worker.ts)

----------

todo:
In this implementation, there is no way to wait for the SharedWorker to be fully initialized before the first request is sent. Needs to be finished.

--------------------

# Worker / SharedWorker Promise Api

Это небольшая, демонстрационная часть проекта взаимодействия с Worker / Shared Woeker через Promise. Написана в ходе рефакторинг [SingularityApp](https://singularity-app.com/). Для ознакомительных целей и цикла статей для Habr.

----------
SharedWorker — отдельный процесс, доступный всем окнам (один экземпляр для всех).
  
В целях отладки вместо SharedWorker можно запустить обычный Worker (создается [index.ts](./index.ts)) — он имеет простой доступ к консоли.

----------
  
## Контексты

``__WORKER_CONTEXT__`` — содержит контекст, в котором сейчас выполняется код (Main, Worker, Renderer)

----------
## Доступ к SharedWorker из браузера/окна — контект Renderer
В контексте Renderer создается объект [Server](./index.ts), умеющий общаться с SharedWorker
Поддерживается отправка сообщений, формата ``IWorkerAction`` с ожиданием ответа обработки, через Promise
Для реализации Promise используется Emitter + Timeout. Все сообщения нумеруются (uid) и подписываются конкретным клиентом

```console

Окно -> {message: id} -> postMessage -> worker -> 
                                        dispatch -> 
                                        ResultPromise ->
        emitter -> on(id) -> resolve <-----------------|
        timeout -> reject
    
```

Механизм работы через Promise + Emitter + Timeout реализован для [Клиента](./transport/client.ts) и [Worker](./transport/worker.ts)

----------

todo:
В данной реализации нет способа дождаться полной инициализации SharedWorker до того, как будет отправлен первый запрос.
