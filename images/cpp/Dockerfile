FROM gcc:10.2

RUN useradd -ms /bin/bash judge-bot
USER judge-bot
WORKDIR /home/judge-bot

COPY bootstrap.sh .

ENTRYPOINT ./bootstrap.sh
