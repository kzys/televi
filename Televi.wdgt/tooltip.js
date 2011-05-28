/*
 * Copyright (c) 2005-2006 KATO Kazuyoshi <kzys@8-p.info>
 * This source code is released under the MIT license.
 */

var Tooltip = Class.create();

Tooltip.prototype = {
    onmouseover: function(element, event, content)
    {
        this.x = event.x;
        this.y = event.y + 16;

        if (this.shown) {
            if (this.target == element) {
                return;
            } else {
                this.target = element;
                this.hide();
            }
        }

        this.element.innerText = content;

        if (! this.showTimeout) {
            this.showTimeout = setTimeout(this.show.bind(this), 1000);
        }
    },

    show: function()
    {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;

        this.shown = true;

        var e = this.element;
        Element.show(e);

        e.style.left = this.x + 'px';
        if (e.offsetLeft + e.offsetWidth > document.body.offsetWidth) {
            e.style.left = (document.body.offsetWidth - e.offsetWidth) + 'px';
        }

        /* FIXME: 140 is magic number. */
        e.style.top = this.y + 'px';
        if (e.offsetTop + e.offsetHeight > 140) {
            e.style.top = (140 - e.offsetHeight) + 'px';
        }

        if (! this.hideTimeout) {
            this.hideTimeout = setTimeout(this.hide.bind(this), 5000);
        }
    },

    hide: function()
    {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;

        Element.hide('tooltip');
        this.shown = false;
    },

    initialize: function(el)
    {
        this.element = $(el);
        Element.hide(el);

        this.shown = false;
        this.showTimeout = null;
        this.hideTimeout = null;
    }
};
