FROM node:21-alpine3.18

# Install build dependencies and Python
RUN apk add --no-cache \
    python3 \
    make \
    build-base \
    g++

RUN ln -sf python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY *.js ./

COPY entrypoint.sh /usr/local/bin

RUN chmod +x "/usr/local/bin/entrypoint.sh"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

