import { Router } from "express";

import aiRoutes from "./ai.route.js";
import analyticsRoutes from "./analytics.route.js";
import authRoutes from "./auth.route.js";
import caseRoutes from "./case.route.js";
import evidenceRoutes from "./evidence.route.js";
import healthRoute from "./health.route.js";
import searchRoutes from "./search.route.js";
import suspectRoutes from "./suspect.route.js";

const router = Router();

router.use("/ai", aiRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/auth", authRoutes);
router.use("/cases", caseRoutes);
router.use("/evidence", evidenceRoutes);
router.use("/search", searchRoutes);
router.use("/suspects", suspectRoutes);
router.use("/health", healthRoute);

export default router;
