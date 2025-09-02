import { Router } from "express";
import prisma from "../db/prisma.js";

const photoRouter = new Router();

photoRouter.get("/", async (req, res) => {
    return res.json(await prisma.photo.findMany({ select: { id: true } }));
});

export default photoRouter;
