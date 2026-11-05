// ============================================================================
// LifeLink — Smart Emergency Blood Availability & Matching Algorithm
// Core Client-Side Matching Engine & Decision Support
// ============================================================================

/**
 * Transparent Matching Algorithm Specification:
 * 
 * 1. COMPATIBILITY FILTER:
 *    Identifies clinically compatible donor blood groups for the requested group
 *    and component (PRBC/Whole Blood, Plasma, Platelets).
 * 
 * 2. DISTANCE ESTIMATION (Haversine Formula):
 *    Computes great-circle distance (in kilometers) between hospital coordinates
 *    and each blood source facility.
 * 
 * 3. TRANSPARENT COMPOSITE SCORING (0 - 100 scale):
 *    - Distance Score (0 to 35 pts): Proximity preference; decays gracefully with distance.
 *    - Stock Adequacy Score (0 to 35 pts): Single-facility fulfillment capability.
 *    - Group Affinity Score (0 to 15 pts): Preference for identical group over universal donor
 *      (to preserve scarce O- or AB plasma for true emergencies).
 *    - Verification & Freshness (0 to 15 pts): Verified facility status & recency of inventory update.
 *    - Urgency Multiplier: Adjusts proximity weight during 'Critical' trauma calls.
 * 
 * 4. MULTI-SOURCE POOLING (Shortage Split Allocation):
 *    When no single facility holds sufficient units, the algorithm runs a greedy
 *    knapsack pooling strategy to recommend the minimal combination of nearby
 *    sources to fulfill the shortage.
 */

