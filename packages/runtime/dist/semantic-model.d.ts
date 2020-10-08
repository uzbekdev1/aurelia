import { AttrSyntax } from './attribute-parser';
import { BindingCommandInstance } from './binding-command';
import { AnyBindingExpression, Interpolation } from './binding/ast';
import { IDOM, INode } from './dom';
import { AttrInfo, BindableInfo, ElementInfo } from './resource-model';
export declare const enum SymbolFlags {
    type = 1023,
    isTemplateController = 1,
    isProjection = 2,
    isCustomAttribute = 4,
    isPlainAttribute = 8,
    isCustomElement = 16,
    isLetElement = 32,
    isPlainElement = 64,
    isText = 128,
    isBinding = 256,
    isAuSlot = 512,
    hasMarker = 1024,
    hasTemplate = 2048,
    hasAttributes = 4096,
    hasBindings = 8192,
    hasChildNodes = 16384,
    hasProjections = 32768
}
export declare type AnySymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomAttributeSymbol | CustomElementSymbol<TText, TElement, TMarker> | LetElementSymbol<TElement, TMarker> | PlainAttributeSymbol | PlainElementSymbol<TText, TElement, TMarker> | TemplateControllerSymbol<TText, TElement, TMarker> | TextSymbol<TText, TMarker>);
export declare type AttributeSymbol = (CustomAttributeSymbol | PlainAttributeSymbol);
export declare type SymbolWithBindings<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomAttributeSymbol | CustomElementSymbol<TText, TElement, TMarker> | LetElementSymbol<TElement, TMarker> | TemplateControllerSymbol<TText, TElement, TMarker>);
export declare type ResourceAttributeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomAttributeSymbol | TemplateControllerSymbol<TText, TElement, TMarker>);
export declare type NodeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomElementSymbol<TText, TElement, TMarker> | LetElementSymbol<TElement, TMarker> | PlainElementSymbol<TText, TElement, TMarker> | TemplateControllerSymbol<TText, TElement, TMarker> | TextSymbol<TText, TMarker>);
export declare type ParentNodeSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomElementSymbol<TText, TElement, TMarker> | PlainElementSymbol<TText, TElement, TMarker> | TemplateControllerSymbol<TText, TElement, TMarker>);
export declare type ElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomElementSymbol<TText, TElement, TMarker> | PlainElementSymbol<TText, TElement, TMarker>);
export declare type SymbolWithTemplate<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (TemplateControllerSymbol<TText, TElement, TMarker>);
export declare type SymbolWithMarker<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> = (CustomElementSymbol<TText, TElement, TMarker> | LetElementSymbol<TElement, TMarker> | TemplateControllerSymbol<TText, TElement, TMarker> | TextSymbol<TText, TMarker>);
/**
 * A html attribute that is associated with a registered resource, specifically a template controller.
 */
export declare class TemplateControllerSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
    syntax: AttrSyntax;
    info: AttrInfo;
    res: string;
    flags: SymbolFlags;
    physicalNode: TElement | null;
    template: ParentNodeSymbol<TText, TElement, TMarker> | null;
    templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null;
    marker: TMarker;
    private _bindings;
    get bindings(): BindingSymbol[];
    constructor(dom: IDOM, syntax: AttrSyntax, info: AttrInfo, res?: string);
}
export declare class ProjectionSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
    name: string;
    template: ParentNodeSymbol<TText, TElement, TMarker> | null;
    flags: SymbolFlags;
    constructor(name: string, template: ParentNodeSymbol<TText, TElement, TMarker> | null);
}
/**
 * A html attribute that is associated with a registered resource, but not a template controller.
 */
export declare class CustomAttributeSymbol {
    syntax: AttrSyntax;
    info: AttrInfo;
    res: string;
    flags: SymbolFlags;
    private _bindings;
    get bindings(): BindingSymbol[];
    constructor(syntax: AttrSyntax, info: AttrInfo, res?: string);
}
/**
 * An attribute, with either a binding command or an interpolation, whose target is the html
 * attribute of the element.
 *
 * This will never target a bindable property of a custom attribute or element;
 */
