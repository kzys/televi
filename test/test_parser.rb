require 'test/unit'
require 'generate-html'

class TestParser < Test::Unit::TestCase
  def test_fetch_pages
    assert_equal(3, fetch_pages(nil).length)
  end
end
