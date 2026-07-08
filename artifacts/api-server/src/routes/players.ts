import { Router } from "express";
import { db, playersTable, teamsTable, insertPlayerSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListPlayersResponse,
  CreatePlayerBody,
  CreatePlayerResponse,
  GetPlayerParams,
  GetPlayerResponse,
  UpdatePlayerParams,
  UpdatePlayerBody,
  UpdatePlayerResponse,
  DeletePlayerParams,
  ListTeamPlayersParams,
  ListTeamPlayersResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/players", async (req, res) => {
  try {
    const players = await db.select().from(playersTable);
    res.json(ListPlayersResponse.parse(players));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/players", async (req, res) => {
  try {
    const body = CreatePlayerBody.parse(req.body);
    const [player] = await db.insert(playersTable).values(body).returning();
    res.status(201).json(CreatePlayerResponse.parse(player));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/teams/:id/players", async (req, res) => {
  try {
    const { id } = ListTeamPlayersParams.parse({ id: Number(req.params.id) });
    const players = await db.select().from(playersTable).where(eq(playersTable.teamId, id));
    res.json(ListTeamPlayersResponse.parse(players));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:id", async (req, res) => {
  try {
    const { id } = GetPlayerParams.parse({ id: Number(req.params.id) });
    const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    res.json(GetPlayerResponse.parse(player));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/players/:id", async (req, res) => {
  try {
    const { id } = UpdatePlayerParams.parse({ id: Number(req.params.id) });
    const body = UpdatePlayerBody.parse(req.body);
    const [player] = await db.update(playersTable).set(body).where(eq(playersTable.id, id)).returning();
    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    res.json(UpdatePlayerResponse.parse(player));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/players/:id", async (req, res) => {
  try {
    const { id } = DeletePlayerParams.parse({ id: Number(req.params.id) });
    await db.delete(playersTable).where(eq(playersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
