#!/usr/bin/env bash

IFS='
'
cd -P "$(dirname "$0")"

if [[ "$#" -lt  1 ]]; then
    echo "Error: run with ./run_with_docker.sh EXERCISE_NAME"
    exit 1
fi

EXERCISE_NAME=$1

docker run --read-only \
			--network none \
			--memory 500M \
			--cpus 2.0 \
			--user 1000:1000 \
			--env EXERCISE="$EXERCISE_NAME" \
			--env USERNAME=msessa \
			--env HOME=/jail \
			--env TMPDIR=/jail \
			--workdir /jail \
			--tmpfs /jail:size=100M,noatime,exec,nodev,nosuid,uid=1000,gid=1000,nr_inodes=5k,mode=1700 \
			--volume "$(pwd)"/../student:/jail/student:ro \
			-t js_tests

