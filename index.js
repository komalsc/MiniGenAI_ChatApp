import { createServer } from "./server.js";

createServer().listen(process.env.PORT || 3000, () => {
    console.log(`API running at http://localhost:${process.env.PORT || 3000}`);
});