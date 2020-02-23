#!/bin/sh
set -e

echo "\033[0;1mBuilding for environment: \033[0;1;35mproduction\033[0;0m"

# Remove old compiled data
echo "\033[0;1mCleaning destination directory...\033[0;0m"
rm -rf public || true

# Install npm dependencies
echo "\033[0;1mInstall npm dependencies\033[0;0m"
npm ci

# Fetch stkcli docs
echo "\033[0;1mFetch docs for stkcli\033[0;0m"
node fetch-stkcli-docs

# Compile the code with the "production" environment
echo "\033[0;1mBuilding...\033[0;0m"
hugo --gc --environment=production

# Copy static files
echo "\033[0;1mCopy static files...\033[0;0m"
cp -v _statiko.yaml public/

# Remove files that shouldn't be published
echo "\033[0;1mRemoving unnecessary files...\033[0;0m"
rm -v public/*.sh || true
rm -v public/Makefile || true
rm -v public/**/.gitignore || true
