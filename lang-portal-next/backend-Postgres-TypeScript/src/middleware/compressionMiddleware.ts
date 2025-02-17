import compression from 'compression';
import { Request, Response } from 'express';
import { CompressionFilter } from 'compression';

// Skip compressing responses for small payloads
const shouldCompress: CompressionFilter = (req, res) => {
  if (req.headers['x-no-compression']) {
    return false;
  }
  
  // Compress everything over 1KB
  return compression.filter(req, res);
};

export const compressionMiddleware = compression({
  filter: shouldCompress,
  level: 6, // Default compression level
  threshold: 1024 // Min size to compress (1KB)
}); 