require 'artoo'

connection :sphero, :adaptor => :sphero, :port => '/dev/tty.Sphero-RWR-RN-SPP'
device :sphero, :driver => :sphero

work do
  loop do
    begin
      puts "Enter a command:"
      input = gets
      eval(input)
    rescue SyntaxError => se
      puts se
    end
  end
end
