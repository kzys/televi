/*
  Copyright (C) 2005 KATO Kazuyoshi <kzys@8-p.info>
      All rights reserved.
      This is free software with ABSOLUTELY NO WARRANTY.

  This file is released under the terms of the MIT X11 license.
*/

var width_ = 7;
var state_ = '';
var system_ = null;
var isBack_ = false;

// debug = function(s) { alert(s) };
debug = function(s) {};

function scrollToHour(hour) {
    debug('scrollToHour');

    var w = frames['table'];
    debug('w = ' + w);

    var e = w.document.getElementById('hour-'+hour);
    debug('e = ' + e);

    if (e) {
        frames['table'].scrollTo(0, e.offsetTop);
    }
}

function scrollToNow()
{
    debug('scrollToNow');

    var hours = (new Date()).getHours();
    if (hours < 5) {
        hours += 24;
    }
    scrollToHour(hours);
}

function afterUpdateHTML()
{
    debug('afterUpdateHTML');

    if (! isBack_) {
        frames['table'].location.href = 'table.html';
    } else {
        frames['channels'].location.href = 'channels.html';
    }

    system_ = null;
}

function updateHTML()
{
    debug('updateHTML');

    if (! isBack_) {
        frames['table'].location.href = 'loading.html';
    }

    if (window.widget && system_ == null) {
        debug('call ruby!');
        system_ = widget.system("/usr/bin/ruby generate-html.rb " + state_,
                                afterUpdateHTML);
    } else {
        showTableAndScroll();
    }
}

function needsUpdate(mtime, now)
{
    if (now.getDay() != mtime.getDay()) {
        if (now.getHours() >= 5) {
            return true;
        }
    } else {
        if (now.getHours() >= 5 && mtime.getHours() < 5) {
            return true;
        }
    }

    return false;
}

function onshow()
{
    debug('onshow{');

    if (! isBack_) {
        debug('front');
        if (! File.exist('table.html')) {
            updateHTML();
        } else if (needsUpdate(File.mtime('table.html'), new Date())) {
            updateHTML();
        } else {
            if (frames['table'].location.href.match(/\/table\.html$/)) {
                scrollToNow();
                debug('scroll');
            } else {
                frames['table'].location.href = 'table.html';
                debug('table.html');
            }
        }
    }
    debug('}onshow');
}

function onhide()
{
    ;
}

function setup()
{
    debug('setup{');

    var back = document.getElementById("back");
    back.style.display = 'none';

    if (window.widget) {
        widget.onshow = onshow;
        widget.onhide = onhide;

        debug('  load preferences');
        width_ = widget.preferenceForKey("width");
        if (width_) {
            width_ = parseInt(width_);
        } else {
            width_ = 7;
        }
        state_ = widget.preferenceForKey("state");
        if (! state_) {
            state_ = '';
        }

        /*
        if (File.exist('table.html')) {
            frames['table'].location.href = 'table.html';
        }
        */
    }

    resizeWidget();

    debug('}')
}

function resizeWidget()
{
    debug('resizeWidget');
    if (window.widget) {
        window.resizeTo(88 * width_ + 28, 200);
    }
    document.getElementById('table').style.width = (width_ * 88) + 'px';
    document.getElementById('front').style.width = (width_ * 88) + 'px';
}

function changeState(s)
{
    state_ = s;
    if (window.widget) {
        widget.setPreferenceForKey(state_, "state");
    }

    frames['channels'].location.href = 'loading.html';
    updateHTML();
}

Flip.beforeFlip = function()
{
    debug('Flip.beforeFlip');

    isBack_ = true;

    document.getElementById('width').value = width_ + '';
    if (window.widget) {
        window.resizeTo(640, 200);
    }
}

function doneClicked()
{
    debug('doneClicked');

    Flip.hideBack();

    width_ = parseInt(document.getElementById('width').value);
    if (window.widget) {
        widget.setPreferenceForKey(width_, "width");
    }

    resizeWidget();

    isBack_ = false;
}
