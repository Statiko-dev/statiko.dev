// This script fetches the docs for stkcli from the repo

'use strict'

// GitHub repository for stkcli
const repo = 'ItalyPaleAle/stkcli'

// Path where the docs (YAML files) are stored in the repo
const docsPath = 'docs/yaml'

// Destination in this folder where to store the files
const destination = 'content/en/docs/CLI/'

// Base URL for "See also"
const baseUrl = '/docs/cli/'

// Node modules
const fetch = require('node-fetch')
const yaml = require('js-yaml')
const fs = require('fs')
const promisify = require('util').promisify

// Promisified methods
const readdirPromise = promisify(fs.readdir)
const unlinkPromise = promisify(fs.unlink)
const writeFilePromise = promisify(fs.writeFile)

// Do the work
;(async function main() {
    // Remove all existing files
    console.log('Cleaning up files')
    const removePromises = (await readdirPromise(destination)).map(async (el) => {
        // Remove all files besides _index.md
        if (el != '_index.md') {
            await unlinkPromise(destination + el)
        }
    })
    await Promise.all(removePromises)

    // Request the list of files
    console.log('Fetching list of files')
    const response = await fetch('https://api.github.com/repos/' + repo + '/contents/' + docsPath, {
        headers: {
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    const data = await response.json()
    
    // Iterate through the list
    console.log('Fetching all files')
    const filePromises = data.map((el) => getFile(el.name, el.download_url))
    await Promise.all(filePromises)

    console.log('Done')
})()

// Get a documentation item
async function getFile(name, rawUrl) {
    // Request the YAML document
    const response = await fetch(rawUrl)
    const raw = await response.text()
    const data = yaml.safeLoad(raw)

    // Replace extension with .md and replace underscores with dashes
    name = name.replace(/_/g, '-').slice(0, -4) + 'md'
    
    // Generate the documentation page
    const markdown = buildDocumentationPage(data)
    await writeFilePromise(destination + name, markdown)

    console.log('Downloaded ' + name)
}

// Build a Markdown documentation page from the data
function buildDocumentationPage(data) {
    // Flags
    let options = ''
    if (data.options && data.options.length) {
        options += '## Options\n\n'
            + '```text\n'
            + printFlags(data.options)
            + '```\n\n'
    }
    if (data.inherited_options && data.inherited_options.length) {
        options += '## Options inherited from parent commands\n\n'
            + '```text\n'
            + printFlags(data.inherited_options)
            + '```\n\n'
    }

    // See also
    let seeAlso = ''
    /*if (data.see_also && data.see_also.length) {
        seeAlso = '## See also\n\n'
        for (let i = 0; i < data.see_also.length; i++) {
            const el = data.see_also[i]
            // Command is the part until -
            const parts = el.split('-', 2)
            const pageAddress = parts[0].replace(' ', '_') + ''
            seeAlso += '* [' + parts[0] + '](' + baseUrl + pageAddress + ') - ' + parts[1] + '\n'
        }
    }*/

    // Frontmatter
    const frontMatter = '---\n'
        + 'title: "' + data.name.replace('"', '\\"') + '"\n'
        + 'linkTitle: "' + data.name.replace('stkcli ', '').replace('"', '\\"') + '"\n'
        + 'weight: ' + (data.name == 'stkcli' ? 1 : 2) + '\n'
        + 'description: "' + data.synopsis.replace('"', '\\"') + '"\n'
        + '---\n\n'

    // Final content
    return frontMatter
        + '```text\n' + (data.usage || data.name) + '\n```\n\n'
        + '## Description\n\n'
        + data.description + '\n\n'
        + (data.example ? '## Examples\n\n```text\n' + data.example + '```\n\n' : '')
        + options
        + seeAlso
}

// Print out flags
function printFlags(flags) {
    // Get the length of the longest name
    let maxLen = 0
    for (let i = 0; i < flags.length; i++) {
        const el = flags[i]
        if (el.name.length > maxLen) {
            maxLen = el.name.length
        }
    }
    // Build the output
    let out = ''
    for (let i = 0; i < flags.length; i++) {
        const el = flags[i]
        const whitespace = ' '.repeat(maxLen - el.name.length + 2, 2)
        if (el.shorthand) {
            out += ' -' + el.shorthand + ', --' + el.name + whitespace + (el.usage || '')
            // + (el.default_value ? ' (default: ' + el.default_value + ')' : '')
        }
        else {
            out += '     --' + el.name + whitespace + (el.usage || '')
            // + (el.default_value ? ' (default: ' + el.default_value + ')' : '')
        }
        out += '\n'
    }
    return out
}
