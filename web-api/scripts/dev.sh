#!/bin/sh
# ts-node-dev respawns when a workspace dep's `dist` changes, but never rebuilds
# one itself, so keep a tsc --watch on each dep beside it.
set -eu

cd "$(dirname "$0")/.."

tsc="../node_modules/.bin/tsc"

# Docker's bind mounts swallow inotify events, so poll wherever the rest of the
# dev stack already does.
watch_mode=""
if [ "${CHOKIDAR_USEPOLLING:-}" = "true" ]; then
  watch_mode="--watchFile dynamicPriorityPolling --watchDirectory dynamicPriorityPolling"
fi

# The build info lives in `dist` so it is ignored and cleaned with the output.
shared_args="-p ../shared/tsconfig.json --incremental --tsBuildInfoFile ../shared/dist/.tsbuildinfo"

shared_pid=""

cleanup() {
  trap - EXIT INT TERM
  if [ -n "$shared_pid" ]; then kill "$shared_pid" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

# Blocking first pass: the API must not boot against a stale dist. `--incremental`
# is what keeps it one pass — the watchers below read the same build info and
# re-emit nothing, so ts-node-dev never sees a dist rewrite mid-boot and hang on
# a respawn it started while loading.
# shellcheck disable=SC2086 # these hold flag lists, not single arguments
"$tsc" $shared_args

# shellcheck disable=SC2086
"$tsc" $shared_args --watch --preserveWatchOutput $watch_mode &
shared_pid=$!

../node_modules/.bin/ts-node-dev --respawn --transpile-only src/main.ts