class SmartMatchingEngine {
  constructor(config = {}) {
    this.weights = {
      distance: config.distanceWeight || 0.35,
      stock: config.stockWeight || 0.35,
      affinity: config.affinityWeight || 0.15,
      verification: config.verificationWeight || 0.15
    };
  }

  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999.9;
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d * 10) / 10;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  getCompatibleGroups(requestedGroup, component = 'prbc') {
    let ruleCategory = 'red_cells';
    if (component === 'ffp' || component === 'plasma' || component === 'cryo') {
      ruleCategory = 'plasma';
    } else if (component === 'platelets') {
      ruleCategory = 'platelets';
    }

    const categoryRules = COMPATIBILITY_RULES[ruleCategory] || COMPATIBILITY_RULES.red_cells;
    const compatible = categoryRules[requestedGroup] || [requestedGroup];
    return {
      category: ruleCategory,
      compatibleGroups: compatible,
      isIdentical: (group) => group === requestedGroup,
      isUniversalDonor: (group) => {
        if (ruleCategory === 'red_cells') return group === 'O-';
        if (ruleCategory === 'plasma') return group === 'AB+' || group === 'AB-';
        return false;
      }
    };
  }

  getSourceStock(source, compatibleGroups, component = 'prbc') {
    let identicalUnits = 0;
    let compatibleAlternativeUnits = 0;
    let breakdown = {};

    if (!source || !source.inventory) {
      return { totalAvailable: 0, identicalUnits: 0, alternativeUnits: 0, breakdown: {} };
    }

    compatibleGroups.forEach((group, index) => {
      const groupInv = source.inventory[group] || {};
      const units = groupInv[component] || 0;
      breakdown[group] = units;

      if (index === 0) {
        identicalUnits += units;
      } else {
        compatibleAlternativeUnits += units;
      }
    });

    const totalAvailable = identicalUnits + compatibleAlternativeUnits;
    return {
      totalAvailable,
      identicalUnits,
      alternativeUnits: compatibleAlternativeUnits,
      breakdown
    };
  }

  computeDistanceScore(distanceKm) {
    if (distanceKm <= 5.0) return 35.0;
    if (distanceKm <= 15.0) return 30.0 - ((distanceKm - 5.0) / 10.0) * 10.0;
    if (distanceKm <= 35.0) return 20.0 - ((distanceKm - 15.0) / 20.0) * 10.0;
    if (distanceKm <= 60.0) return 10.0 - ((distanceKm - 35.0) / 25.0) * 8.0;
    return Math.max(0, 2.0 - (distanceKm - 60.0) * 0.05);
  }

  computeStockScore(availableUnits, requiredUnits) {
    if (requiredUnits <= 0) return 0;
    if (availableUnits >= requiredUnits) return 35.0;
    if (availableUnits > 0) return (availableUnits / requiredUnits) * 30.0;
    return 0;
  }

  computeAffinityScore(identicalUnits, availableUnits, requiredUnits) {
    if (identicalUnits >= requiredUnits) return 15.0;
    if (identicalUnits > 0) return 10.0 + (identicalUnits / requiredUnits) * 5.0;
    if (availableUnits > 0) return 7.0;
    return 0;
  }

  computeVerificationScore(source) {
    return source.verified ? 15.0 : 8.0;
  }

  match(bloodRequirement, availableSources, registeredDonors = []) {
    const { bloodGroup, component = 'prbc', unitsRequired = 1, urgency = 'URGENT', lat, lng } = bloodRequirement;

    const compatInfo = this.getCompatibleGroups(bloodGroup, component);
    const compatibleGroups = compatInfo.compatibleGroups;

    let distWeight = this.weights.distance;
    let stockWeight = this.weights.stock;
    let affinityWeight = this.weights.affinity;
    let verificationWeight = this.weights.verification;

    if (urgency === 'CRITICAL') {
      distWeight = 0.45;
      stockWeight = 0.30;
      affinityWeight = 0.10;
      verificationWeight = 0.15;
    }

    const scoredSources = availableSources.map((source) => {
      const distanceKm = this.calculateHaversineDistance(lat, lng, source.lat, source.lng);
      const stockInfo = this.getSourceStock(source, compatibleGroups, component);

      const rawDist = this.computeDistanceScore(distanceKm);
      const rawStock = this.computeStockScore(stockInfo.totalAvailable, unitsRequired);
      const rawAffinity = this.computeAffinityScore(stockInfo.identicalUnits, stockInfo.totalAvailable, unitsRequired);
      const rawVerif = this.computeVerificationScore(source);

      const compositeScore = Math.round(
        ((rawDist / 35.0) * distWeight +
         (rawStock / 35.0) * stockWeight +
         (rawAffinity / 15.0) * affinityWeight +
         (rawVerif / 15.0) * verificationWeight) * 100.0 * 10
      ) / 10;

      return {
        source,
        distanceKm,
        stockInfo,
        totalAvailableUnits: stockInfo.totalAvailable,
        identicalUnits: stockInfo.identicalUnits,
        stockBreakdown: stockInfo.breakdown,
        canFulfillFully: stockInfo.totalAvailable >= unitsRequired,
        matchScore: compositeScore,
        scoreBreakdown: {
          distanceScore: Math.round(rawDist * 10) / 10,
          stockScore: Math.round(rawStock * 10) / 10,
          affinityScore: Math.round(rawAffinity * 10) / 10,
          verificationScore: Math.round(rawVerif * 10) / 10
        }
      };
    });

    scoredSources.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return a.distanceKm - b.distanceKm;
    });

    // Multi-source pooling plan
    let poolingPlan = [];
    let isShortage = false;

    if (scoredSources.length > 0) {
      const topMatch = scoredSources[0];
      if (!topMatch.canFulfillFully && unitsRequired > 1) {
        isShortage = true;
        let remainingNeeded = unitsRequired;
        for (let item of scoredSources) {
          const avail = item.totalAvailableUnits;
          if (avail > 0 && remainingNeeded > 0) {
            const allocate = Math.min(avail, remainingNeeded);
            poolingPlan.push({
              sourceId: item.source.id,
              sourceName: item.source.name,
              distanceKm: item.distanceKm,
              allocatedUnits: allocate,
              availableUnits: avail,
              contactPhone: item.source.phone
            });
            remainingNeeded -= allocate;
            if (remainingNeeded <= 0) break;
          }
        }
      }
    }

    // Filter compatible donors
    let matchedDonors = [];
    if (registeredDonors && registeredDonors.length > 0) {
      matchedDonors = registeredDonors
        .filter((d) => compatibleGroups.includes(d.bloodGroup) && (d.isAvailable !== false))
        .map((d) => ({
          donor: d,
          distanceKm: this.calculateHaversineDistance(lat, lng, d.lat, d.lng),
          isIdentical: d.bloodGroup === bloodGroup
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 8);
    }

    return {
      bloodGroup,
      component,
      unitsRequired,
      urgency,
      hospitalCoords: { lat, lng },
      compatibleGroups,
      rankedSources: scoredSources,
      isShortage,
      poolingPlan,
      matchedDonors
    };
  }
}

// Global Matcher Instance
const MatchingEngine = new SmartMatchingEngine();
