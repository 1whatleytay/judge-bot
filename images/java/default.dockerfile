FROM openjdk:14

RUN useradd -ms /bin/bash judge-bot
WORKDIR /home/judge-bot

COPY bootstrap.sh .
RUN chmod +x ./bootstrap.sh

USER judge-bot

ENTRYPOINT ./bootstrap.sh
