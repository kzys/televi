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
    $('#hour-' + hour).each(function (index, element) {
        console.log(index);
        $('#tableContent').css({ top: -element.offsetTop + 20 });
        $('#bigNumber').html(hour);
    });
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

function endGenerate()
{
    debug('>> endGenerate');

    $('#message').hide();
    $('#navigation').show();

    $('#prefs').removeAttr('disabled');

    setTimeout('scrollToNow();', 1000);

    isUpdating_ = false;
}

var ONE_DAY = 'http://www.ontvjapan.com/pg_grid_normal/oneday';
var NEXT_PAGE_PATTERN = /<IMG border=0 src="\/img\/grid\/right\.gif">/;

function fetchPages(location, callback, pages) {
    if (! pages) {
        pages = [];
    }

    var query = { page: pages.length+1 };
    if (location) {
        query.service_code = location;
    }

    $.ajax({
        url: ONE_DAY,
        data: query,
        success: function (data) {
            pages.push(data);
            if (data.match(NEXT_PAGE_PATTERN)) {
                fetchPages(location, callback, pages);
            } else {
                callback(pages);
            }
        }
    });
}

function updateHTML()
{
    debug('>> updateHTML');

    if (isUpdating_) {
        return;
    } else {
        isUpdating_ = true;
    }

    if (! window.widget) {
        return;
    }

    var callback = function (pages) {
        var str = pages.map(function (s) {
            return s.replace(/\t/g, ' ');
        }).join('\t');

        var command;
        command = widget.system("/usr/bin/ruby generate-html.rb",
                                function () {
                                    var ary = command.outputString.split(/\t/);
                                    console.log(ary);
                                    $('#table').html(ary[0]);
                                    $('#channels').html(ary[1]);
                                    endGenerate();
                                });
        command.onreaderror = function(s) {
            $('#message').innerHTML = s;
        };
        command.write(str);
        command.close();
    }

    $('#navigation').hide();
    $('#message').show();
    fetchPages(null, callback);
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
    updateHTML();
    return true;

    var path = home_ + '/Library/Application Support/Televi/';
    var now = new Date();

    if (! File.exist(path + 'table.html')) {
        debug('Not found');
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
    } else if ($('#table').innerHTML == '') {
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
    tooltip_ = new Tooltip($('#tooltip').get(0));

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
