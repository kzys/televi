/*
 * Copyright (c) 2005-2006 KATO Kazuyoshi <kzys@8-p.info>
 * This source code is released under the MIT license.
 */

var width_;
var state_;
var isUpdating_;
var home_;

var tooltip_;

// debug = function(s) { alert(s) };
debug = function(s) { console.log(s) };

function showSummery(element, event, text)
{
    tooltip_.onmouseover(element, event, text);
}

function scrollToHour(hour) {
    if (! $('#hour-' + hour).empty()) {
        $('#tableContent').css({ top: (-e.offsetTop + 20) + 'px' });
        $('#bigNumber').html(hour);
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

function endCat()
{
    $('table').innerHTML = 'hello!';
}

function readFile(path) {
    var req = new XMLHttpRequest();

    req.open("GET", path, false);
    req.send(null);

    var resp = req.responseText;
    if (resp) {
        return resp;
    } else {
        return null;
    }
}
function loadHTMLs()
{
    debug('>> loadHTMLs');
    return;

    var path = home_ + '/Library/Application Support/Televi/';

    $('table').innerHTML = readFile(path + 'table.html');
    $('channels').innerHTML = readFile(path + 'channels.html');
}

function endGenerate()
{
    debug('>> endGenerate');

    $('message').hide();
    $('navigation').show();

    $('#prefs').removeAttr('disabled');

    loadHTMLs();
    setTimeout('scrollToNow();', 1000);

    isUpdating_ = false;
}

function updateHTML()
{
    debug('>> updateHTML');

    if (isUpdating_) {
        return;
    } else {
        isUpdating_ = true;
    }

    if (window.widget) {
        var cmd = widget.system("/usr/bin/ruby generate-html.rb " + state_,
                                endGenerate);
        $('#navigation').hide();
        $('#message').show();
        cmd.onreaderror = function(s) {
            $('message').innerHTML = s;
        };
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

function checkUpdate()
{
    var path = home_ + '/Library/Application Support/Televi/';
    var now = new Date();

    if (! File.exist(path + 'table.html')) {
        debug('Not found');
        updateHTML();
        return true;
    } else if (needsUpdate(File.mtime(path + 'table.html'), now)) {
        debug('Need to update');
        updateHTML();
        return true;
    } else {
        return false;
    }
}

function onshow()
{
    debug('onshow{');

    // Tooltip.hide();

    var now = new Date();

    for (var i = 0; i < 24; i++) {
        if (i == now.getHours()) {
            $('#navi-' + i).css({ color: '#fff' });
        } else {
            $('#navi-' + i).css({ color: '#336' });
        }
    }

    if (checkUpdate()) {
        ;
    } else if ($('table').innerHTML == '') {
        loadHTMLs();
        setTimeout('scrollToNow();', 1000);
    } else {
        scrollToNow();
    }
    debug('}onshow');
}

function onhide()
{
    // Tooltip.hide();
}

function setup()
{
    XMLHttpRequest.prototype.setRequestHeader = function () {};
    var pattern = /<A href="\/pg_grid_normal\/\?.*?&service_code=(\d+)&.*?">(.*?)<\/A>/g;
    $.get('http://www.ontvjapan.com/pg_change_area/?bc_code=00', function (data) {
        data.replace(pattern, function (s, serviceCode, name) {
            var option = $('<option/>').attr('value', serviceCode).html(name);
            $('#state').append(option);
        })
    });

    debug('>> setup');

    $('#back, #message').hide();

    isUpdating_ = false;
    tooltip_ = new Tooltip('tooltip');

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
    }

    createGenericButton(document.getElementById('done'), 'Done', doneClicked);

    $('#table').html('');
    setInterval('checkUpdate();', 1000 * 60 * 60);

    resizeWidget();
    onshow();
}

function resizeWidget()
{
    debug('resizeWidget');

    if (window.widget) {
        window.resizeTo(88 * width_ + 28, 180);
        $('#message').css({ width: (88 * width_ + 28) + 'px' });
    }
    $('#front').css({ width: (88 * width_) + 'px' });
    $('#table').css({ width: (88 * width_ + 20) + 'px' });
}

function changeState(s)
{
    state_ = s;
    if (window.widget) {
        widget.setPreferenceForKey(state_, "state");
    }

    $('#prefs').attr('disabled', 'disabled');
    updateHTML();
}

Flip.beforeFlip = function()
{
    debug('Flip.beforeFlip');

    if (window.widget) {
        window.resizeTo(640, 180);
        $('#message').css({ width: '640px' });
    }

    $('#width').val(width_ + '');

    var ary = $('#state').get(0).options;
    for (var i = 0; i < ary.length; i++) {
        if (ary[i].value == state_) {
            $('#state').attr('selectedIndex', i);
            break;
        }
    }
}

function doneClicked()
{
    debug('doneClicked');

    Flip.hideBack();

    width_ = parseInt($('width').value);
    if (88 * width_ + 28 > screen.width) {
        width_ = Math.floor((screen.width - 28) / 88);
        window.moveTo(0, window.screenY);
    }

    if (window.widget) {
        widget.setPreferenceForKey(width_, "width");
    }

    resizeWidget();
    scrollToNow();
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
        document.write('<a onclick="scrollToHour(' +
                       (i + 5) + ')" id="navi-' + hour + '">' +
                       hour + '</a>');
    }
}
