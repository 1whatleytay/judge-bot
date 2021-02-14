cp /mnt/source.hs /tmp/source.hs

ghc -o /tmp/build.o /tmp/source.hs
/tmp/build.o < /mnt/input.txt
