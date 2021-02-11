cp /mnt/source.cs project/Program.cs
dotnet run --no-restore --no-launch-profile --no-dependencies /p:StartupObject=Program -p project < /mnt/input.txt
