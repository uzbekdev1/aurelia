---
description: Watching data
---

# Introduction

Aurelia provides a way to author your components in a reactive programming model with the `@watch` decorator. Decorating a class itself, or a method inside it with the `@watch` decorator, the corresponding method will be called whenever the watched value changes.

{% hint style="info" %}
**Intended usages**

- The `@watch` decorator can only be used on custom element and custom attribute view models.
- Corresponding watchers of `@watch` decorator will be created once, and bound after `binding`, and unbound before `unbinding` lifecycles. This means mutation during `binding`/ after `unbinding` won't be reacted to, as watchers haven't started or have stopped.

{% endhint %}

# APIs

```typescript
// on class
@watch(expressionOrPropertyAccessFn, changeHandlerOrCallback)
class MyClass {}

// on method
class MyClass {
  @watch(expressionOrPropertyAccessFn)
  someMethod() {}
}
```

| Name | Type | Description |
|-|-|-|
| expressionOrPropertyAccessFn | string \| IPropertyAccessFn<T> | Watch expression specifier |
| changeHandlerOrCallback | string \| IWatcherCallback<T> | The callback that will be invoked when the value evaluated from watch expression has changed. If a name is given, it will be used to resolve the callback `ONCE`. This callback will be called with 3 parameters: (1st) new value from the watched expression. (2nd) old value from the watched expression (3rd) the watched instance. And the context of the function call will be the instance, same with the 3rd parameter. |

# Basics

The `@watch` decorator can be used in two fashions: using a computed function, or an expression.

An example of computed function usage with `@watch` is:

```typescript
@customElement('post-office')
class PostOffice {
  packages = [];

  @watch(post => post.packages.length)
  log(newCount, oldCount) {
    if (newCount > oldCount) {
      // new packages came
    } else {
      // packages delivered
    }
  }
}
```

In this example, the `log` method of `PostOffice` will be called whenever there's a new package added to, or an existing package removed from the `packages` array.

An example of expression usage with `@watch` is:

```typescript
@customElement('post-office')
class PostOffice {
  packages = [];

  @watch('packages.length')
  log(newCount, oldCount) {
    if (newCount > oldCount) {
      // new packages came
    } else {
      // packages delivered
    }
  }
}
```

In this example, the `log` method will be also invoked similarly. The only difference is the first parameter of `@watch` decorator: an expression (`packages.length`) instead of a computed function.

# Usage examples


{% hint style="info" %}
Decorating on a class, string as watch expression, with arrow function as callback
{% endhint %}

```ts
@watch('counter', (newValue, oldValue, app) => app.log(newValue))
class App {

  counter = 0;

  log(whatToLog) {
    console.log(whatToLog);
  }
}
```


{% hint style="info" %}
Decorating on a class, string as watch expression, with method name as callback
{% endhint %}

> ❗❗❗❗ method name will be used to resolve the function `ONCE`, which means changing method after the instance has been created will not be recognized.

```ts
@watch('counter', 'log')
class App {

  counter = 0;

  log(whatToLog) {
    console.log(whatToLog);
  }
}
```

{% hint style="info" %}
Decorating on a class, string as watch expression, with normal function as callback
{% endhint %}

```ts
@watch('counter', function(newValue, oldValue, app) {
  app.log(newValue);
  // or use this, it will point to the instance of this class
  this.log(newValue);
})
class App {

  counter = 0;

  log(whatToLog) {
    console.log(whatToLog);
  }
}
```

{% hint style="info" %}
Decorating on a class, normal function as watch expression, with arrow function as callback
{% endhint %}

```ts
@watch(function (app) { return app.counter }, (newValue, oldValue, app) => app.log(newValue))
class App {

  counter = 0;

  log(whatToLog) {
    console.log(whatToLog);
  }
}
```


{% hint style="info" %}
Decorating on a class, arrow function as watch expression, with arrow function as callback
{% endhint %}

```ts
@watch(app => app.counter, (newValue, oldValue, app) => app.log(newValue))
class App {

  counter = 0;

  log(whatToLog) {
    console.log(whatToLog);
  }
}
```


{% hint style="info" %}
Decorating on a method, string as watch expression
{% endhint %}

```ts
class App {

  counter = 0;

  @watch('counter')
  log(whatToLog) {
    console.log(whatToLog);
  }
}
```


{% hint style="info" %}
Decorating on a method, normal function as watch expression
{% endhint %}

```ts
class App {

  counter = 0;

  @watch(function(app) { return app.counter })
  log(whatToLog) {
    console.log(whatToLog);
  }
}
```


{% hint style="info" %}
Decorating on a method, arrow function as watch expression
{% endhint %}

```ts
class App {

  counter = 0;

  @watch(app => app.counter)
  log(whatToLog) {
    console.log(whatToLog);
  }
}
```

# @watch reactivity examples

> During `binding` lifecycle, bindings created by `@watch` decorator haven't been activated yet, which means mutations won't be reacted to:

```typescript
class PostOffice {
  packages = [];

  @watch(post => post.packages.length)
  log(newCount, oldCount) {
    console.log(`packages changes: ${oldCount} -> ${newCount}`);
  }

  // lifecycle
  binding() {
    this.packages.push({ id: 1, name: 'xmas toy', delivered: false });
  }
}
```
There will be no log in the console.

> During `bound` lifecycle, bindings created by `@watch` decorator have been activated, and mutations will be reacted to:

