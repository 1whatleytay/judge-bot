cp /mnt/source.java /tmp/Program.java

javac /tmp/Program.java
java --class-path=/tmp Program < /mnt/input.txt
