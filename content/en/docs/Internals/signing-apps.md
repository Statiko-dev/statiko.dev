---
title: "Signing apps"
linkTitle: "Signing apps"
description: |
  How Statiko signs app bundles
---

Statiko supports signed app bundles, which guarantee the integrity of the code and its origin. The stkcli can generate signatures automatically, with the code signing key on Azure Key Vault.

This document explains how to replicate the code signing process using OpenSSL, for development.

## Signature algorithm

Two-step process:

1. Calculate the SHA-256 checksum of the file (the .tar.bz2 bundle)
2. Sign the hash with RSA using a 4096-bit key

## Sign using OpenSSL

### Generate a signing key

On the developer's machine, generate a public and private key pair:

````sh
openssl genrsa \
  -out codesign.key \
  4096
openssl rsa \
  -in codesign.key \
  -pubout \
  -out codesign.pub
````

### Sign a file

Example of signing a file, printing a base64-encoded signature:

````sh
FILE="file-to-sign.tar.bz2"

openssl dgst \
  -sha256 \
  -sign codesign.key \
  $FILE \
| base64 > $FILE.sig
````

## Verify a signature

Example of verifying a signature:

````sh
FILE="file-to-sign.tar.bz2"

base64 -d $FILE.sig > $FILE.sig.bin
openssl dgst \
  -sha256 \
  -verify codesign.pub \
  -signature $FILE.sig.bin $FILE
````
