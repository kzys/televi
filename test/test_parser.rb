# -*- coding: utf-8 -*-
require 'test/unit'
require 'generate-html'

class TestParser < Test::Unit::TestCase
  def test_fetch_pages_service_code
    fetch_pages(nil,
                proc do |uri|
                  refute_match(/service_code/, uri)
                  ''
                end)

    fetch_pages(123,
                proc do |uri|
                  assert_match(/service_code=123/, uri)
                  ''
                end)
  end

  def test_fetch_pages
    pages = [ '<a href="./oneday?frame_status=child&page=2&airdate=20110608"><IMG border=0 src="/img/grid/right.gif"></a>',
              '' ]
    assert_equal(pages.clone,
                 fetch_pages(nil, proc do pages.shift end))
  end

  def test_create_channels
    assert_equal(3, create_channels(<<END).length)
<select name="" class="QuickViewSelect" id="StandardGrid24">
<option value="">- チャンネル Quick View -</option>
<option value="frame_status=child&qview=000130031&airdate=20110608">ＮＨＫ総合</option>
<option value="frame_status=child&qview=000130041&airdate=20110608">ＮＨＫＥテレ</option>
<option value="frame_status=child&qview=000130004&airdate=20110608">日本テレビ</option>
</select><!--#####</チャンネルQuickView>#####-->
END
  end
end
