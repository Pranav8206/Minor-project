import { Router } from "express";

import {
  getAnalyticsOverview,
  getCrimeByLocation,
  getCrimeByTime,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/overview", getAnalyticsOverview);
router.get("/crime-by-location", getCrimeByLocation);
router.get("/crime-by-time", getCrimeByTime);

export default router;