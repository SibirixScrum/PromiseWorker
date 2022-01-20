import { IWorkerAction } from "../types";
import { PromiseWorker } from "../transport/worker";

/**
 * Пустой шаблон воркера
 * 
 */
export class SyncWorker extends PromiseWorker {

    onMessage(message: IWorkerAction, e: MessageEvent) {

        console.log("Message in worker", message);
        return "Singularity is closer than you think!:  https://singularity-app.com/";
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = new SyncWorker();