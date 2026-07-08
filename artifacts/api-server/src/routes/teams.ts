import { Router } from "express";
import { db, teamsTable, insertTeamSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListTeamsResponse,
  CreateTeamBody,
  CreateTeamResponse,
  GetTeamParams,
  GetTeamResponse,
  UpdateTeamParams,
  UpdateTeamBody,
  UpdateTeamResponse,
  DeleteTeamParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/teams", async (req, res) => {
  try {
    const teams = await db.select().from(teamsTable);
    res.json(ListTeamsResponse.parse(teams));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/teams", async (req, res) => {
  try {
    const body = CreateTeamBody.parse(req.body);
    const [team] = await db.insert(teamsTable).values(body).returning();
    res.status(201).json(CreateTeamResponse.parse(team));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/teams/:id", async (req, res) => {
  try {
    const { id } = GetTeamParams.parse({ id: Number(req.params.id) });
    const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, id));
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json(GetTeamResponse.parse(team));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/teams/:id", async (req, res) => {
  try {
    const { id } = UpdateTeamParams.parse({ id: Number(req.params.id) });
    const body = UpdateTeamBody.parse(req.body);
    const [team] = await db.update(teamsTable).set(body).where(eq(teamsTable.id, id)).returning();
    if (!team) {
      res.status(404).json({ error: "Team not found" });
      return;
    }
    res.json(UpdateTeamResponse.parse(team));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid request" });
  }
});

router.delete("/teams/:id", async (req, res) => {
  try {
    const { id } = DeleteTeamParams.parse({ id: Number(req.params.id) });
    await db.delete(teamsTable).where(eq(teamsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
