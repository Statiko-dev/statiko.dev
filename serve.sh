#!/bin/sh
set -e

echo "\033[0;1mBuilding for environment: \033[0;1;35mdevelopment\033[0;0m"

# Fetch stkcli docs
echo "\033[0;1mFetch docs for stkcli\033[0;0m"
node fetch-stkcli-docs

# Compile the code with the "production" environment
echo "\033[0;1mBuilding and starting web server...\033[0;0m"
hugo serve --environment=development
