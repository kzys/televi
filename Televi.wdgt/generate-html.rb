# -*- coding: utf-8 -*-
=begin
Copyright (c) 2005-2006 KATO Kazuyoshi <kzys@8-p.info>
This source code is released under the MIT license.
=end

require 'open-uri'
require 'erb'
require 'pathname'

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

TOMMOROW_PATTERN = %r{<TD rowspan=12 class=time width="10" valign="top"><b>24</b></TD>}

CHANNEL_PATTERN = %r{<option value="frame_status=child&qview=\d{5}(\d{4})&.*?">(.+?)</option>}

def create_channels(html)
  result = []

  html.scan(CHANNEL_PATTERN) do
    result << Channel.new($1.to_i, $2)
  end

  result
end

def parse_summery(lines)
  subtitle = nil

  while ln = lines.shift
    case ln
    when %r{<SPAN class="style_corner">(.*?)</SPAN>}
      corner = $1
      corner = nil if corner.empty?

      return (if subtitle and corner
                "#{subtitle}&#13;#{corner}"
              elsif subtitle or corner
                "#{subtitle}#{corner}"
              else
                nil
              end)
    when %r{<SPAN class="style_subtitle">(.*?)</SPAN>}
      subtitle = $1
    end
  end
end

TITLE_PATTERN = %r{<A class="regular" title="(\d+):(\d+)-(\d+):(\d+) .+?" target="_self" href="(/pg_detail/show\?program_id=\d+)">(.+?)</A>}

def parse_programs(channels_map, html, today)
  tommorow = false

  lines = html.split(/\n/)

  while ln = lines.shift
    if md = ln.match(TITLE_PATTERN)
      title = md[6].gsub(/<.*?>/, '')

      summery = parse_summery(lines)
      unless summery
        summery = title
      end

      # summery.gsub!(/&#.+?;/, ' ')
      # title = "<div onmouseover=\"showSummery(this, event, '#{summery}')\"><a onclick=\"top.openONTV('#{md[1]}')\">#{title}</a></div>"

      start_hour, start_min, last_hour, last_min = *(md[1, 4].collect do |i|
                                                       i.to_i
                                                     end)

      if md[5] =~ %r{\?program_id=(\d{4})\d{4}\d{2}\d{2}}
        ch = $1.to_i
      else
        raise "Failed to parse: #{md[5]}"
      end

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

  pages = fetch_pages(ARGV.shift)

  first = pages.first
  channels = create_channels(first[0, first.length / 2])

  channels_map = {}
  channels.each do |ch|
    channels_map[ch.number] = ch
  end

  parse_programs(channels_map, pages.join(''), Time.now.day)


  path = Pathname.new("~/Library/Application Support/Televi").expand_path
  unless path.exist?
    path.mkdir
  end

  tmpl = ERB.new(File.open('tmpl/table.rhtml').read)
  File.open("#{path}/table.html", 'w').print(tmpl.result(binding))

  tmpl = ERB.new(File.open('tmpl/channels.rhtml').read)
  File.open("#{path}/channels.html", 'w').print(tmpl.result(binding))
end
