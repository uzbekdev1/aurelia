import {
  CollectionKind,
  LifecycleFlags,
  SetterObserver,
  subscriberCollection,
  AccessorType,
} from '@aurelia/runtime';
import { getCollectionObserver } from './observer-locator.js';
import type { INode } from '../dom.js';
import type { EventSubscriber } from './event-delegator.js';
import type { ValueAttributeObserver } from './value-attribute-observer.js';
import type {
  ICollectionObserver,
  IndexMap,
  ISubscriber,
  ISubscriberCollection,
  IObserver,
  IObserverLocator,
} from '@aurelia/runtime';

export interface IInputElement extends HTMLInputElement {
  model?: unknown;
  $observers?: {
    model?: SetterObserver;
    value?: ValueAttributeObserver;
  };
  matcher?: typeof defaultMatcher;
}

function defaultMatcher(a: unknown, b: unknown): boolean {
  return a === b;
}

export interface CheckedObserver extends
  ISubscriberCollection { }

export class CheckedObserver implements IObserver {
  public value: unknown = void 0;
  public oldValue: unknown = void 0;

  public readonly obj: IInputElement;

  public type: AccessorType = AccessorType.Node | AccessorType.Observer | AccessorType.Layout;

  public collectionObserver?: ICollectionObserver<CollectionKind> = void 0;
  public valueObserver?: ValueAttributeObserver | SetterObserver = void 0;

  public constructor(
    obj: INode,
    // deepscan-disable-next-line
    _key: PropertyKey,
    public readonly handler: EventSubscriber,
    public readonly observerLocator: IObserverLocator,
  ) {
    this.obj = obj as IInputElement;
  }

  public getValue(): unknown {
    return this.value;
  }

  public setValue(newValue: unknown, flags: LifecycleFlags): void {
    const currentValue = this.value;
    if (newValue === currentValue) {
      return;
    }
    this.value = newValue;
    this.oldValue = currentValue;
    this.observe();
    this.synchronizeElement();
    this.subs.notify(newValue, currentValue, flags);
  }

  public handleCollectionChange(indexMap: IndexMap, flags: LifecycleFlags): void {
    this.synchronizeElement();
  }

  public handleChange(newValue: unknown, previousValue: unknown, flags: LifecycleFlags): void {
    this.synchronizeElement();
  }

  public synchronizeElement(): void {
    const currentValue = this.value;
    const obj = this.obj;
    const elementValue = Object.prototype.hasOwnProperty.call(obj, 'model') as boolean ? obj.model : obj.value;
    const isRadio = obj.type === 'radio';
    const matcher = obj.matcher !== void 0 ? obj.matcher : defaultMatcher;

    if (isRadio) {
      obj.checked = !!matcher(currentValue, elementValue);
    } else if (currentValue === true) {
      obj.checked = true;
    } else {
      let hasMatch = false;
      if (currentValue instanceof Array) {
        hasMatch = currentValue.findIndex(item => !!matcher(item, elementValue)) !== -1;
      } else if (currentValue instanceof Set) {
        for (const v of currentValue) {
          if (matcher(v, elementValue)) {
            hasMatch = true;
            break;
          }
        }
      } else if (currentValue instanceof Map) {
        for (const pair of currentValue) {
          const existingItem = pair[0];
          const $isChecked = pair[1];
          // a potential complain, when only `true` is supported
          // but it's consistent with array
          if (matcher(existingItem, elementValue) && $isChecked === true) {
            hasMatch = true;
            break;
          }
        }
      }
      obj.checked = hasMatch;
    }
  }

