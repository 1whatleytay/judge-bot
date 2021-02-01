cp /mnt/source.java /tmp/Program.java

javac /tmp/Program.java
java -classpath "/tmp" Program < /mnt/input.txt