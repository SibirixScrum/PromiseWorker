import PromiseWorkerClient from "./transport/client";
import { IWorkerContexts, __WORKER_CONTEXT__ } from "./types";

declare const WORKER_SYNC_WEBPACK_ENTRY: string;
let Server: PromiseWorkerClient;

if (__WORKER_CONTEXT__ == IWorkerContexts.renderer) {
    
    const worker = new SharedWorker(WORKER_SYNC_WEBPACK_ENTRY);
    Server = new PromiseWorkerClient(worker);    
}

export default Server;