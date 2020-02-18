#!/bin/sh

echo "\033[0;1mBuilding for environment: \033[0;1;35mproduction\033[0;0m"

# Remove old compiled data
echo "\033[0;1mCleaning destination directory...\033[0;0m"
rm -rf public || true

# Fetch stkcli docs
echo "\033[0;1mFetch docs for stkcli\033[0;0m"
node fetch-stkcli-docs

# Compile the code with the "production" environment
echo "\033[0;1mBuilding...\033[0;0m"
hugo --environment=production

# Remove files that shouldn't be published
echo "\033[0;1mRemoving unnecessary files...\033[0;0m"
rm -v public/*.sh || true
rm -v public/Makefile || true
rm -v public/**/.gitignore || true
