import math
from datetime import datetime

# Transfusion Compatibility Matrices
COMPATIBILITY_RULES = {
    'red_cells': {
        'O-':  ['O-'],
        'O+':  ['O+', 'O-'],
        'A-':  ['A-', 'O-'],
        'A+':  ['A+', 'A-', 'O+', 'O-'],
        'B-':  ['B-', 'O-'],
        'B+':  ['B+', 'B-', 'O+', 'O-'],
        'AB-': ['AB-', 'A-', 'B-', 'O-'],
        'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']  # Universal Recipient
    },
    'plasma': {
        'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
        'O+':  ['O+', 'A+', 'B+', 'AB+'],
        'A-':  ['A-', 'A+', 'AB-', 'AB+'],
        'A+':  ['A+', 'AB+'],
        'B-':  ['B-', 'B+', 'AB-', 'AB+'],
        'B+':  ['B+', 'AB+'],
        'AB-': ['AB-', 'AB+'],
        'AB+': ['AB+']
    },
    'platelets': {
        'O-':  ['O-', 'O+'],
        'O+':  ['O+', 'O-'],
        'A-':  ['A-', 'A+', 'O-'],
        'A+':  ['A+', 'A-', 'O+', 'O-'],
        'B-':  ['B-', 'B+', 'O-'],
        'B+':  ['B+', 'B-', 'O+', 'O-'],
        'AB-': ['AB-', 'A-', 'B-', 'O-'],
        'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
    }
}

