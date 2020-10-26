import { DI, Registration, onResolve, resolveAll } from '@aurelia/kernel';
import { INode } from './dom';
import { IAppTask } from './app-task';
import { CustomElement } from './resources/custom-element';
import { Controller } from './templating/controller';
import { HooksDefinition } from './definitions';
export const IAppRoot = DI.createInterface('IAppRoot').noDefault();
export class AppRoot {
    constructor(config, platform, container, rootProvider, enhance = false) {
        var _a;
        this.config = config;
        this.platform = platform;
        this.container = container;
        this.controller = (void 0);
        this.hydratePromise = void 0;
        this.host = config.host;
        rootProvider.prepare(this);
        if (container.has(INode, false) && container.get(INode) !== config.host) {
            this.container = container.createChild();
        }
        this.container.register(Registration.instance(INode, config.host));
        this.strategy = (_a = config.strategy) !== null && _a !== void 0 ? _a : 1 /* getterSetter */;
        if (enhance) {
            const component = config.component;
            this.enhanceDefinition = CustomElement.getDefinition(CustomElement.isType(component)
                ? CustomElement.define({ ...CustomElement.getDefinition(component), template: this.host, enhance: true }, component)
                : CustomElement.define({ name: (void 0), template: this.host, enhance: true, hooks: new HooksDefinition(component) }));
        }
        this.hydratePromise = onResolve(this.runAppTasks('beforeCreate'), () => {
            const instance = CustomElement.isType(config.component)
                ? this.container.get(config.component)
                : config.component;
            const controller = (this.controller = Controller.forCustomElement(this, container, instance, this.host, null, this.strategy, false, this.enhanceDefinition));
            controller.hydrateCustomElement(container, null);
            return onResolve(this.runAppTasks('beforeCompose'), () => {
                controller.compile(null);
                return onResolve(this.runAppTasks('beforeCompileChildren'), () => {
                    controller.compileChildren();
                    this.hydratePromise = void 0;
                });
            });
        });
    }
    activate() {
        return onResolve(this.hydratePromise, () => {
            return onResolve(this.runAppTasks('beforeActivate'), () => {
                return onResolve(this.controller.activate(this.controller, null, this.strategy | 32 /* fromBind */, void 0), () => {
                    return this.runAppTasks('afterActivate');
                });
            });
        });
    }
    deactivate() {
        return onResolve(this.runAppTasks('beforeDeactivate'), () => {
            return onResolve(this.controller.deactivate(this.controller, null, this.strategy | 0 /* none */), () => {
                return this.runAppTasks('afterDeactivate');
            });
        });
    }
    /** @internal */
    runAppTasks(slot) {
        return resolveAll(...this.container.getAll(IAppTask).reduce((results, task) => {
            if (task.slot === slot) {
                results.push(task.run());
            }
            return results;
        }, []));
    }
    dispose() {
        var _a;
        (_a = this.controller) === null || _a === void 0 ? void 0 : _a.dispose();
    }
}
//# sourceMappingURL=app-root.js.map