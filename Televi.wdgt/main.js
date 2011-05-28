File = new Object();

File.exist = function(path) {
    if (window.widget) {
        return widget.system('/bin/test -f ' + path, null).status == 0;
    } else {
        return false;
    }
}
    
File.mtime = function(path) {
    var s = widget.system("/usr/bin/ruby -e 'puts File.mtime(ARGV.shift).tv_sec * 1000' " + path,
                          null).outputString;
    return new Date(s);
}


function scrollToHour(hour) {
    var w = document.getElementById('inner').contentWindow;
    var e = w.document.getElementById(''+hour);

    w.scrollTo(0, e.offsetTop);
}

function scrollToNow()
{
    var hours = (new Date()).getHours();
    if (hours < 5) {
        hours += 24;
    }
    scrollToHour(hours);
}

function changeState(value)
{
    if (window.widget) {
        widget.setPreferenceForKey(value, "state");
    }
}

function endHandler()
{ 
    var f = document.getElementById('inner');
    f.src = 'table.html';

    // setTimeout("scrollToNow()", 100);
}

function updateTable()
{
    alert('updateTable');
    
    var f = document.getElementById('inner');
    f.src = 'loading.html';

    if (window.widget) {
        var state = widget.preferenceForKey("state");
        if (! state) {
            state = '';
        }

        widget.system("/usr/bin/ruby generate-table.rb " + state + " > table.html",
                      endHandler);
    } else {
        f.src = document.getElementById('inner').src = 'table.html';
    }
}

function onshow()
{
    alert('onshow');

    var now = new Date();
    
    if ( (! File.exist('table.html')) ||
         (File.mtime('table.html').getDay() != now.getDay() && now.getHours() >= 5)) {
        updateTable();
    } else {
        scrollToNow();
    }
}

function onhide()
{
    ;
}

function setup()
{
    var back = document.getElementById("back");
    back.style.display = 'none';

    /*
    var iframe = document.getElementById('inner');
    if (File.exist('table.html')) {
        iframe.src = 'table.html';
    }
    */

    if (window.widget) {
        widget.onshow = onshow;
        widget.onhide = onhide;
    }

    scrollToNow();
}

function doneClicked()
{
    Flip.hideBack();
    setTimeout('scrollToNow();', 1000); // Wait until done of flip
}
