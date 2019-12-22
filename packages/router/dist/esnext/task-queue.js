import { __decorate, __metadata } from "tslib";
import { bound } from '@aurelia/kernel';
export class QueueTask {
    constructor(taskQueue, item, cost = 0) {
        this.taskQueue = taskQueue;
        this.item = item;
        this.cost = cost;
        this.done = false;
        this.promise = new Promise((resolve, reject) => {
            this.resolve = () => {
                this.taskQueue.resolve(this, resolve);
            };
            this.reject = (reason) => {
                this.taskQueue.reject(this, reject, reason);
            };
        });
    }
    async execute() {
        if ('execute' in this.item) {
            await this.item.execute(this);
        }
        else {
            await this.item(this);
        }
    }
    wait() {
        return this.promise;
    }
    canCancel() {
        return false;
    }
    cancel() { return; }
}
/**
 * A first-in-first-out task queue that only processes the next queued item
 * when the current one has been resolved or rejected. If a callback function
 * is specified, it receives the queued items as tasks one at a time. If no
 * callback is specified, the tasks themselves are either executed (if a
 * function) or the execute method in them are run. The executed function
 * should resolve or reject the task when processing is done.
 * Enqueued items' tasks can be awaited. Enqueued items can specify an
 * (arbitrary) execution cost and the queue can be set up (activated) to
 * only process a specific amount of execution cost per RAF/tick.
 */
export class TaskQueue {
    constructor(callback) {
        this.callback = callback;
        this.pending = [];
        this.processing = null;
        this.allowedExecutionCostWithinTick = null;
        this.currentExecutionCostInCurrentTick = 0;
        this.scheduler = null;
        this.task = null;
    }
    get isActive() {
        return this.task !== null;
    }
    get length() {
        return this.pending.length;
    }
    activate(options) {
        if (this.isActive) {
            throw new Error('TaskQueue has already been activated');
        }
        this.scheduler = options.scheduler;
        this.allowedExecutionCostWithinTick = options.allowedExecutionCostWithinTick;
        this.task = this.scheduler.queueRenderTask(this.dequeue, { persistent: true });
    }
    deactivate() {
        if (!this.isActive) {
            throw new Error('TaskQueue has not been activated');
        }
        this.task.cancel();
        this.task = null;
        this.allowedExecutionCostWithinTick = null;
        this.clear();
    }
    enqueue(itemOrItems, costOrCosts) {
        const list = Array.isArray(itemOrItems);
        const items = (list ? itemOrItems : [itemOrItems]);
        const costs = items
            .map((value, index) => !Array.isArray(costOrCosts) ? costOrCosts : costOrCosts[index])
            .map((value) => value !== undefined ? value : 1);
        const tasks = [];
        for (const item of items) {
            tasks.push(item instanceof QueueTask
                ? item
                : this.createQueueTask(item, costs.shift())); // TODO: Get cancellable in as well
        }
        this.pending.push(...tasks);
        this.dequeue();
        return list ? tasks : tasks[0];
    }
    createQueueTask(item, cost) {
        return new QueueTask(this, item, cost);
    }
    dequeue(delta) {
        if (this.processing !== null) {
            return;
        }
        if (delta !== undefined) {
            this.currentExecutionCostInCurrentTick = 0;
        }
        if (!this.pending.length) {
            return;
        }
        if (this.allowedExecutionCostWithinTick !== null && delta === undefined && this.currentExecutionCostInCurrentTick + (this.pending[0].cost || 0) > this.allowedExecutionCostWithinTick) {
            return;
        }
        this.processing = this.pending.shift() || null;
        if (this.processing) {
            this.currentExecutionCostInCurrentTick += this.processing.cost || 0;
            if (this.callback !== void 0) {
                this.callback(this.processing);
            }
            else {
                // Don't need to await this since next task won't be dequeued until
                // executed function is resolved
                this.processing.execute().catch(error => { throw error; });
            }
        }
    }
    clear() {
        this.pending.splice(0, this.pending.length);
    }
    resolve(task, resolve) {
        resolve();
        this.processing = null;
        this.dequeue();
    }
    reject(task, reject, reason) {
        reject(reason);
        this.processing = null;
        this.dequeue();
    }
}
__decorate([
    bound,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], TaskQueue.prototype, "dequeue", null);
//# sourceMappingURL=task-queue.js.map