import { CollectionObserver, ForOfStatement, IndexMap, IObservedArray, LifecycleFlags as LF, ObservedCollection } from '@aurelia/runtime';
import { IRenderLocation } from '../../dom';
import { IViewFactory } from '../../templating/view';
import type { ISyntheticView, ICustomAttributeController, IHydratableController, ICustomAttributeViewModel, IHydratedController, IHydratedParentController, ControllerVisitor } from '../../templating/controller';
declare type Items<C extends ObservedCollection = IObservedArray> = C | undefined;
export declare class Repeat<C extends ObservedCollection = IObservedArray> implements ICustomAttributeViewModel {
    location: IRenderLocation;
    parent: IHydratableController;
    factory: IViewFactory;
    readonly id: number;
    hasPendingInstanceMutation: boolean;
    observer?: CollectionObserver;
    views: ISyntheticView[];
    key?: string;
    forOf: ForOfStatement;
    local: string;
    readonly $controller: ICustomAttributeController<this>;
    items: Items<C>;
    private normalizedItems?;
    constructor(location: IRenderLocation, parent: IHydratableController, factory: IViewFactory);
    binding(initiator: IHydratedController, parent: IHydratedParentController, flags: LF): void | Promise<void>;
    attaching(initiator: IHydratedController, parent: IHydratedParentController, flags: LF): void | Promise<void>;
    detaching(initiator: IHydratedController, parent: IHydratedParentController, flags: LF): void | Promise<void>;
    itemsChanged(flags: LF): void;
    handleCollectionChange(indexMap: IndexMap | undefined, flags: LF): void;
    private checkCollectionObserver;
    private normalizeToArray;
    private activateAllViews;
    private deactivateAllViews;
    private deactivateAndRemoveViewsByKey;
    private createAndActivateAndSortViewsByKey;
    dispose(): void;
    accept(visitor: ControllerVisitor): void | true;
}
export {};
//# sourceMappingURL=repeat.d.ts.map