```typescript
class PostOffice {
  packages = [];

  @watch(post => post.packages.length)
  log(newCount, oldCount) {
    console.log(`packages changes: ${oldCount} -> ${newCount}`);
  }

  // lifecycle
  bound() {
    this.packages.push({ id: 1, name: 'xmas toy', delivered: false });
  }
}
```
There will be 1 log in the console that looks like this: `packages changes: 0 -> 1`.


{% hint style="info" %}
**Other lifecycles**
Lifecycles that are invoked after `binding` and before `unbinding` are not sensitive to the working of the `@watch` decorator, and thus don't need special mentions. Those lifecycles are `attaching`, `attached`, and `detaching`.
{% endhint %}

> During `detaching` lifeycle, bindings created by `@watch` decorator have not been de-activated yet, and mutations will still be reacted to:

```typescript
class PostOffice {
  packages = [];

  @watch(post => post.packages.length)
  log(newCount, oldCount) {
    console.log(`packages changes: ${oldCount} -> ${newCount}`);
  }

  // lifecycle
  detaching() {
    this.packages.push({ id: 1, name: 'xmas toy', delivered: false });
  }
}
```
There will be 1 log in the console that looks like this: `packages changes: 0 -> 1`.

> During `unbinding` lifecycle, bindings created by `@watch` decorator have been deactivated, and mutations won't be reacted to:

```typescript
class PostOffice {
  packages = [];

  @watch(post => post.packages.length)
  log(newCount, oldCount) {
    console.log(`packages changes: ${oldCount} -> ${newCount}`);
  }

  // lifecycle
  unbinding() {
    this.packages.push({ id: 1, name: 'xmas toy', delivered: false });
  }
}
```

There will be no log in the console.

# How it works

By default, a watcher will be created for a `@watch()` decorator. This watcher will start observing before `bound` lifecycle of components. How the observation works will depend on the first parameter given.

- If a string, or a symbol is given, it will be used as an expression to observe, similar to how an expression in Aurelia templating works.
- If a function is given, it will be used as a computed getter to observe dependencies and evaluate the value to pass into the specified method. There are two mechanisms that can be employed:
  - For JavaScript environments with native proxy support: Proxy will be used to trap & observe property read. It will also observe collections (such as array, map and set) based on the method invoked. For example, calling `.map(item => item.value)` on an array should observe the mutation of that array, and the property `value` of each item inside the array.
  - For environments without native proxy support: A 2nd parameter inside computed getter can be used to manually observe (or register) dependencies. This is the corresponding watcher created from a `@watch` decorator. It has the following interface:
  ```typescript
  interface IWatcher {
    observeProperty(obj: object, key: string | number | symbol): void;
    observeCollection(collection: Array | Map | Set): void;
  }
  ```
  An example is:
  ```typescript
  class Contact {
    firstName = 'Chorris';
    lastName = 'Nuck';

    @watch((contact, watcher) => {
      watcher.observeProperty(contact, 'firstName');
      watcher.observeProperty(contact, 'lastName');
      return `${contact.firstName} ${contact.lastName}`;
    })
    validateFullName(fullName) {
      if (fullName === 'Chuck Norris') {
        this.faint();
      }
    }
  }
  ```
  The `firstName` and `lastName` properties of `contact` components is being observed manually. And every time either `firstName`, or `lastName` change, the computed getter is run again and the dependencies will be observed again. Observers are cached and the same observer won't be added more than once, old observers from the old computed getter run will also be disposed, so you won't have to worry about stale dependencies or memory leak.

{% hint style="warning" %}
**Automatic array observation**

- By default, in the computed getter, array mutation method such as `.push()`, `.pop()`, `.shift()`, `.unshift()`, `.splice()`, and `.reverse()` are not observed, as there are no clear indicators of what dependencies to be collected from those methods.

{% endhint %}

# Best practices

- It is best to avoid mutation on dependencies collected inside a computed getter. For example:
  ```typescript
  // don't do this
  @watch(object => object.counter++)
  someMethod() {}

  // don't do these
  @watch(object => object.someArray.push(...args))
  @watch(object => object.someArray.pop())
  @watch(object => object.someArray.shift())
  @watch(object => object.someArray.unshift())
  @watch(object => object.someArray.splice(...args))
  @watch(object => object.someArray.reverse())
  someMethod() {}
  ```

- To ensure identity equality with proxies, always be careful with objects that are not accessed from the first parameter passed into the computed getter. Better, get the raw underlying object before doing the strict comparison with `===`. For example:
  ```typescript
  const defaultOptions = {};

  class MyClass {
    options = defaultOptions;

    @watch(myClass => myClass.options === defaultOptions ? null : myClass.options)
    applyCustomOptions() {
      // ...
    }
  }
  ```
  In this example, even if `options` on a `MyClass` instance has never been changed, the comparison of `myClass.options === defaultOptions` will still return false, as the actual value for `myClass.options` is a proxied object wrapping the real object, and thus is always different with `defaultOptions`.

- Dependency tracking inside a watch computed getter is done synchronously, which means returning a promise, or having an async function won't work properly. Don't do the following:
  ```typescript
  class MyClass {

    // don't do this
    @watch(async myClassInstance => myClassinstance.options)
    applyCustomOptions() {}

    // don't do this
    @watch(myClassInstance => {
      Promise.resolve().then(() => {
        return myClassinstance.options
      })
    })
  }
  ```