class SmartMatchingEngine:
    def __init__(self, weights=None):
        self.weights = weights or {
            'distance': 0.35,
            'stock': 0.35,
            'affinity': 0.15,
            'verification': 0.15
        }

    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """Haversine formula to compute great-circle distance in kilometers"""
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return 999.9
        R = 6371.0  # Earth radius in km
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat / 2.0) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 1)

    @staticmethod
    def get_compatible_groups(requested_group, component='prbc'):
        comp_lower = component.lower()
        if comp_lower in ('ffp', 'plasma', 'cryo'):
            category = 'plasma'
        elif comp_lower in ('platelets', 'rdp', 'sdp'):
            category = 'platelets'
        else:
            category = 'red_cells'

        rules = COMPATIBILITY_RULES.get(category, COMPATIBILITY_RULES['red_cells'])
        compatible = rules.get(requested_group, [requested_group])

        return {
            'category': category,
            'compatible_groups': compatible,
            'is_identical': lambda g: g == requested_group,
            'is_universal_donor': lambda g: (g == 'O-' if category == 'red_cells' else g in ('AB+', 'AB-'))
        }

    def match(self, blood_group, units_needed, hosp_lat, hosp_lng, urgency='URGENT', component='prbc', sources=None, donors=None):
        sources = sources or []
        donors = donors or []
        compat_info = self.get_compatible_groups(blood_group, component)
        compatible_groups = compat_info['compatible_groups']

        urgency_upper = urgency.upper()
        # Adjust weight for critical urgency
        if urgency_upper == 'CRITICAL':
            dist_wt = 0.45
            stock_wt = 0.30
            aff_wt = 0.10
            ver_wt = 0.15
        else:
            dist_wt = self.weights['distance']
            stock_wt = self.weights['stock']
            aff_wt = self.weights['affinity']
            ver_wt = self.weights['verification']

        ranked_sources = []
        for src in sources:
            dist_km = self.calculate_distance(hosp_lat, hosp_lng, src.get('lat'), src.get('lng'))

            # Calculate available units across compatible groups
            inv = src.get('inventory', {})
            total_avail = 0
            identical_avail = 0
            breakdown = {}

            for grp in compatible_groups:
                grp_inv = inv.get(grp, {})
                units = grp_inv.get(component, 0)
                if units > 0:
                    total_avail += units
                    breakdown[grp] = units
                    if grp == blood_group:
                        identical_avail += units

            # Distance Score (0 to 35 pts)
            if dist_km <= 5.0:
                dist_score = 35.0
            elif dist_km <= 15.0:
                dist_score = 30.0 - ((dist_km - 5.0) / 10.0) * 10.0
            elif dist_km <= 35.0:
                dist_score = 20.0 - ((dist_km - 15.0) / 20.0) * 10.0
            elif dist_km <= 60.0:
                dist_score = 10.0 - ((dist_km - 35.0) / 25.0) * 8.0
            else:
                dist_score = max(0.0, 2.0 - (dist_km - 60.0) * 0.05)

            # Stock Adequacy Score (0 to 35 pts)
            if total_avail >= units_needed:
                stock_score = 35.0
            elif total_avail > 0:
                stock_score = (total_avail / float(units_needed)) * 30.0
            else:
                stock_score = 0.0

            # Affinity Score (0 to 15 pts) - prefer identical over universal donor
            if identical_avail >= units_needed:
                aff_score = 15.0
            elif identical_avail > 0:
                aff_score = 10.0 + (identical_avail / float(units_needed)) * 5.0
            elif total_avail > 0:
                aff_score = 7.0
            else:
                aff_score = 0.0

            # Verification Score (0 to 15 pts)
            ver_score = 15.0 if src.get('verified', True) else 8.0

            composite_score = round(
                (dist_score / 35.0 * dist_wt +
                 stock_score / 35.0 * stock_wt +
                 aff_score / 15.0 * aff_wt +
                 ver_score / 15.0 * ver_wt) * 100.0, 1
            )

            ranked_sources.append({
                'source': src,
                'distanceKm': dist_km,
                'totalAvailableUnits': total_avail,
                'identicalUnits': identical_avail,
                'stockBreakdown': breakdown,
                'canFulfillFully': total_avail >= units_needed,
                'matchScore': composite_score,
                'scoreBreakdown': {
                    'distanceScore': round(dist_score, 1),
                    'stockScore': round(stock_score, 1),
                    'affinityScore': round(aff_score, 1),
                    'verificationScore': round(ver_score, 1)
                }
            })

        # Sort descending by matchScore, then ascending by distance
        ranked_sources.sort(key=lambda s: (-s['matchScore'], s['distanceKm']))

        # Multi-Source Pooling Strategy (if top source cannot fulfill alone)
        pooling_plan = []
        is_shortage = False
        if ranked_sources:
            best = ranked_sources[0]
            if not best['canFulfillFully'] and units_needed > 1:
                is_shortage = True
                remaining = units_needed
                for item in ranked_sources:
                    avail = item['totalAvailableUnits']
                    if avail > 0 and remaining > 0:
                        allocated = min(avail, remaining)
                        pooling_plan.append({
                            'sourceId': item['source']['id'],
                            'sourceName': item['source']['name'],
                            'distanceKm': item['distanceKm'],
                            'allocatedUnits': allocated,
                            'availableUnits': avail,
                            'contactPhone': item['source']['phone']
                        })
                        remaining -= allocated
                        if remaining <= 0:
                            break

        # Filter compatible donors
        matched_donors = []
        for d in donors:
            if d.get('bloodGroup') in compatible_groups and d.get('isAvailable', True):
                d_dist = self.calculate_distance(hosp_lat, hosp_lng, d.get('lat'), d.get('lng'))
                matched_donors.append({
                    'donor': d,
                    'distanceKm': d_dist,
                    'isIdentical': d.get('bloodGroup') == blood_group
                })
        matched_donors.sort(key=lambda x: (not x['isIdentical'], x['distanceKm']))

        return {
            'bloodGroup': blood_group,
            'component': component,
            'unitsRequired': units_needed,
            'urgency': urgency,
            'compatibleGroups': compatible_groups,
            'rankedSources': ranked_sources,
            'isShortage': is_shortage,
            'poolingPlan': pooling_plan,
            'matchedDonors': matched_donors[:10]
        }
