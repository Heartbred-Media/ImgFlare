# Cloudflare Images API Reference

This document contains key information about the Cloudflare Images API relevant to ImgFlare implementation.

## Upload Methods

### URL-based Upload (Currently Implemented)
- **Endpoint**: `POST /accounts/{account_id}/images/v1`
- **Format**: multipart/form-data with `url` parameter
- **Authentication**: API Token with "Images Write" permission

### Direct File Upload (For Local File Implementation)
- **Endpoint**: Same as URL upload: `POST /accounts/{account_id}/images/v1`
- **Format**: multipart/form-data with file data
- **Authentication**: Same API Token

## Size and Format Limitations

### Size Constraints
- **Maximum file size**: 10 MB
- **Maximum dimension**: 12,000 pixels
- **Maximum image area**: 100 megapixels
- **Animated GIFs/WebP**: Limited to 50 megapixels
- **Metadata limit**: 1024 bytes

### Supported Formats
- PNG
- GIF (including animations)
- JPEG
- WebP (including animated WebP)
- SVG

### Unsupported Formats
- HEIC/HEIF

## Implementation Details

### Direct File Upload Implementation
For direct file uploads, we need to:
1. Read the file from disk (preferably as a stream with `fs.createReadStream`)
2. Create FormData and append the file data (not a URL)
3. Send to the same endpoint used for URL uploads
4. Process the response in the same way as URL uploads

### Error Handling
- Non-200 responses will contain error details in the JSON response
- Common errors include file size limits and format validation

## Documentation References
- [Cloudflare Images Upload Methods](https://developers.cloudflare.com/images/upload-images/)
- [Cloudflare Images API Resources](https://developers.cloudflare.com/api/resources/images/)
- [API Operation: Upload Image via URL](https://developers.cloudflare.com/api/operations/cloudflare-images-upload-an-image-via-url)