  public handleEvent(): void {
    let currentValue = this.oldValue = this.value;
    const obj = this.obj;
    const elementValue = Object.prototype.hasOwnProperty.call(obj, 'model') as boolean ? obj.model : obj.value;
    const isChecked = obj.checked;
    const matcher = obj.matcher !== void 0 ? obj.matcher : defaultMatcher;

    if (obj.type === 'checkbox') {
      if (currentValue instanceof Array) {
        // Array binding steps on a change event:
        // 1. find corresponding item INDEX in the Set based on current model/value and matcher
        // 2. is the checkbox checked?
        //    2.1. Yes: is the corresponding item in the Array (index === -1)?
        //        2.1.1 No: push the current model/value to the Array
        //    2.2. No: is the corresponding item in the Array (index !== -1)?
        //        2.2.1: Yes: remove the corresponding item
        // =================================================
        const index = currentValue.findIndex(item => !!matcher(item, elementValue));

        // if the checkbox is checkde, and there's no matching value in the existing array
        // add the checkbox model/value to the array
        if (isChecked && index === -1) {
          currentValue.push(elementValue);
        } else if (!isChecked && index !== -1) {
          // if the checkbox is not checked, and found a matching item in the array
          // based on the checkbox model/value
          // remove the existing item
          currentValue.splice(index, 1);
        }
        // when existing currentValue is an array,
        // do not invoke callback as only the array obj has changed
        return;
      } else if (currentValue instanceof Set) {
        // Set binding steps on a change event:
        // 1. find corresponding item in the Set based on current model/value and matcher
        // 2. is the checkbox checked?
        //    2.1. Yes: is the corresponding item in the Set?
        //        2.1.1 No: add the current model/value to the Set
        //    2.2. No: is the corresponding item in the Set?
        //        2.2.1: Yes: remove the corresponding item
        // =================================================

        // 1. find corresponding item
        const unset = {};
        let existingItem: unknown = unset;
        for (const value of currentValue) {
          if (matcher(value, elementValue) === true) {
            existingItem = value;
            break;
          }
        }
        // 2.1. Checkbox is checked, is the corresponding item in the Set?
        //
        // if checkbox is checked and there's no value in the existing Set
        // add the checkbox model/value to the Set
        if (isChecked && existingItem === unset) {
          // 2.1.1. add the current model/value to the Set
          currentValue.add(elementValue);
        } else if (!isChecked && existingItem !== unset) {
          // 2.2.1 Checkbox is unchecked, corresponding is in the Set
          //
          // if checkbox is not checked, and found a matching item in the Set
          // based on the checkbox model/value
          // remove the existing item
          currentValue.delete(existingItem);
        }
        // when existing value is a Set,
        // do not invoke callback as only the Set has been mutated
        return;
      } else if (currentValue instanceof Map) {
        // Map binding steps on a change event
        // 1. find corresponding item in the Map based on current model/value and matcher
        // 2. Set the value of the corresponding item in the Map based on checked state of the checkbox
        // =================================================

        // 1. find the corresponding item
        let existingItem: unknown;
        for (const pair of currentValue) {
          const currItem = pair[0];
          if (matcher(currItem, elementValue) === true) {
            existingItem = currItem;
            break;
          }
        }

        // 2. set the value of the corresponding item in the map
        // if checkbox is checked and there's no value in the existing Map
        // add the checkbox model/value to the Map as key,
        // and value will be checked state of the checkbox
        currentValue.set(existingItem, isChecked);
        // when existing value is a Map,
        // do not invoke callback as only the Map has been mutated
        return;
      }
      currentValue = isChecked;
    } else if (isChecked) {
      currentValue = elementValue;
    } else {
      // if it's a radio and it has been unchecked
      // do nothing, as the radio that was checked will fire change event and it will be handle there
      // a radio cannot be unchecked by user
      return;
    }
    this.value = currentValue;
    this.subs.notify(this.value, this.oldValue, LifecycleFlags.none);
  }

  public start() {
    this.handler.subscribe(this.obj, this);
    this.observe();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public stop(): void {
    this.handler.dispose();
    this.collectionObserver?.unsubscribeFromCollection(this);
    this.collectionObserver = void 0;

    this.valueObserver?.unsubscribe(this);
  }

  public subscribe(subscriber: ISubscriber): void {
    if (this.subs.add(subscriber) && this.subs.count === 1) {
      this.start();
    }
  }

  public unsubscribe(subscriber: ISubscriber): void {
    if (this.subs.remove(subscriber) && this.subs.count === 0) {
      this.stop();
    }
  }

  private observe() {
    const obj = this.obj;

    (this.valueObserver ??= obj.$observers?.model ?? obj.$observers?.value)?.subscribe(this);

    this.collectionObserver?.unsubscribeFromCollection(this);
    this.collectionObserver = void 0;

    if (obj.type === 'checkbox') {
      (this.collectionObserver = getCollectionObserver(this.value, this.observerLocator))
        ?.subscribeToCollection(this);
    }
  }
}

subscriberCollection()(CheckedObserver);
