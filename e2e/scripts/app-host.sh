# Sourced by run-in-docker.sh and build-e2e-image.sh.
#
# The host name under which the tests reach the application, and which the test image's client uses for its hocuspocus
# WebSocket (REACT_APP_HOCUSPOCUS_URL, baked in when the client is built). The app container gets it as a network
# alias in the run's own Docker network, so two runs at once do not share it. The network guard compares the host of
# every WebSocket with the host of LOWCODER_BASE_URL (e2e/src/fixtures.ts), so both must use this name.
readonly E2E_APP_HOST="lowcoder-e2e-app"
readonly E2E_APP_PORT=3000
readonly E2E_HOCUSPOCUS_PATH="/hocuspocus"
