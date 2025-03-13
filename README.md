# ImgFlare

A command-line utility for migrating and managing images on Cloudflare Images service.

## Features

- Upload external images to Cloudflare Images
- Track image metadata and operations in a local SQLite database
- Search, filter, and view migrated images
- Batch processing from JSON files
- Export image data in different formats

## Installation

```bash
# Install from npm
npm install -g @heartbred/imgflare

# Or clone the repository and link
git clone [repository-url]
cd imgflare
npm install
npm link
```

## Configuration

Before using ImgFlare, you need to configure it with your Cloudflare credentials:

```bash
imgflare setup
```

This will prompt you for:
- Cloudflare API Token
- Cloudflare Account ID
- Default delivery URL prefix (optional)

## Usage

### Upload a single image

```bash
imgflare upload "<image-url>"
```

**Important:** Always use quotes around URLs, especially those containing special characters like `?`, `&`, `=`, etc.

Examples:
```bash
imgflare upload "https://example.com/image.jpg"
imgflare upload "https://example.com/image.jpg?width=800&height=600"
```

### Process a batch of images from a JSON file

```bash
imgflare batch <json-file>
```

The JSON file should be an array of objects with a `url` property:

```json
[
  { "url": "https://example.com/image1.jpg" },
  { "url": "https://example.com/image2.png" }
]
```

### List uploaded images

```bash
imgflare list
```

You can add filters:

```bash
imgflare list --status complete
imgflare list --limit 10
```

### Search images

```bash
imgflare search <query>
```

### View an image in the browser

```bash
imgflare open original <image-id>
imgflare open cloudflare <image-id>
```

### Check upload status

```bash
imgflare status [image-id]
```

### Delete an image

```bash
imgflare delete <image-id>
```

Options:
- `--force` or `-f`: Skip confirmation prompt
- `--keep-record` or `-k`: Keep the database record but mark as deleted

### View image variants

```bash
imgflare variants <image-id>
```

Options:
- `--copy` or `-c`: Format output for easy copying

### Get statistics

```bash
imgflare stats
```

### Export image data

```bash
imgflare export json
imgflare export csv
```

## License

MITImgFlare
