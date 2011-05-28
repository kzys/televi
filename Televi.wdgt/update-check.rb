if File.exist?("table.html") and File.mtime("table.html") == Time.now.day
  exit 0
else
  exit 1
end
