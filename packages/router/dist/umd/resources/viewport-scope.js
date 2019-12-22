(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "tslib", "@aurelia/runtime", "../router", "@aurelia/kernel"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const tslib_1 = require("tslib");
    const runtime_1 = require("@aurelia/runtime");
    const router_1 = require("../router");
    const kernel_1 = require("@aurelia/kernel");
    exports.ParentViewportScope = runtime_1.CustomElement.createInjectable();
    let ViewportScopeCustomElement = class ViewportScopeCustomElement {
        constructor(router, element, container, parent, parentController) {
            this.router = router;
            this.container = container;
            this.parent = parent;
            this.parentController = parentController;
            this.name = 'default';
            this.catches = '';
            this.collection = false;
            this.source = null;
            this.viewportScope = null;
            this.isBound = false;
            this.element = element;
        }
        create(controller, parentContainer, definition, parts) {
            // TODO(fkleuver): describe this somewhere in the docs instead
            // Under the condition that there is no `replace` attribute on this custom element's declaration,
            // and this custom element is containerless, its content will be placed in a part named 'default'
            // See packages/jit-html/src/template-binder.ts line 411 (`replace = 'default';`) for the logic that governs this.
            // We could tidy this up into a formal api in the future. For now, there are two ways to do this:
            // 1. inject the `@ITargetedInstruction` (IHydrateElementInstruction) and grab .parts['default'] from there, manually creating a view factory from that, etc.
            // 2. what we're doing right here: grab the 'default' part from the create hook and return it as the definition, telling the render context to use that part to compile this element instead
            // This effectively causes this element to render its declared content as if it was its own template.
            // We do need to set `containerless` to true on the part definition so that the correct projector is used since parts default to non-containerless.
            // Otherwise, the controller will try to do `appendChild` on a comment node when it has to do `insertBefore`.
            // Also, in this particular scenario (specific to viewport-scope) we need to clone the part so as to prevent the resulting compiled definition
            // from ever being cached. That's the only reason why we're spreading the part into a new object for `getOrCreate`. If we didn't clone the object, this specific element wouldn't work correctly.
            const part = parts['default'];
            return runtime_1.CustomElementDefinition.getOrCreate({ ...part, containerless: true });
        }
        afterCompile(controller) {
            this.container = controller.context.get(kernel_1.IContainer);
            // console.log('ViewportScope creating', this.getAttribute('name', this.name), this.container, this.parent, controller, this);
            // this.connect();
        }
        afterUnbound() {
            this.isBound = false;
        }
        connect() {
            if (this.router.rootScope === null) {
                return;
            }
            const name = this.getAttribute('name', this.name);
            const options = {};
            let value = this.getAttribute('catches', this.catches);
            if (value !== void 0) {
                options.catches = value;
            }
            value = this.getAttribute('collection', this.collection, true);
            if (value !== void 0) {
                options.collection = value;
            }
            // TODO: Needs to be bound? How to solve?
            options.source = this.source || null;
            this.viewportScope = this.router.connectViewportScope(this.viewportScope, name, this.container, this.element, options);
        }
        disconnect() {
            if (this.viewportScope) {
                this.router.disconnectViewportScope(this.viewportScope, this.container);
            }
            this.viewportScope = null;
        }
        beforeBind(flags) {
            this.isBound = true;
            this.$controller.scope = this.parentController.scope;
            this.connect();
            if (this.viewportScope !== null) {
                this.viewportScope.beforeBind();
            }
        }
        async beforeUnbind(flags) {
            if (this.viewportScope !== null) {
                this.viewportScope.beforeUnbind();
            }
            this.disconnect();
            return Promise.resolve();
        }
        getAttribute(key, value, checkExists = false) {
            const result = {};
            if (this.isBound) {
                return value;
            }
            else {
                if (this.element.hasAttribute(key)) {
                    if (checkExists) {
                        return true;
                    }
                    else {
                        value = this.element.getAttribute(key);
                        if (value.length > 0) {
                            return value;
                        }
                    }
                }
            }
            return void 0;
        }
    };
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], ViewportScopeCustomElement.prototype, "name", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", String)
    ], ViewportScopeCustomElement.prototype, "catches", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Boolean)
    ], ViewportScopeCustomElement.prototype, "collection", void 0);
    tslib_1.__decorate([
        runtime_1.bindable,
        tslib_1.__metadata("design:type", Object)
    ], ViewportScopeCustomElement.prototype, "source", void 0);
    ViewportScopeCustomElement = tslib_1.__decorate([
        runtime_1.customElement({
            name: 'au-viewport-scope',
            template: '<template></template>',
            containerless: true,
            injectable: exports.ParentViewportScope
        }),
        tslib_1.__param(0, router_1.IRouter),
        tslib_1.__param(1, runtime_1.INode),
        tslib_1.__param(2, kernel_1.IContainer),
        tslib_1.__param(3, exports.ParentViewportScope),
        tslib_1.__param(4, runtime_1.IController),
        tslib_1.__metadata("design:paramtypes", [Object, Object, Object, ViewportScopeCustomElement, Object])
    ], ViewportScopeCustomElement);
    exports.ViewportScopeCustomElement = ViewportScopeCustomElement;
});
//# sourceMappingURL=viewport-scope.js.map