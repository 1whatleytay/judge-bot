FROM mcr.microsoft.com/dotnet/sdk:5.0

RUN useradd -ms /bin/bash judge-bot
WORKDIR /home/judge-bot

COPY bootstrap.sh .
RUN chmod +x ./bootstrap.sh

USER judge-bot

RUN dotnet new console -lang "C#" -n "project"

ENTRYPOINT ./bootstrap.sh
