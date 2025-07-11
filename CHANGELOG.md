# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.1] - 2025-06-05

### Security
- Updated `tar-fs` dependency from 2.1.2 to 2.1.3 to address security vulnerability

## [1.1.0] - 2025-04-19

### Added
- Added support for uploading local image files via new `upload-local` command and `--local` flag
- Added robust metadata extraction for local image files

### Fixed
- Fixed URL construction to properly handle placeholders
- Improved error handling for image dimension extraction

### Documentation
- Added API reference documentation

## [1.0.1] - 2025-04-19

### Security
- Fixed potential denial-of-service vulnerability by updating `image-size` dependency to version 2.0.2 or greater (see [GHSA-m5qc-5hw7-8vg7](https://github.com/advisories/GHSA-m5qc-5hw7-8vg7))

### Added
- Created Makefile with helpful project management commands
- Added this CHANGELOG file

## [1.0.0] - Initial Release

### Added
- Upload external images to Cloudflare Images
- Track image metadata in a local SQLite database
- Search, filter, and view migrated images
- Batch processing from JSON files
- Export image data in different formats
- Commands: upload, batch, list, search, open, status, delete, variants, stats, export