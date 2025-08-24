import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

process.env.NODE_ENV = 'production';

// import and start the main server
await import('./dist/index.js');