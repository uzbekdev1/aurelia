import {
  createExposedPromise,
  PReject,
  PResolve,
  TaskQueuePriority,
} from './types';
import {
  TaskQueue,
  TaskCallback,
} from './task-queue';
import { enter, trace, leave } from './log';

export class TaskAbortError<T = any> extends Error {
  public constructor(public task: Task<T>) {
    super('Task was canceled.');
  }
}

let id: number = 0;

export type TaskStatus = 'pending' | 'running' | 'completed' | 'canceled';

export interface ITask<T = any> {
  readonly result: Promise<T>;
  readonly status: TaskStatus;
  readonly priority: TaskQueuePriority;
  run(): void;
  cancel(): boolean;
}

export class Task<T = any> implements ITask {
  public readonly id: number = ++id;
  public next: Task<T> | undefined = void 0;
  public prev: Task<T> | undefined = void 0;

  private resolve: PResolve<T> | undefined = void 0;
  private reject: PReject<TaskAbortError<T>> | undefined = void 0;

  private _result: Promise<T> | undefined = void 0;
  public get result(): Promise<T> {
    const result = this._result;
    if (result === void 0) {
      switch (this._status) {
        case 'pending': {
          const promise = this._result = createExposedPromise();
          this.resolve = promise.resolve;
          this.reject = promise.reject;
          return promise;
        }
        case 'running':
          throw new Error('Trying to await task from within task will cause a deadlock.');
        case 'completed':
          return this._result = Promise.resolve() as unknown as Promise<T>;
        case 'canceled':
          return this._result = Promise.reject(new TaskAbortError(this));
      }
    }
    return result!;
  }

  private _status: TaskStatus = 'pending';
  public get status(): TaskStatus {
    return this._status;
  }

  public readonly priority: TaskQueuePriority;

  public constructor(
    public readonly taskQueue: TaskQueue,
    public createdTime: number,
    public queueTime: number,
    public preempt: boolean,
    public persistent: boolean,
    public async: boolean | 'auto',
    public readonly reusable: boolean,
    public callback: TaskCallback<T>
  ) {
    this.priority = taskQueue.priority;
  }

  public run(): void {
    enter(this, 'run');

    if (this._status !== 'pending') {
      leave(this, 'run error');

      throw new Error(`Cannot run task in ${this._status} state`);
    }

    // this.persistent could be changed while the task is running (this can only be done by the task itself if canceled, and is a valid way of stopping a loop)
    // so we deliberately reference this.persistent instead of the local variable, but we keep it around to know whether the task *was* persistent before running it,
    // so we can set the correct cancelation state.
    const {
      persistent,
      reusable,
      taskQueue,
      callback,
      resolve,
      reject,
      createdTime,
      async,
    } = this;

    taskQueue.remove(this);

    this._status = 'running';
    let isAsync = false;

    try {
      const ret = callback(taskQueue.now() - createdTime);
      if (async === true || (async === 'auto' && ret instanceof Promise)) {
        isAsync = true;
        (ret as unknown as Promise<T>)
          .then(() => {
            if (this.persistent) {
              taskQueue.resetPersistentTask(this);
            } else if (persistent) {
              // Persistent tasks never reach completed status. They're either pending, running, or canceled.
              this._status = 'canceled';
            } else {
              this._status = 'completed';
            }

            if (resolve !== void 0) {
              resolve(ret);
            }
          })
          .catch(err => {
            if (reject !== void 0) {
              reject(err);
            } else {
              throw err;
            }
          })
          .finally(() => {
            if (!this.persistent) {
              this.dispose();

              if (reusable) {
                taskQueue.returnToPool(this);
              }
            }

            taskQueue.completeAsyncTask(this);

            leave(this, 'run async finally');
          });
      } else {
        if (this.persistent) {
          taskQueue.resetPersistentTask(this);
        } else if (persistent) {
          // Persistent tasks never reach completed status. They're either pending, running, or canceled.
          this._status = 'canceled';
        } else {
          this._status = 'completed';
        }

        if (resolve !== void 0) {
          resolve(ret);
        }
      }
    } catch (err) {
      if (reject !== void 0) {
        reject(err);
      } else {
        throw err;
      }
    } finally {
      if (!isAsync) {
        if (!this.persistent) {
          this.dispose();

          if (reusable) {
            taskQueue.returnToPool(this);
          }
        }

        leave(this, 'run sync finally');
      }
    }
  }

  public cancel(): boolean {
    enter(this, 'cancel');

    if (this._status === 'pending') {

      const taskQueue = this.taskQueue;
      const reusable = this.reusable;
      const reject = this.reject;

      taskQueue.remove(this);

      if (taskQueue.isEmpty) {
        taskQueue.cancel();
      }

      this._status = 'canceled';

      if (reject !== void 0) {
        reject(new TaskAbortError(this));
      }

      this.dispose();

      if (reusable) {
        taskQueue.returnToPool(this);
      }

      leave(this, 'cancel true =pending');

      return true;
    } else if (this._status === 'running' && this.persistent) {
      this.persistent = false;

      leave(this, 'cancel true =running+persistent');

      return true;
    }

    leave(this, 'cancel false');

    return false;
  }

  public reset(time: number): void {
    enter(this, 'reset');

    const delay = this.queueTime - this.createdTime;
    this.createdTime = time;
    this.queueTime = time + delay;
    this._status = 'pending';

    this.resolve = void 0;
    this.reject = void 0;
    this._result = void 0;

    leave(this, 'reset');
  }

  public reuse(
    time: number,
    delay: number,
    preempt: boolean,
    persistent: boolean,
    async: boolean | 'auto',
    callback: TaskCallback<T>,
  ): void {
    enter(this, 'reuse');

    this.createdTime = time;
    this.queueTime = time + delay;
    this.preempt = preempt;
    this.persistent = persistent;
    this.async = async;
    this.callback = callback;
    this._status = 'pending';

    leave(this, 'reuse');
  }

  public dispose(): void {
    trace(this, 'dispose');

    this.prev = void 0;
    this.next = void 0;

    this.callback = (void 0)!;
    this.resolve = void 0;
    this.reject = void 0;
    this._result = void 0;
  }
}