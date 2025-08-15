// Minimal illustrative server index (for packaging demonstration)
// NOTE: This is not the full production server; see docs for the full API spec.
import express from 'express';
const app = express();
app.get('/api/health', (req,res)=> res.json({ok:true, msg:'manito-package demo'}));
app.listen(3000, ()=> console.log('Demo server on 3000'));
