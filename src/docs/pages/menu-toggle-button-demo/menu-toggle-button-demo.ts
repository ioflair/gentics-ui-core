import {Component} from '@angular/core';

@Component({
    template: require('./menu-toggle-button-demo.tpl.html')
})
export class MenuToggleButtonDemo {
    componentSource: string = require('!!raw-loader!../../../components/menu-toggle-button/menu-toggle-button.component');
}
