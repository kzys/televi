var interval = null;

function needToUpdate()
{
    return widget.system("/usr/bin/ruby update-check.rb", null).status != 0;
}

function endHandler() {
    var w = document.getElementById('inner').contentWindow;
    w.document.location.href = 'table.html';

    setTimeout("scrollToNow()", 100);
}

function updateTable() {
    if (! window.widget)
        return;

    if (needToUpdate()) {
        var w = document.getElementById('inner').contentWindow;
        w.document.location.href = 'loading.html';
        
        var state = widget.preferenceForKey("state");
        if (state == null) state = "";
        
        widget.system("/usr/bin/ruby generate-table.rb " + state + " > table.html",
                      endHandler);
    } else {
        endHandler();
    }
}

function forceUpdateTable() {
    if (! window.widget)
        return;

    widget.system('/bin/rm table.html', null);
    updateTable();
}

function writeTimeNavigation()
{
    for (var i = 0; i < 24; i++) {
	var hour = (4 + i) % 24;
	
	document.write("<a href='javascript:scrollToHour(" + hour + ")'>" +
		       hour +
		       "</a> ");
    }
}

function changeState(value)
{
    if (window.widget) {
        widget.setPreferenceForKey(value, "state");
    }
}

function scrollToHour(hour) {
    var w = document.getElementById('inner').contentWindow;
    var e = w.document.getElementById(''+hour);

    var top = e.offsetTop;
    
    if (top < 100)
        top = 0;
    else
        top -= 0;
    
    w.scrollTo(0, top);
}

function scrollToNow() {
    var now = new Date();
    scrollToHour(now.getHours());
}

function onshow()
{
    if (! interval) {
        interval = setInterval(1000 * 60 * 60, updateTable);
    }
    scrollToNow();
}

function onhide()
{
    /*
    if (! interval) {
        clearInterval(updateTable);
        interval = null;
    }
    */
}

function setup()
{
    var e = document.getElementById("back");
    e.style.display = 'none';

    if (window.widget) {
        widget.onshow = onshow;
        // widget.onhide = onhide;
    }

    updateTable();
}

function doneClicked()
{
    Flip.hideBack();
    forceUpdateTable();
}
