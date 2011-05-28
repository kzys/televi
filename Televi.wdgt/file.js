/*
  Copyright (C) 2005 KATO Kazuyoshi <kzys@8-p.info>
      All rights reserved.
      This is free software with ABSOLUTELY NO WARRANTY.
  
  This file is released under the terms of the MIT X11 license.
*/

File = new Object();

File.exist = function(path) {
    if (! window.widget) {
        return true;
    }

    var s = widget.system("/bin/test -f '" + path + "'", null).status;
    return s == 0;
};

File.mtime = function(path) {
    // return new Date();
    
    var s = widget.system("/usr/bin/ruby -e 'puts File.mtime(ARGV.shift).tv_sec * 1000' '" + path + "'",
                          null).outputString;
    return new Date(s);
};

File.mkdir = function(path) {
    var s = widget.system("mkdir -p '" + path + "'", null).status;
    return s == 0;
};
