require 'iconv'

class Iconv
  def self.to_utf8(src)
    ic = Iconv.new('UTF-8', 'EUC-JP')
    result = ''
    
    begin
      result << ic.iconv(src)
    rescue Iconv::IllegalSequence => e
      result << e.success
      ch, src = e.failed.split(//, 2)
      retry
    end

    result
  end
end

class Channel
  def initialize(number, title)
    @number = number
    @title = title

    @programs = {}
  end

  def fetch(hour)
    @programs[hour]
  end

  def << (show)
    # 5:00 - 6:00 don't regist at 6
    last = if show.last_min > 0
             show.last_hour
           else
             show.last_hour - 1
           end
    
    # regist
    (show.start_hour..last).each do |h|
      @programs[h] ||= []
      @programs[h] << show
    end
  end

  attr_reader :number, :title
end

class Show
  def initialize(start_hour, start_min, last_hour, last_min, title)
    @start_hour = start_hour
    @start_min = start_min
    @last_hour = last_hour
    @last_min = last_min
    @title = title
  end

  attr_reader :title, :start_hour, :start_min, :last_hour, :last_min

  alias_method :hour, :start_hour
  alias_method :min,  :start_min
end

CHANNEL_PATTERN = %r{<a name="dummy\d{4}" target="_top" href="gridChannel.php?.+?&ch=(\d{4})">(.+?)</a>}m
TITLE_PATTERN = %r{<a .*?href="/genre/detail.php3\?.*?&hsid=\d{4}\d{2}\d{2}(\d{4})\d{3}" target=_self title="(\d{2}):(\d{2})-(\d{2}):(\d{2}) .*?">(.*)</a>}

def parse_channels(html)
  result = []

  # Half
  html = html[0, html.length / 2]

  html.scan(CHANNEL_PATTERN) do 
    result << Channel.new($1.to_i, $2.strip.gsub(%r{</?b>}, ''))
  end

  result
end

def parse_programs(channels_map, html)
  prev_hour = 0
  tommorow = false
  html.scan(TITLE_PATTERN) do
    ch = $1.to_i
    start_hour, start_min, last_hour, last_min = $2.to_i, $3.to_i, $4.to_i, $5.to_i
    title = $6.gsub(/<.+?>/, '')

    if start_hour == 0
      tommorow = true
    end

    if tommorow
      start_hour += 24
      last_hour += 24
    elsif start_hour > last_hour
      last_hour += 24
    end

    show = Show.new(start_hour, start_min, last_hour, last_min, title)
    # p show
    channels_map[ch] << show
  end
end

# Main
require 'open-uri'

uri = if ARGV.empty?
        "http://www.ontvjapan.com/program/gridOneday.php"
      else
        "http://www.ontvjapan.com/program/gridOneday.php?tikicd=#{ARGV.shift}"
      end

# uri = 'ontv.html'
data = open(uri).read
# File.open('ontv.html', 'w').write(data)

html = Iconv.to_utf8(data)

channels = parse_channels(html)

channels_map = {}
channels.each do |ch|
  channels_map[ch.number] = ch
end
parse_programs(channels_map, html)

require 'erb'
tmpl = ERB.new(File.open('table-tmpl.html').read)
print tmpl.result(binding)
