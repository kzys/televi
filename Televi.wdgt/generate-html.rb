=begin
Copyright (C) 2005 KATO Kazuyoshi <kzys@8-p.info>
    All rights reserved.
    This is free software with ABSOLUTELY NO WARRANTY.

This file is released under the terms of the MIT X11 license.
=end

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

# CHANNEL_PATTERN = %r{<a name="dummy\d{4}" target="_top" href="gridChannel.php?.+?&ch=(\d{4})">(.+?)</a>}m
CHANNEL_PATTERN = %r{<OPTION VALUE="/program/gridOneday.php\?.+?" >(.+?)</OPTION><!--(\d{4})-->}
TITLE_PATTERN = %r{<a .*?href="(/genre/detail.php3\?.*?&hsid=\d{4}\d{2}(\d{2})(\d{4})\d{3})" target=_self title="(\d{2}):(\d{2})-(\d{2}):(\d{2}) .*?">(.*)</a>}
TOMMOROW_PATTERN = %r{<TD rowspan=12 class=time width="10" valign="top"><b>24</b></TD>}
NEXT_PAGE_PATTERN = %r{<a href="/program/gridOneday\.php\?.*?&page=(\d+).*?"><IMG border=0 src="/images/grid/right.gif"</a>}

def create_channels(html)
  result = []

  # Half
  html = html[0, html.length / 2]

  html.scan(CHANNEL_PATTERN) do
    result << Channel.new($2.to_i, $1)
  end

  result
end

def parse_programs(channels_map, html, today)
  tommorow = false

  html.each do |ln|
    if md = ln.match(TITLE_PATTERN)
      day, ch, start_hour, start_min, last_hour, last_min = *(md[2, 6].collect do |i| i.to_i end)
      title = "<a onclick=\"top.openONTV('#{md[1]}')\">#{md[8].gsub(/<.+?>/, '')}</a>"

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

# Main
uri = if ARGV.empty?
        "http://www.ontvjapan.com/program/gridOneday.php?"
      else
        "http://www.ontvjapan.com/program/gridOneday.php?tikicd=#{ARGV.shift}"
      end

html = nil
page = 1

channels = []
channels_map = {}

loop do
  # $stderr.print(page, " ")

  data = `./nsurlget '#{uri}&page=#{page}'`
  html = Iconv.to_utf8(data)

  if channels.empty?
    channels = create_channels(html)
    channels.each do |ch|
      channels_map[ch.number] = ch
    end
  end

  parse_programs(channels_map, html, Time.now.day)

  if html =~ NEXT_PAGE_PATTERN
    page += 1
  else
    break
  end
end
puts

require 'erb'

tmpl = ERB.new(File.open('table-tmpl.html').read)
File.open('table.html', 'w').print(tmpl.result(binding))

tmpl = ERB.new(File.open('channels-tmpl.html').read)
File.open('channels.html', 'w').print(tmpl.result(binding))
