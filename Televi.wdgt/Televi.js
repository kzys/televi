/*
 * Copyright (c) 2005-2006 KATO Kazuyoshi <kzys@8-p.info>
 * This source code is released under the MIT license.
 */

var width_;
var state_;

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
    app.update();
    return true;

    var path = '';
    var now = new Date();

    if (! File.exist(path + 'table.html')) {
        debug('Not found');
        return true;
    } else if (needsUpdate(File.mtime(path + 'table.html'), now)) {
        debug('Need to update');
        app.update();
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

function createOptions(callback) {
    var PATTERN =
        /<A href="\/pg_grid_normal\/\?.*?&service_code=(\d+)&.*?">(.*?)<\/A>/g;

    $.get('http://www.ontvjapan.com/pg_change_area/?bc_code=00',
          function (data) {
              var options = [];
              data.replace(PATTERN, function (s, serviceCode, name) {
                  options.push($('<option/>').attr('value',
                                                   serviceCode).html(name));
              });
              callback(options)
          });
}

function MainWidget() {
    this._updating = false;
}

MainWidget.prototype = {
    navigationHours: function () {
        var html = '';

        for (var i = 0; i < 24; i++) {
            var hour = ((i + 5) % 24);
            html += ('<a onclick="scrollToHour(' +
                     (i + 5) + ')" id="navi-' + hour + '">' +
                     hour + '</a>');
        }

        return html;
    },
    update: function () {
        debug('>> updateHTML');

        if (this._updating) {
            return;
        } else {
            this._updating = true;
        }

        if (! window.widget) {
            return;
        }

        var that = this;

        var callback = function (pages) {
            var str = pages.map(function (s) {
                return s.replace(/\t/g, ' ');
            }).join('\t');

            var command;
            command = widget.system("/usr/bin/ruby generate-html.rb",
                                    function () {
                                        var ary = command.outputString.split(/\t/);
                                        $('#table').html(ary[0]);
                                        $('#channels').html(ary[1]);
                                        that.endGenerate();
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
    },

    endGenerate: function () {
        debug('>> endGenerate');

        $('#message').hide();
        $('#navigation').show();

        $('#prefs').removeAttr('disabled');

        setTimeout('scrollToNow();', 1000);

        this._updating = false;
    }
};

var app;

function setup()
{
    XMLHttpRequest.prototype.setRequestHeader = function () {};

    debug('>> setup');

    $('#back, #message').hide();

    createOptions(function (options) {
        $('#state').append(options);
    });

    app = new MainWidget;
    $('#navigation .inner').html(app.navigationHours());
    $('#update').click(function () {
        app.update()
    });
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
    app.update();
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
