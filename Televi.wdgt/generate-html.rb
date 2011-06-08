=begin
Copyright (c) 2005-2006 KATO Kazuyoshi <kzys@8-p.info>
This source code is released under the MIT license.
=end

require 'kconv'
require 'open-uri'

def escape_multibyte_char(s)
  s.gsub(/./u) do |c|
    if c.length == 1
      c
    else
      "&##{c.unpack('U')};"
    end
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

CHANNEL_PATTERN = %r{<OPTION VALUE="/program/gridOneday.php\?.+?" >(.+?)</OPTION><!--(\d{4})-->}
TITLE_PATTERN = %r{<a .*?href="(/genre/detail.php3\?.*?&hsid=\d{4}\d{2}(\d{2})(\d{4})\d{3})" target=_self title="(\d{2}):(\d{2})-(\d{2}):(\d{2}) .*?">(.*)</a>}
TOMMOROW_PATTERN = %r{<TD rowspan=12 class=time width="10" valign="top"><b>24</b></TD>}


def create_channels(html)
  result = []

  # Half
  html = html[0, html.length / 2]

  html.scan(CHANNEL_PATTERN) do
    result << Channel.new($2.to_i, $1)
  end

  result
end

def parse_summery(lines)
  subtitle = nil

  while ln = lines.shift
    case ln
    when %r{<span class="style_corner">(.*?)</span>}
      corner = $1
      corner = nil if corner.empty?

      return (if subtitle and corner
                "#{subtitle}&#13;#{corner}"
              elsif subtitle or corner
                "#{subtitle}#{corner}"
              else
                nil
              end)
    when %r{<span class="style_subtitle">(.*?)</span>}
      subtitle = $1
    end
  end
end

def parse_programs(channels_map, html, today)
  tommorow = false

  lines = html.split(/\n/)

  while ln = lines.shift
    if md = ln.match(TITLE_PATTERN)
      title = md[8].gsub(/<.+?>/, '')

      summery = parse_summery(lines)
      unless summery
        summery = title
      end

      summery.gsub!(/&#.+?;/, ' ')
      title = "<div onmouseover=\"showSummery(this, event, '#{summery}')\"><a onclick=\"top.openONTV('#{md[1]}')\">#{title}</a></div>"

      day, ch, start_hour, start_min, last_hour, last_min = *(md[2, 6].collect do |i| i.to_i end)
      if tommorow
        start_hour += 24
        last_hour += 24
      elsif start_hour > last_hour
        last_hour += 24
      end

      show = Show.new(start_hour, start_min, last_hour, last_min, title)
      channels_map[ch] << show
    elsif ln =~ TOMMOROW_PATTERN
      tommorow = true
    end
  end
end

NEXT_PAGE_PATTERN = %r{<a href="\./oneday\?frame_status=child&page=(\d+).*?"><IMG border=0 src="/img/grid/right.gif"></a>}

def fetch_pages(location, fetcher = nil)
  fetcher ||= proc do |uri|
    open(uri).read
  end

  uri = 'http://www.ontvjapan.com/pg_grid_normal/oneday?'
  page = 1
  result = []

  loop do
    result << fetcher.call("#{uri}&page=#{page}")
    if result.last =~ NEXT_PAGE_PATTERN
      page += 1
    else
      break
    end
  end

  result
end

# Main
if __FILE__ == $0
  require 'pathname'

  path = Pathname.new("~/Library/Application Support/Televi").expand_path
  unless path.exist?
    path.mkdir
  end

  uri = (if ARGV.empty?
           "http://www.ontvjapan.com/program/gridOneday.php?"
         else
           "http://www.ontvjapan.com/program/gridOneday.php?tikicd=#{ARGV.shift}"
         end)

  html = nil
  page = 1

  channels = []
  channels_map = {}

  loop do
    $stderr.print("Getting page #{page}...")

    data = `./nsurlget '#{uri}&page=#{page}'`

    html = data.toutf8

    if channels.empty?
      $stderr.print("Parsing channels...")
      channels = create_channels(html)
      channels.each do |ch|
        channels_map[ch.number] = ch
      end
    end

    $stderr.print("Parsing page #{page}...")
    parse_programs(channels_map, html, Time.now.day)

    if html =~ NEXT_PAGE_PATTERN
      page += 1
    else
      break
    end
  end

  require 'erb'

  tmpl = ERB.new(File.open('tmpl/table.rhtml').read)
  File.open("#{path}/table.html", 'w').print(escape_multibyte_char(tmpl.result(binding)))

  tmpl = ERB.new(File.open('tmpl/channels.rhtml').read)
  File.open("#{path}/channels.html", 'w').print(escape_multibyte_char(tmpl.result(binding)))
end
