# -*- coding: utf-8 -*-
require 'test/unit'
require 'generate-html'

class TestParser < Test::Unit::TestCase
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
