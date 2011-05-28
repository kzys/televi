/*
  Copyright (C) 2005 KATO Kazuyoshi <kzys@8-p.info>
      All rights reserved.
      This is free software with ABSOLUTELY NO WARRANTY.

  This file is released under the terms of the MIT X11 license.
*/

var width_;
var state_;
var system_ = false;
var isBack_ = false;
var home_;

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
    debug('>> afterUpdateHTML');

    var path = 'file://' + home_ + '/Library/Application Support/Televi/';
    debug(path)
    
    if (! isBack_) {
        frames['table'].location.href = path + 'table.html';
    } else {
        frames['channels'].location.href = path + 'channels.html';
    }

    system_ = false;
}

function updateHTML()
{
    debug('>> updateHTML');

    if (! isBack_) {
        frames['table'].location.href = 'loading.html';
    }

    if (window.widget && system_ == false) {
        debug('Call ruby!');
        system_ = widget.system("/usr/bin/ruby generate-html.rb " + state_,
                                afterUpdateHTML);
        system_.onreaderror = function(s) {
            var e;
            if (! isBack_) {
                e = frames['table'].document.getElementById('message');                
            } else {
                e = frames['channels'].document.getElementById('message');                
            }
            
            if (e) {
                e.innerHTML = s;
            }
        };
    } else {
        ;
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
        var now = new Date();

        for (var i = 0; i < 24; i++) {
            if (i == now.getHours()) {
                $('navi-' + i).style.color = '#fff';
            } else {
                $('navi-' + i).style.color = '#336';
            }
        }
        
        var path = home_ + '/Library/Application Support/Televi/';
        debug(path);
        if (! File.exist(path + 'table.html')) {
            debug('Not found');
            updateHTML();
        } else if (needsUpdate(File.mtime(path + 'table.html'), now)) {
            debug('Need to update');
            updateHTML();
        } else {
            if (frames['table'].location.href.match(/\/table\.html$/)) {
                scrollToNow();
            } else {
                frames['table'].location.href = 'file:' + path + 'table.html';
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
    debug('>> setup');

    var back = $("back");
    back.style.display = 'none';

    if (widget) {
        widget.onshow = onshow;
        widget.onhide = onhide;

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

        home_ = widget.system('/bin/echo -n $HOME', null).outputString;

        setTimeout("onshow();", 1500);
   }

    resizeWidget();
}

function resizeWidget()
{
    debug('resizeWidget');
    if (window.widget) {
        window.resizeTo(88 * width_ + 28, 180);
    }
    $('table').style.width = (width_ * 88) + 'px';
    $('front').style.width = (width_ * 88) + 'px';
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

    $('width').value = width_ + '';
    if (window.widget) {
        window.resizeTo(640, 180);
    }
}

function doneClicked()
{
    debug('doneClicked');

    Flip.hideBack();

    width_ = parseInt($('width').value);
    if (width_ > 10) {
        width_ = 10;
    }
    
    if (window.widget) {
        widget.setPreferenceForKey(width_, "width");
    }

    resizeWidget();

    isBack_ = false;
}

function openONTV(path)
{
    if (window.widget)
        widget.openURL('http://www.ontvjapan.com' + path);
    else
        alert(path);
}

function writeNavigationHours()
{
    for (var i = 0; i < 24; i++) {
        var hour = ((i + 5) % 24);
        document.write('<a onclick="scrollToHour(' + (i + 5) + ')" id="navi-' + hour + '">' + hour + '</a>');
    }
}
