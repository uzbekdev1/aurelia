import * as tslib_1 from "tslib";
import { bindable, customAttribute, INode } from '@aurelia/runtime';
export class CSSModulesProcessorRegistry {
    register(container, ...params) {
        const classLookup = Object.assign({}, ...params);
        let ClassCustomAttribute = class ClassCustomAttribute {
            constructor(element) {
                this.element = element;
            }
            binding() {
                this.valueChanged();
            }
            valueChanged() {
                if (!this.value) {
                    this.element.className = '';
                    return;
                }
                this.element.className = this.value.split(' ')
                    .map(x => classLookup[x] || x)
                    .join(' ');
            }
        };
        tslib_1.__decorate([
            bindable
        ], ClassCustomAttribute.prototype, "value", void 0);
        ClassCustomAttribute = tslib_1.__decorate([
            customAttribute('class'),
            tslib_1.__param(0, INode)
        ], ClassCustomAttribute);
        container.register(ClassCustomAttribute);
    }
}
//# sourceMappingURL=css-modules-registry.js.map