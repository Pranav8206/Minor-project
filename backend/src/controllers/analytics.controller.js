import Case from "../models/case.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const [overview] = await Case.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        statusBreakdown: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $project: {
        totalCases: { $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0] },
        statusBreakdown: 1,
      },
    },
  ]);

  const statusBreakdown = overview?.statusBreakdown || [];
  const openStatuses = new Set(["open", "investigating"]);
  const closedStatuses = new Set(["closed", "archived"]);

  const openVsClosed = statusBreakdown.reduce(
    (accumulator, item) => {
      if (openStatuses.has(item._id)) {
        accumulator.open += item.count;
      } else if (closedStatuses.has(item._id)) {
        accumulator.closed += item.count;
      }

      return accumulator;
    },
    { open: 0, closed: 0 }
  );

  return res.status(200).json({
    totalCases: overview?.totalCases || 0,
    openCases: openVsClosed.open,
    closedCases: openVsClosed.closed,
  });
});

export const getCrimeByLocation = asyncHandler(async (req, res) => {
  const crimeByLocation = await Case.aggregate([
    {
      $group: {
        _id: "$location",
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
        _id: 1,
      },
    },
    {
      $project: {
        _id: 0,
        location: "$_id",
        count: 1,
      },
    },
  ]);

  return res.status(200).json({
    count: crimeByLocation.length,
    locations: crimeByLocation,
  });
});

export const getCrimeByTime = asyncHandler(async (req, res) => {
  const crimeByTime = await Case.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
    {
      $project: {
        _id: 0,
        period: {
          $dateToString: {
            format: "%Y-%m",
            date: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: 1,
              },
            },
          },
        },
        count: 1,
      },
    },
  ]);

  return res.status(200).json({
    count: crimeByTime.length,
    timeline: crimeByTime,
  });
});