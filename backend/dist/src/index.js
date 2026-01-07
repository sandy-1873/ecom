"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
require("dotenv/config");
const app = (0, express_1.default)();
const port = process.env.APP_PORT;
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api/users', userRoute_1.default);
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
