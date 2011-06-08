#! ruby
require 'rake/testtask'
require 'rake/clean'

CLEAN.include('**/*~')
CLOBBER.include('dist')

task :default => [ :test ]

Rake::TestTask.new do |t|
  t.libs << 'Televi.wdgt'
  t.test_files = FileList['test/test*.rb']
  t.verbose = true
end

task :dist => [ :clobber ] do
  Dir.mkdir('dist')
  system('zip -r dist/Televi.wdgt.zip Televi.wdgt/')
end
