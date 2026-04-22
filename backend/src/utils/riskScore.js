const calculateRiskScore = (linkedCaseCount) => {
  if (!Number.isFinite(linkedCaseCount) || linkedCaseCount <= 0) {
    return 0;
  }

  return Math.min(100, linkedCaseCount * 20);
};

export default calculateRiskScore;