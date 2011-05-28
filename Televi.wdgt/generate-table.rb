def euc_to_utf8(src)
  require 'iconv'

  ic = Iconv.new('UTF-8', 'EUC-JP')
  result = ''

  begin
    result << ic.iconv(src)
  rescue Iconv::IllegalSequence => e
    result << e.success
    ch, src = e.failed.split(//, 2)
    # result << '?'
    retry
  end

  result
end

require 'open-uri'

uri = "http://www.ontvjapan.com/program/gridOneday.php?tikicd=0#{ARGV.shift}"

str = open(uri).read

html = euc_to_utf8(str)

File.open('a.html', 'w').write(str)

# html = euc_to_utf8(open("ontv.html").read)

CHANNEL_ORDER_PATTERN = %r{<a name="dummy\d+" target="_top" href="gridChannel.php.*?ch=(\d{4})">}
CHANNEL_PATTERN = %r{<OPTION VALUE="/program/gridOneday.php.*?#(\d+)" >(.+?)</OPTION>}
PROGRAM_PATTERN = %r{<span class="style_title"><a .*?href="/genre/detail.php3.*?&hsid=\d{6}(\d{2})(\d{4})\d{3}" target=_self title="(\d+):(\d+)-\d+:\d+.*?">(.+?)</a></span><br>}

channel_order = []
channels = []
programs = {}

target = :channel

today = Time.now

html.each do |ln|
  ch = nil

  if target == :channel and ln =~ CHANNEL_PATTERN
    ch = $1.to_i
    channels[ch] = $2
  elsif target == :channel and ln =~ CHANNEL_ORDER_PATTERN
    channel_order << $1.to_i
  elsif ln =~ PROGRAM_PATTERN
    target = :program
    day, ch, hour, min = *( [$1, $2, $3, $4].collect do |i| i.to_i end )
    title = $5.gsub(/<.*?>/, '')

    if day != today.day
      next
    end

    programs[ch] ||= {}
    programs[ch][hour] ||= []

    programs[ch][hour] << "<strong>%02d:%02d</strong><br/>%s" % [hour, min, title]
  end
end

print(open('table-header.html').read)

puts("<table id='channels'><tr><th class='column'></th>")

channel_order.each do |i|
  puts("<th class='channel'>#{channels[i]}</th>")
end

puts("</tr></table>")

hours = []
24.times do |i|
  hours << (4 + i) % 24
end

puts("<table id='programs'>")
hours.each do |hour|
  row = if hour & 1 == 1
          'odd'
        else
          'even'
        end
  puts "<tr class='#{row}'><th class='column' id='#{hour}'>#{hour}</th>"
  channel_order.each do |ch|
    back = false

    puts "<td>"
    h = hour
    until programs[ch][h]
      h = (h - 1) % 24
      back = true
    end

    program = if back
                programs[ch][h].last
              else
                programs[ch][h].join("<br />")
              end

    puts "#{program}</td>"
  end
  puts "</tr>"
end

print <<END
</table>
</body>
</html>
END

