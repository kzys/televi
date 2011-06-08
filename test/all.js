test('fetchPages - simple', function () {
    var server = this.sandbox.useFakeServer();
    server.respondWith('GET',
                       'http://www.ontvjapan.com/pg_grid_normal/oneday?page=1',
                       [ 200, {}, 'hello' ]);

    var callback = this.spy();
    fetchPages(null, callback);

    server.respond();
    ok(callback.calledWith([ 'hello' ]));
});

test('fetchPages', function () {
    var pages = [ '<IMG border=0 src="/img/grid/right.gif">', 'end' ];

    var base = 'http://www.ontvjapan.com/pg_grid_normal/oneday';
    var server = this.sandbox.useFakeServer();
    server.respondWith('GET',
                       base + '?page=1&service_code=123',
                       [ 200, {}, pages[0] ]);
    server.respondWith('GET',
                       base + '?page=2&service_code=123',
                       [ 200, {}, pages[1] ]);

    var callback = this.spy();
    fetchPages(123, callback);

    server.respond();
    ok(callback.calledWith(pages));
});
