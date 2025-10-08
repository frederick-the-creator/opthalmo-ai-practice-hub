import app from './app.js'


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});