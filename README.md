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
# Clone the repository
git clone [repository-url]
cd imageflare

# Install dependencies
npm install

# Make the CLI globally available (optional)
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
imgflare upload <image-url>
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
