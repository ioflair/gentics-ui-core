import {Component} from 'angular2/core';
import {GTX_FORM_DIRECTIVES} from '../../../index';

@Component({
    template: require('./form-components.tpl.html'),
    directives: [GTX_FORM_DIRECTIVES]
})
export class FormComponents {
    options: string[] = ['foo', 'bar', 'baz'];
    selectMultiVal: string[] = ['bar', 'baz'];
    selectVal: string = 'bar';

    rangeValDynamic: number = 35;
}
