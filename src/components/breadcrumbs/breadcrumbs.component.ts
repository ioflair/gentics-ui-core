import { Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { OnChanges, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { RouterLinkWithHref } from '@angular/router';
import { Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UserAgentRef } from '../modal/user-agent-ref';

export interface IBreadcrumbLink {
    href?: string;
    route?: any;
    text: string;
    tooltip?: string;
    [key: string]: any;
}

export interface IBreadcrumbRouterLink {
    route: any[];
    text: string;
    tooltip?: string;
    [key: string]: any;
}

/**
 * A Breadcrumbs navigation component.
 *
 * ```html
 * <gtx-breadcrumbs></gtx-breadcrumbs>
 * ```
 */
@Component({
    selector: 'gtx-breadcrumbs',
    templateUrl: './breadcrumbs.tpl.html'
})
export class Breadcrumbs implements OnChanges, OnDestroy {

    /**
     * A list of links to display
     */
    @Input() links: IBreadcrumbLink[];


    /**
     * A list of RouterLinks to display
     */
    @Input() routerLinks: IBreadcrumbRouterLink[];

    /**
     * If true all the folder names that fit into one line are shown completely and one ellipsis is shown at the end
     */
    @Input() get multiline(): boolean {
        return this.isMultiline;
    }
    set multiline(val: boolean) {
        this.isMultiline = val != undefined && val !== false;
    }

    /**
     * If true the breadcrumbs are always expanded
     */
    @Input() get multilineExpanded(): boolean {
        return this.isMultilineExpanded;
    }
    set multilineExpanded(val: boolean) {
        this.isMultilineExpanded = val != undefined && val !== false;
    }

    /**
     * Controls whether the navigation is disabled.
     */
    @Input() get disabled(): boolean {
        return this.isDisabled;
    }
    set disabled(val: boolean) {
        this.isDisabled = val != undefined && val !== false;
    }

    /**
     * Fires when a link is clicked
     */
    @Output() linkClick = new EventEmitter<IBreadcrumbLink | IBreadcrumbRouterLink>();

    /**
     * Fires when the expand button is clicked
     */
    @Output() multilineExpandedChange = new EventEmitter<boolean>();

    isMultiline: boolean = false;
    isMultilineExpanded: boolean = false;
    isDisabled: boolean = false;
    isOverflowing: boolean = false;

    isHeightSame: boolean = false;

    defaultHeight: number = 0;
    currentHeight: number = 0;

    backLink: IBreadcrumbLink | IBreadcrumbRouterLink;
    @ViewChildren(RouterLinkWithHref) routerLinkChildren: QueryList<RouterLinkWithHref>;

    @ViewChild('lastPart')
    lastPart: ElementRef;

    private subscriptions = new Subscription();
    private resizeEvents = new BehaviorSubject<void>(null);

    constructor(private elementRef: ElementRef,
                private userAgent: UserAgentRef) { }

    ngOnInit(): void {
        let element: HTMLElement = this.elementRef.nativeElement;
        if (element) {
            // Listen in the "capture" phase to prevent routerLinks when disabled
            element.firstElementChild.addEventListener('click', this.preventClicksWhenDisabled, true);
        }

        this.resizeEvents
            .debounceTime(200)
            .take(1)
            .subscribe(() => {
                this.defaultHeight = this.lastPart.nativeElement.clientHeight;
            });

        const resizeSub = this.resizeEvents
            .debounceTime(200)
            .subscribe(() => {
                if (this.userAgent.isIE11) {
                    this.currentHeight = this.lastPart.nativeElement.clientHeight + 3;
                } else {
                    this.currentHeight = this.lastPart.nativeElement.clientHeight;
                }
                this.isHeightSame = this.defaultHeight === this.currentHeight;
                this.isOverflowing = this.checkIfOverflowing(this.lastPart.nativeElement);
            });
        this.subscriptions.add(resizeSub);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['links'] || changes['routerLinks']) {
            let allLinks = (this.links || []).concat(this.routerLinks || []);
            this.backLink = allLinks[allLinks.length - 2];
        }
    }

    ngOnDestroy(): void {
        let element: HTMLElement = this.elementRef.nativeElement;
        element.firstElementChild.removeEventListener('click', this.preventClicksWhenDisabled, true);
        this.subscriptions.unsubscribe();
    }

    onLinkClicked(link: IBreadcrumbLink | IBreadcrumbRouterLink, event: Event): void {
        if (this.isDisabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
        } else {
            this.linkClick.emit(link);
        }
    }

    multilineExpandedChanged(): void {
        this.multilineExpanded = !this.multilineExpanded;
        this.multilineExpandedChange.emit(this.multilineExpanded);
        this.resizeEvents.next(null);
    }

    onResize(event: any): void {
        this.resizeEvents.next(null);
    }

    ngAfterViewInit(): void {
        this.preventDisabledRouterLinks();
        this.routerLinkChildren.changes.subscribe(() => this.preventDisabledRouterLinks());
        this.resizeEvents.next(null);
    }

    private preventClicksWhenDisabled = (ev: Event): void => {
        if (this.isDisabled) {
            let target = ev.target as HTMLElement;
            if (target.tagName.toLowerCase() === 'a' && target.classList.contains('breadcrumb')) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
        }
    }

    /**
     * Checks if the specified element is currently overflowing.
     * @returns true if the element is currently overflowing, otherwise false.
     */
    private checkIfOverflowing(element: Element): boolean {
        const fullWidth = element.scrollWidth;
        let visibleWidth = element.clientWidth;

        // In IE11 the visibleWidth is 1px smaller than the fullWidth even if the breadcrumbs fit into a single line.
        if (this.userAgent.isIE11) {
            ++visibleWidth;
        }

        return fullWidth > visibleWidth;
    }

    /**
     * Workaround/Hack for the native angular "RouterLink" having no way to disable navigation on click.
     */
    private preventDisabledRouterLinks(): void {
        const thisComponent = this;
        const createsCompileErrorIfRouterLinkAPIChanges: keyof RouterLinkWithHref = 'onClick';

        for (const link of this.routerLinkChildren.filter(link => !link.hasOwnProperty('onClick'))) {
            const originalOnClick = link.onClick;
            link.onClick = function interceptedOnClick(...args: any[]): boolean {
                if (thisComponent.isDisabled) {
                    return true;
                } else {
                    return originalOnClick.apply(this, args);
                }
            };
        }
    }
}