export declare class PlainAttributeSymbol {
    syntax: AttrSyntax;
    command: BindingCommandInstance | null;
    expression: AnyBindingExpression | null;
    flags: SymbolFlags;
    constructor(syntax: AttrSyntax, command: BindingCommandInstance | null, expression: AnyBindingExpression | null);
}
/**
 * Either an attribute on an custom element that maps to a declared bindable property of that element,
 * a single-value bound custom attribute, or one of several bindables that were extracted from the attribute
 * value of a custom attribute with multiple bindings usage.
 *
 * This will always target a bindable property of a custom attribute or element;
 */
export declare class BindingSymbol {
    command: BindingCommandInstance | null;
    bindable: BindableInfo;
    expression: AnyBindingExpression | null;
    rawValue: string;
    target: string;
    flags: SymbolFlags;
    constructor(command: BindingCommandInstance | null, bindable: BindableInfo, expression: AnyBindingExpression | null, rawValue: string, target: string);
}
/**
 * A html element that is associated with a registered resource either via its (lowerCase) `nodeName`
 * or the value of its `as-element` attribute.
 */
export declare class CustomElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
    physicalNode: TElement;
    info: ElementInfo;
    res: string;
    bindables: Record<string, BindableInfo | undefined>;
    flags: SymbolFlags;
    isTarget: true;
    templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null;
    isContainerless: boolean;
    marker: TMarker;
    slotName: string | undefined;
    private _customAttributes;
    get customAttributes(): CustomAttributeSymbol[];
    private _plainAttributes;
    get plainAttributes(): PlainAttributeSymbol[];
    private _bindings;
    get bindings(): BindingSymbol[];
    private _childNodes;
    get childNodes(): NodeSymbol<TText, TElement, TMarker>[];
    private _projections;
    get projections(): ProjectionSymbol<TText, TElement, TMarker>[];
    constructor(dom: IDOM, physicalNode: TElement, info: ElementInfo, res?: string, bindables?: Record<string, BindableInfo | undefined>);
}
export declare class LetElementSymbol<TElement extends INode = INode, TMarker extends INode = INode> {
    physicalNode: TElement;
    marker: TMarker;
    flags: SymbolFlags;
    toBindingContext: boolean;
    private _bindings;
    get bindings(): BindingSymbol[];
    constructor(dom: IDOM, physicalNode: TElement, marker?: TMarker);
}
/**
 * A normal html element that may or may not have attribute behaviors and/or child node behaviors.
 *
 * It is possible for a PlainElementSymbol to not yield any instructions during compilation.
 */
export declare class PlainElementSymbol<TText extends INode = INode, TElement extends INode = INode, TMarker extends INode = INode> {
    physicalNode: TElement;
    flags: SymbolFlags;
    isTarget: boolean;
    templateController: TemplateControllerSymbol<TText, TElement, TMarker> | null;
    hasSlots: boolean;
    private _customAttributes;
    get customAttributes(): CustomAttributeSymbol[];
    private _plainAttributes;
    get plainAttributes(): PlainAttributeSymbol[];
    private _childNodes;
    get childNodes(): NodeSymbol<TText, TElement, TMarker>[];
    constructor(dom: IDOM, physicalNode: TElement);
}
/**
 * A standalone text node that has an interpolation.
 */
export declare class TextSymbol<TText extends INode = INode, TMarker extends INode = INode> {
    physicalNode: TText;
    interpolation: Interpolation;
    marker: TMarker;
    flags: SymbolFlags;
    constructor(dom: IDOM, physicalNode: TText, interpolation: Interpolation, marker?: TMarker);
}
//# sourceMappingURL=semantic-model.d.ts.map