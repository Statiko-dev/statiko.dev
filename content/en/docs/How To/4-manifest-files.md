---
title: "Manifest files"
linkTitle: "Manifest files"
slug: manifest-files
weight: 4
description: |
  Using manifest files to configure the server's behavior
---

Statiko lets app developers define various details of the web server configuration, for example:

- Enable URL rewriting and redirects
- Configure the headers related to client-side caching
- Manage pages for 404 (Not Found) and 403 (Forbidden) errors
- Set headers to enable security features, such as [`Content-Security-Policy`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy), [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- Set any other HTTP header, such as `Content-Type`, `Content-Disposition`, etc, or custom `X-*` headers

These options are defined with a Statiko manifest file, which is a YAML file called `_statiko.yaml` shipped together with your app's code.

Shipping a manifest with your app is completely optional, but it unlocks capabilities that are very useful for deploying Progressive Web Apps (PWA's), sites with clean URLs, downloads, and many more cases.

## Manifest file structure

The manifest file should be called `_statiko.yaml` and placed in the bundle's top directory (not in a sub-folder). The name of the manifest file can be configured with the [`manifestFile`](TODO) configuration option.

The YAML document contains a dictionary with five keys, all optional:

```yaml
# Dictionary with options for files based on their extension
files:
  # ...

# Dictionary with options for documents at a certain path
locations:
  #...

# Key-value dictionary with URL rewrites (server returning a different file but without sending the client a redirect)
rewrite:
  #...

# Documents to show with 404 or 403 errors
page404: "..."
page403: "..."
```

### `files`

`files` is a dictionary with options for files based on their extension.

Each item's key in this dictionary is the extension(s) that you want to match. You can have multiple extensions separating them with a vertical bar `|`.

The item's value is another dictionary with two keys:

- `headers`: a key-value dictionary with names and values for custom headers
- `clientCaching`: a short-hand to configure all client-caching related headers (`Expires`, `Pragma` and `Cache-Control`). The value is a time expression, as defined in the [nginx configuration](http://nginx.org/en/docs/syntax.html), for example `10s` for 10 seconds, `5m` for 5 minutes, `1M 2w` for 1 month and 2 weeks (44 days).

For example, the snippet below tells all clients to cache jpg and png images for 1 month, and sets a custom header `X-Foo` with the value `bar` for PDF files:

```yaml
# Files dictionary applies rules to files based on their extensions
files:
  # Rules for files ending in jpg or png
  "jpg|png":
    # Tell clients to cache the images for 1 month (automatically sets `Expires`, `Cache-Control` and `Pragma`)
    clientCaching: 1M
  # Rules for files ending in pdf
  pdf:
    # Add custom headers
    headers:
      # Add a custom header `X-Foo` with value `bar`
      "X-Foo": "bar"
```

For keys in the `files` dictionary, you can also use certain short-hands for common file types:

- `_images` is equivalent to `jpg|jpeg|png|gif|ico|svg|svgz|webp|tif|tiff|dng|psd|heif|bmp`
- `_videos` is equivalent to `mp4|m4v|mkv|webm|avi|mpg|mpeg|ogg|wmv|flv|mov`
- `_audios` is equivalent to `mp3|mp4|aac|m4a|flac|wav|ogg|wma`
- `_fonts` is equivalent to `woff|woff2|eot|otf|ttf`

> When adding custom headers, Statiko does currently not maintain a list of "allowed headers". Setting some headers, such as [`Strict-Transport-Security`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) might have long-lasting consequences, so use with caution.

### `locations`

`locations` is a dictionary that works very similarly to `files`, with the difference than keys in the dictionary are not file extensions, but full location expressions according to [nginx's location blocks syntax](https://www.journaldev.com/26342/nginx-location-directive), which support regular expressions as well. Using location blocks lets you configure in details the rules to apply to files in a certain location.

For example:

```yaml
# Locations dictionary applies rules to pages as matched by nginx location blocks
locations:
  # Apply to all files in the / location, which means all files in the site
  "/":
    # Add a custom header
    headers:
      # Add the `X-Hello` header with value `world`
      "X-Hello": "world"
  # Apply to all files in the /static/ folder
  "/static/":
    # Tell clients to cache the response for 1 year
    clientCaching: 1y
    # Add a custom header
    headers:
      # Add the `X-Static` header with value `1`
      "X-Static": "1"
  # Match all files that contain "en" (case-insensitive) in the name
  "~* en":
    # Add a custom header
    headers:
      # Add the `Content-Language` header with value `en`
      "Content-Language": "en"
```

### `rewrite`

`rewrite` lets you define URL-rewriting rules.

Unlike redirects, when a request matches a URL that needs to be re-written, the server returns a different file to satisfy the same request; the URL in the browser's address bar remains the same. Support for URL rewrites is important in scenarios such as Progressive Web Apps (PWA's), or for websites which want to leverage "clean URLs".

`rewrite` is a key-value dictionary, in which keys are locations to match (as a Perl Compatible Regular Expressions, or PCRE), and the value is the document to load. For example:

```yaml
# Configure URL rewrite
rewrite:
  # Rewrite page1.html to page2.html
  "/page1.html": "page2.html"
  # Rewrite requests to files inside /blog/* to /blog/article-*.html
  # This example uses a regular expression
  "^/blog/(.*)$": "/blog/article-$1.html"
```

### `page404` and `page403`

The two keys `page404` and `page403` both accept the path of a file to display in case the server needs to return a 404 (Not Found) or 403 (Forbidden) response.

For example:

```yaml
# In case of a request for a file that doesn't exist, load the not-found.html file
# Note that we are NOT adding the / at the beginning of the file, as that's implied
page404: "not-found.html"
# Similarly, load the same file for a request for a folder that doesn't have an index.html file
page403: "not-found.html"
```
