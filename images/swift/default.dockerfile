FROM swift:5.3.3

RUN useradd -ms /bin/bash judge-bot
WORKDIR /home/judge-bot

COPY bootstrap.sh .
RUN chmod +x ./bootstrap.sh

USER judge-bot

ENTRYPOINT ./bootstrap.sh
