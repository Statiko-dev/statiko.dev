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
# Array of options for documents at a certain path or file types
rules:
  - # ...
  - # ...

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

### `rules`

`rules` is an array that lets you define options for documents based on their path or extension.

Each item in the array contains an identifier for what to match, as well as an `options` dictionary.

You can match documents based on:

- `exact: "/path"`: matches exact paths (equivalent to using the `=` modifier in the nginx location block)
- `prefix: "/path"`: matches paths that begin with the prefix (equivalent to using no modifier in the nginx location block)
- `match: "regular expression"`: matches paths based on a case-insensitive regular expression (equivalent to using the `~*` modifier in the nginx location block). You can use any Perl-compatible regular expression.
  - With the `match` key, you can also specify `caseSensitive: true` (default is false) to match the regular expression in a case-sensitive way (equivalent to using the `~` modifier in the nginx location block)
- `file: "extension"`: matches files with a certain extension (or a list of extensions, separated by a comma), case-insensitive

For example:

```yaml
# Rules for documents at a specific path or with a specific extension
rules:
  # Applies the options defined below to the document at the exact path "/path/to/file.html"
  - exact: "/path/to/file.html"
    options:
      # ...
  # Applies the options defined below to all documents in the "/music/" folder
  - prefix: "/music/"
    options:
      # ...
  # When prefix is "/", applies the options to all documents
  - prefix: "/"
    options:
      # ...
  # Matches paths by regular expression; for example, this one matches all files that contain `.en.` in the file name (anywhere in the path)
  - match: "\.en\."
    # When using a regular expression match, by default it's case-insensitive. You can make it case-sensitive by setting `caseSensitive: true`
    caseSensitive: true
    options:
      # ...
  # Applies to all png files
  - file: "png"
    options:
      # ...
  # Applies to jpg and jpeg files
  - file: "jpg,jpeg"
    options:
      # ...
```

When matching with the `file` key, you can also use certain short-hands for common file types:

- `file: "_images"` is equivalent to `jpg,jpeg,png,gif,ico,svg,svgz,webp,tif,tiff,dng,psd,heif,bmp`
- `file: "_videos"` is equivalent to `mp4,m4v,mkv,webm,avi,mpg,mpeg,ogg,wmv,flv,mov`
- `file: "_audios"` is equivalent to `mp3,mp4,aac,m4a,flac,wav,ogg,wma`
- `file: "_fonts"` is equivalent to `woff,woff2,eot,otf,ttf`

### `rules.$i.options`

The `options` dictionary for each rule can contain these keys:

- `headers`: a key-value dictionary with names and values for custom headers
- `clientCaching`: a short-hand to configure all client-caching related headers (`Expires`, `Pragma` and `Cache-Control`). The value is a time expression, as defined in the [nginx configuration](http://nginx.org/en/docs/syntax.html), for example `10s` for 10 seconds, `5m` for 5 minutes, `1M 2w` for 1 month and 2 weeks (44 days).

For example, the snippet below tells all clients to cache all images for 1 month, and sets a custom header `Content-Disposition` with the value `attachment` (which suggests browsers to prompt files to be downloaded rather than displayed inline) for all files in the `/videos/` folder:

```yaml
# Rules dictionary applies rules to documents based on their path or file extension
rules:
  # Rules for images
  - file: "_images"
    # Options to apply
    options:
      # Tell clients to cache the images for 1 month (automatically sets `Expires`, `Cache-Control` and `Pragma`)
      clientCaching: 1M
  # Rules for documents in the "/videos/" folder
  - prefix: "/videos/"
    # Options to apply
    options:
      # Add custom headers
      headers:
        # Add the header `Content-Disposition` with value `attachment`
        "Content-Disposition": "attachment"
```

> Note: for security reasons, only a subset of headers can be set with a manifest file: `Expires`, `Cache-Control`, `Content-Disposition`, `Content-Encoding`, `Content-Language`, `Content-MD5`, `Content-Security-Policy`, `Content-Type`, `Last-Modified`, `Link`, `Location`, `P3P`, `Pragma`, `Refresh`, `Set-Cookie`, `Vary`, `Warning`, as well as any header starting with `X-`.

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
