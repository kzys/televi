/* File */
File = new Object();

File.exist = function(path) {
    if (window.widget) {
        return widget.system('/bin/test -f ' + path, null).status == 0;
    } else {
        return false;
    }
};
    
File.mtime = function(path) {
    var s = widget.system("/usr/bin/ruby -e 'puts File.mtime(ARGV.shift).tv_sec * 1000' " + path,
                          null).outputString;
    return new Date(s);
};

/* Main */
var stateChanged_ = false;
    
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
    stateChanged_ = true;
}

function showTableAndScroll()
{ 
    var f = document.getElementById('inner');
    if (f) {
        f.src = 'table.html';
    }
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
                      showTableAndScroll);
    } else {
        f.src = 'table.html';
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
    alert('onshow');

    if (! File.exist('table.html') ) {
        updateTable();
        return;
    }

    if ( needsUpdate(File.mtime('table.html'), new Date()) ) {
        updateTable();
    } else {
        var f = document.getElementById('inner');
        if (f.src.match(/\/table\.html$/)) { // already open?
            scrollToNow();
        } else {
            f.src = 'table.html';
        }
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

    if (window.widget) {
        widget.onshow = onshow;
        widget.onhide = onhide;

        onshow();
    }
}

function doneClicked()
{
    Flip.hideBack();

    if (stateChanged_) {
        stateChanged_ = false;
        updateTable();
    } else {
        // setTimeout('scrollToNow();', 100); // Wait until done of flip
    }
}
