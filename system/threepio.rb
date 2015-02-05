require 'artoo'
require 'socket'

connection :sphero, :adaptor => :sphero, :port => '/dev/tty.Sphero-RWR-RN-SPP'
device :sphero, :driver => :sphero

socket = TCPServer.new(7570)

work do
  while client = socket.accept
    puts "Connection received from #{client.peeraddr.inspect}"
    loop do
      begin
        while input = client.gets
          eval(input.gsub('\n', ';').gsub(';;', ';'))
        end
      rescue SyntaxError, NoMethodError, NameError => e
        puts e
      end
    end
    puts "Connection from #{client.peeraddr.inspect} terminated"
  end
end