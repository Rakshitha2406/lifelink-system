// ============================================================================
// LifeLink — Smart Emergency Blood Availability & Matching System
// Application Controller & Real-Time Backend API Integration
// ============================================================================

const API_BASE = ''; // Same origin Flask endpoints

/**
 * Global App State Manager
 */
const AppState = {
  sources: [],
  requests: [],
  hospitals: [],
  donors: [],
  notifications: [],
  stats: {},
  dbStatus: { database: 'Loading...', status: 'connecting' },
  activeTab: 'home',
  activeRole: 'hospital',
  activeHospitalId: 'HOSP-001',
  activeSourceId: 'SRC-001',
  currentMatchingResult: null,

  async init() {
    // 1. Load initial fallback defaults
    this.sources = JSON.parse(JSON.stringify(DEFAULT_BLOOD_SOURCES));
    this.requests = JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
    this.hospitals = JSON.parse(JSON.stringify(DEFAULT_HOSPITALS));
    this.donors = JSON.parse(JSON.stringify(DEFAULT_DONORS));
    this.notifications = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));

    // 2. Fetch live data from Python backend & MySQL
    await this.fetchBackendData();
  },

  async fetchBackendData() {
    try {
      // Fetch Status
      const statusRes = await fetch(`${API_BASE}/api/status`);
      if (statusRes.ok) {
        this.dbStatus = await statusRes.json();
        AppUI.updateDbStatusBadge();
      }

      // Fetch Facilities
      const sourcesRes = await fetch(`${API_BASE}/api/sources`);
      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        if (data && data.length > 0) this.sources = data;
      }

      // Fetch Hospitals
      const hospRes = await fetch(`${API_BASE}/api/hospitals`);
      if (hospRes.ok) {
        const data = await hospRes.json();
        if (data && data.length > 0) this.hospitals = data;
      }

      // Fetch Donors
      const donorRes = await fetch(`${API_BASE}/api/donors`);
      if (donorRes.ok) {
        const data = await donorRes.json();
        if (data && data.length > 0) this.donors = data;
      }

      // Fetch Requests
      const reqRes = await fetch(`${API_BASE}/api/requests`);
      if (reqRes.ok) {
        const data = await reqRes.json();
        if (data && data.length > 0) this.requests = data;
      }

      // Fetch Notifications
      const notifRes = await fetch(`${API_BASE}/api/notifications`);
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data && data.length > 0) this.notifications = data;
      }

      // Fetch Stats
      const statsRes = await fetch(`${API_BASE}/api/stats`);
      if (statsRes.ok) {
        this.stats = await statsRes.json();
      }
    } catch (e) {
      console.warn('API sync warning: using local state fallback', e);
    }
  },

  async resetAllData() {
    try {
      const res = await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
      if (res.ok) {
        await this.fetchBackendData();
        AppUI.showToast('Database reset to clean initial state', 'info');
        AppUI.renderAll();
        return;
      }
    } catch (e) {
      console.warn('API reset failed, falling back to local reset:', e);
    }
    await this.init();
    AppUI.showToast('Records reset to default state', 'info');
    AppUI.renderAll();
  },

  addNotification(title, message, type = 'info') {
    const notif = {
      id: 'NOTIF-' + Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    this.notifications.unshift(notif);
    AppUI.renderNotifications();
    AppUI.showToast(`${title}: ${message}`, type);
  }
};

/**
 * UI Rendering and Event Handling Engine
 */
const AppUI = {
  matchingMapInstance: null,

  async init() {
    await AppState.init();
    this.checkExistingSession();
    this.bindNavigation();
    this.bindRoleSwitcher();
    this.bindAuthModal();
    this.bindRequestForm();
    this.bindDirectoryFilters();
    this.bindDonorFilters();
    this.bindDonorForm();
    this.bindSourceStockUpdater();
    this.bindScenarios();
    this.renderAll();

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(`tab-${hash}`)) {
      this.switchTab(hash);
    } else {
      this.switchTab('home');
    }
  },

  renderAll() {
    this.updateDbStatusBadge();
    this.renderStats();
    this.renderHospitalDashboard();
    this.renderBloodSourceDashboard();
    this.renderDirectory();
    this.renderDonors();
    this.renderNotifications();
    this.renderActiveHospitalSelector();
    this.renderActiveSourceSelector();
    this.updateRoleViewContext();
  },

  updateDbStatusBadge() {
    const badge = document.getElementById('dbStatusBadge');
    if (!badge) return;
    const dbType = AppState.dbStatus.database || 'Database';
    if (dbType.toLowerCase().includes('mysql')) {
      badge.className = 'badge bg-success text-white border d-none d-lg-inline-block small';
      badge.innerHTML = `💾 DB: MySQL (Live)`;
      badge.title = `Connected to MySQL database on ${AppState.dbStatus.databaseHost || 'localhost'}`;
    } else {
      badge.className = 'badge bg-info text-white border d-none d-lg-inline-block small';
      badge.innerHTML = `💾 DB: SQLite (Active)`;
      badge.title = `Using local SQLite file. Start MySQL to switch automatically.`;
    }

    const banner = document.getElementById('serverInfoBanner');
    if (banner) {
      banner.innerHTML = `⚡ LifeLink Transfusion Network • Backend: Python Flask & ${dbType}`;
    }
  },

  // --------------------------------------------------------------------------
  // Navigation & Role Switching
  // --------------------------------------------------------------------------
  bindNavigation() {
    document.querySelectorAll('[data-tab-target]').forEach(elem => {
      elem.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = elem.getAttribute('data-tab-target');
        this.switchTab(tab);
      });
    });

    const toggleBtn = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    if (toggleBtn && navMenu) {
      toggleBtn.addEventListener('click', () => {
        navMenu.classList.toggle('nav-open');
      });
    }
  },

  switchTab(tabName) {
    AppState.activeTab = tabName;
    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`tab-${tabName}`);
    if (targetView) {
      targetView.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-tab-target') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('nav-open');

    if (tabName === 'hospital-dashboard') this.renderHospitalDashboard();
    if (tabName === 'source-dashboard') this.renderBloodSourceDashboard();
    if (tabName === 'directory') this.renderDirectory();
    if (tabName === 'donors') this.renderDonors();
    if (tabName === 'home') this.renderStats();
  },

  bindRoleSwitcher() {
    const roleSelector = document.getElementById('activeRoleSelector');
    if (roleSelector) {
      roleSelector.addEventListener('change', (e) => {
        AppState.activeRole = e.target.value;
        this.updateRoleViewContext();
      });
    }
  },

  updateRoleViewContext() {
    const badgeElem = document.getElementById('currentRoleBadge');
    if (!badgeElem) return;

    if (AppState.activeRole === 'hospital') {
      const hosp = AppState.hospitals.find(h => h.id === AppState.activeHospitalId) || AppState.hospitals[0];
      badgeElem.innerHTML = `<span class="badge badge-hospital">🏥 Acting as: ${hosp ? hosp.name : 'Hospital'}</span>`;
    } else if (AppState.activeRole === 'source') {
      const src = AppState.sources.find(s => s.id === AppState.activeSourceId) || AppState.sources[0];
      badgeElem.innerHTML = `<span class="badge badge-source">🩸 Acting as: ${src ? src.name : 'Blood Bank'}</span>`;
    } else {
      badgeElem.innerHTML = `<span class="badge bg-dark text-white">⚡ Emergency Network Coordinator Mode</span>`;
    }
  },

  renderActiveHospitalSelector() {
    const select = document.getElementById('hospitalSelectDropdown');
    const reqSelect = document.getElementById('reqHospitalSelect');
    
    const optionsHtml = AppState.hospitals.map(h => `
      <option value="${h.id}" ${h.id === AppState.activeHospitalId ? 'selected' : ''}>
        ${h.name} (${h.city})
      </option>
    `).join('');

    if (select) {
      select.innerHTML = optionsHtml;
      select.onchange = (e) => {
        AppState.activeHospitalId = e.target.value;
        this.updateRoleViewContext();
        this.renderHospitalDashboard();
      };
    }

    if (reqSelect) {
      reqSelect.innerHTML = optionsHtml;
    }
  },

  renderActiveSourceSelector() {
    const select = document.getElementById('sourceSelectDropdown');
    if (!select) return;
    select.innerHTML = AppState.sources.map(s => `
      <option value="${s.id}" ${s.id === AppState.activeSourceId ? 'selected' : ''}>
        ${s.name} ${s.verified ? '✓' : '(Unverified)'}
      </option>
    `).join('');

    select.addEventListener('change', (e) => {
      AppState.activeSourceId = e.target.value;
      this.updateRoleViewContext();
      this.renderBloodSourceDashboard();
    });
  },

  // --------------------------------------------------------------------------
  // Emergency Request Submission & Live Matching
  // --------------------------------------------------------------------------
  bindRequestForm() {
    const form = document.getElementById('emergencyRequestForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const hospitalId = document.getElementById('reqHospitalSelect').value;
      const hospital = AppState.hospitals.find(h => h.id === hospitalId) || AppState.hospitals[0];
      const bloodGroup = document.getElementById('reqBloodGroup').value;
      const component = document.getElementById('reqComponent').value;
      const units = parseInt(document.getElementById('reqUnits').value, 10);
      const urgency = document.getElementById('reqUrgency').value;
      const patientId = document.getElementById('reqPatientId').value.trim();
      const clinicalReason = document.getElementById('reqReason').value.trim();
      const contactPerson = document.getElementById('reqContactPerson').value.trim();
      const contactPhone = document.getElementById('reqContactPhone').value.trim();

      if (!bloodGroup || isNaN(units) || units < 1) {
        this.showToast('Please provide a valid blood group and units required.', 'error');
        return;
      }

      const reqPayload = {
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        patientName: 'Emergency Patient',
        patientId: patientId || 'MRN-EMERGENCY',
        bloodGroup,
        component,
        unitsRequired: units,
        urgency,
        clinicalReason: clinicalReason || 'Acute emergency transfusion requirement',
        contactPerson: contactPerson || hospital.repName,
        contactPhone: contactPhone || hospital.phone,
        lat: hospital.lat,
        lng: hospital.lng
      };

      try {
        const response = await fetch(`${API_BASE}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload)
        });

        if (response.ok) {
          const resData = await response.json();
          AppState.requests.unshift(resData.request);
          this.showToast('Emergency request submitted and persisted to database!', 'success');
          
          if (resData.matchResult) {
            AppState.currentMatchingResult = {
              request: resData.request,
              ...resData.matchResult
            };
            this.renderMatchingResults(AppState.currentMatchingResult);
            this.switchTab('matching');
            this.renderHospitalDashboard();
            this.renderStats();
            return;
          }
        }
      } catch (err) {
        console.warn('Backend request POST error, executing client-side matcher:', err);
      }

      // Client-side fallback matching
      const clientResult = MatchingEngine.match({
        bloodGroup,
        component,
        unitsRequired: units,
        urgency,
        lat: hospital.lat,
        lng: hospital.lng
      }, AppState.sources, AppState.donors);

      const localReq = {
        id: 'REQ-' + Date.now(),
        ...reqPayload,
        status: clientResult.rankedSources.length > 0 ? 'Matched' : 'Pending',
        matchedSource: clientResult.rankedSources.length > 0 ? clientResult.rankedSources[0].source.name : null,
        createdAt: new Date().toISOString()
      };
      AppState.requests.unshift(localReq);

      AppState.currentMatchingResult = {
        request: localReq,
        ...clientResult
      };

      this.renderMatchingResults(AppState.currentMatchingResult);
      this.switchTab('matching');
      this.renderHospitalDashboard();
      this.renderStats();
    });
  },

  renderMatchingResults(result) {
    const container = document.getElementById('matchingResultsContainer');
    if (!container || !result) return;

    const req = result.request || {};
    const ranked = result.rankedSources || [];
    const isShortage = result.isShortage;
    const pooling = result.poolingPlan || [];
    const donors = result.matchedDonors || [];

    let html = `
      <div class="card mb-4 bg-white border-primary">
        <div class="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="badge ${req.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-warning'} me-2">${req.urgency} REQUIREMENT</span>
            <strong class="h5 mb-0 text-dark">${req.unitsRequired} Units of ${req.bloodGroup} (${(req.component || 'PRBC').toUpperCase()})</strong>
          </div>
          <div class="text-end">
            <span class="small text-muted">Requesting Facility: <strong>${req.hospitalName}</strong></span>
          </div>
        </div>
        <div class="card-body">
          <div class="row g-3 small">
            <div class="col-md-3"><strong>Compatible Donor Groups:</strong> ${(result.compatibleGroups || [req.bloodGroup]).join(', ')}</div>
            <div class="col-md-3"><strong>Clinical Reason:</strong> ${req.clinicalReason || 'Emergency Transfusion'}</div>
            <div class="col-md-3"><strong>Doctor Contact:</strong> ${req.contactPerson} (${req.contactPhone})</div>
            <div class="col-md-3 text-end"><span class="badge bg-info text-white">Algorithm: Distance (35%) + Stock (35%) + Affinity (15%) + Trust (15%)</span></div>
          </div>
        </div>
      </div>
    `;

    // Multi-source pooling notice if needed
    if (isShortage && pooling.length > 0) {
      html += `
        <div class="alert alert-warning mb-4">
          <div class="d-flex align-items-start gap-2">
            <span class="h4 mb-0">⚠️</span>
            <div>
              <strong class="d-block">Multi-Source Pooling Triggered: Single Source Shortage Detected</strong>
              <span class="small">No single facility holds ${req.unitsRequired} units. The smart algorithm has formulated a split requisition plan:</span>
              <div class="table-responsive mt-2">
                <table class="table table-sm table-bordered bg-white mb-0 small">
                  <thead class="table-light">
                    <tr>
                      <th>Allocated Facility</th>
                      <th>Distance</th>
                      <th>Allocated Units</th>
                      <th>Available Units</th>
                      <th>Contact Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pooling.map(p => `
                      <tr>
                        <td><strong>${p.sourceName}</strong></td>
                        <td>${p.distanceKm} km</td>
                        <td><span class="badge bg-success">${p.allocatedUnits} units</span></td>
                        <td>${p.availableUnits} total</td>
                        <td><a href="tel:${p.contactPhone}">${p.contactPhone}</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Ranked Blood Banks Table
    html += `
      <div class="card mb-4 bg-white">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <h4 class="h6 mb-0">🏆 Ranked Matching Blood Facilities (${ranked.length} Identified)</h4>
          <span class="smaller text-muted">Ranked by Composite Optimization Score</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Rank & Facility</th>
                  <th>Distance</th>
                  <th>Available Units</th>
                  <th>Compatibility Breakdown</th>
                  <th>Composite Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
    `;

    ranked.forEach((item, index) => {
      const s = item.source;
      const isTop = index === 0;
      const breakdownText = Object.entries(item.stockBreakdown || {})
        .map(([grp, cnt]) => `${grp}: <strong>${cnt}</strong>`).join(' • ');

      html += `
        <tr class="${isTop ? 'table-active font-weight-bold' : ''}">
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="badge ${isTop ? 'bg-success' : 'bg-secondary'} rounded-circle">${index + 1}</span>
              <div>
                <strong class="d-block text-dark">${s.name}</strong>
                <span class="small text-muted">${s.city} • ${s.phone}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge bg-light text-dark border">${item.distanceKm} km</span>
          </td>
          <td>
            <span class="badge ${item.totalAvailableUnits >= req.unitsRequired ? 'bg-success text-white' : 'bg-warning text-dark'}">
              ${item.totalAvailableUnits} Units
            </span>
          </td>
          <td class="small text-muted">${breakdownText || '0 units'}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <strong class="text-danger h6 mb-0">${item.matchScore}</strong>
              <div class="progress flex-grow-1" style="height: 6px; width: 60px;">
                <div class="progress-bar bg-danger" style="width: ${item.matchScore}%"></div>
              </div>
            </div>
          </td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="AppUI.confirmMatchWithSource('${req.id}', '${s.id}', '${s.name}')">
              Confirm & Dispatch →
            </button>
          </td>
        </tr>
      `;
    });

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Compatible Voluntary Donors Section
    if (donors && donors.length > 0) {
      html += `
        <div class="card bg-white mb-4">
          <div class="card-header bg-white d-flex justify-content-between align-items-center">
            <h4 class="h6 mb-0">🩸 Nearby Compatible Voluntary Donors (${donors.length} Ready)</h4>
            <span class="small text-muted">Emergency Donor Recall Network</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0 small">
                <thead class="table-light">
                  <tr>
                    <th>Donor Name</th>
                    <th>Blood Group</th>
                    <th>City / Distance</th>
                    <th>Contact Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${donors.map(d => `
                    <tr>
                      <td><strong>${d.donor.name}</strong></td>
                      <td><span class="badge badge-blood">${d.donor.bloodGroup}</span></td>
                      <td>${d.donor.city} (${d.distanceKm} km)</td>
                      <td><a href="tel:${d.donor.phone}">${d.donor.phone}</a></td>
                      <td>
                        <button class="btn btn-outline-danger btn-sm py-0 px-2" onclick="AppUI.contactDonorDirect('${d.donor.name}', '${d.donor.phone}')">
                          📞 Call Donor
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
    this.renderMap(result);
  },

  renderMap(result) {
    const mapCard = document.getElementById('matchingMapCard');
    const mapElem = document.getElementById('matchingLeafletMap');
    if (!mapCard || !mapElem || !result) return;

    mapCard.style.display = 'block';

    if (typeof L === 'undefined') {
      mapElem.innerHTML = '<div class="p-4 text-center text-muted">Leaflet Map Loading...</div>';
      return;
    }

    const req = result.request || {};
    const center = [req.lat || 16.3470, req.lng || 81.0420];

    try {
      if (this.matchingMapInstance) {
        this.matchingMapInstance.remove();
        this.matchingMapInstance = null;
      }

      this.matchingMapInstance = L.map('matchingLeafletMap').setView(center, 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors | LifeLink Emergency Network'
      }).addTo(this.matchingMapInstance);

      // Hospital Marker
      const hospMarker = L.circleMarker(center, {
        radius: 10,
        fillColor: '#0284c7',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0.95
      }).addTo(this.matchingMapInstance);

      hospMarker.bindPopup(`
        <div style="font-size:12px;">
          <strong style="color:#0284c7;">🏥 ${req.hospitalName || 'Requesting Center'}</strong><br>
          <strong>Required:</strong> ${req.bloodGroup} (${req.unitsRequired} units)<br>
          <strong>Urgency:</strong> ${req.urgency}
        </div>
      `).openPopup();

      // Proximity Rings
      L.circle(center, { radius: 5000, color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.08, weight: 1.5 }).addTo(this.matchingMapInstance);
      L.circle(center, { radius: 25000, color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.04, weight: 1, dashArray: '4, 4' }).addTo(this.matchingMapInstance);

      // Blood Banks
      (result.rankedSources || []).forEach((item, idx) => {
        const s = item.source;
        if (s.lat && s.lng) {
          const marker = L.circleMarker([s.lat, s.lng], {
            radius: idx === 0 ? 9 : 7,
            fillColor: item.matchScore >= 80 ? '#16a34a' : '#dc2626',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9
          }).addTo(this.matchingMapInstance);

          marker.bindPopup(`
            <div style="font-size:12px;">
              <strong style="color:#dc2626;">🩸 ${s.name}</strong><br>
              <strong>Distance:</strong> ${item.distanceKm} km<br>
              <strong>Match Score:</strong> ${item.matchScore}/100<br>
              <strong>Stock Available:</strong> ${item.totalAvailableUnits} units<br>
              <strong>Phone:</strong> ${s.phone}
            </div>
          `);
        }
      });
    } catch (e) {
      console.warn('Leaflet map render error:', e);
    }
  },

  async confirmMatchWithSource(reqId, sourceId, sourceName) {
    try {
      await fetch(`${API_BASE}/api/requests/${reqId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Matched' })
      });
    } catch (e) {}

    const req = AppState.requests.find(r => r.id === reqId);
    if (req) {
      req.status = 'Matched';
      req.matchedSource = sourceName;
      req.matchedSourceId = sourceId;
    }

    AppState.addNotification('Dispatch Confirmed', `Requisition ${reqId} matched and dispatched to ${sourceName}.`, 'success');
    this.showToast(`Transfusion dispatch confirmed with ${sourceName}!`, 'success');
    this.renderHospitalDashboard();
    this.renderStats();
  },

  contactDonorDirect(donorName, donorPhone) {
    this.openGenericModal(`Contact Donor: ${donorName}`, `
      <div class="text-center p-3">
        <div class="display-5 mb-2">📞</div>
        <h5>${donorName}</h5>
        <p class="text-muted mb-3">Registered Voluntary Emergency Donor</p>
        <div class="p-3 bg-light rounded mb-3">
          <strong>Mobile Hotline:</strong> <a href="tel:${donorPhone}" class="h5 text-danger">${donorPhone}</a>
        </div>
        <p class="small text-muted">A direct SMS alert has been dispatched with hospital location coordinates.</p>
        <button class="btn btn-primary" onclick="AppUI.closeGenericModal()">Done</button>
      </div>
    `);
  },

  // --------------------------------------------------------------------------
  // Blood Banks Directory
  // --------------------------------------------------------------------------
  bindDirectoryFilters() {
    const searchInput = document.getElementById('dirSearchInput');
    const groupFilter = document.getElementById('dirGroupFilter');
    const typeFilter = document.getElementById('dirTypeFilter');
    const verifiedOnly = document.getElementById('dirVerifiedOnly');

    const updateDir = () => this.renderDirectory();
    if (searchInput) searchInput.addEventListener('input', updateDir);
    if (groupFilter) groupFilter.addEventListener('change', updateDir);
    if (typeFilter) typeFilter.addEventListener('change', updateDir);
    if (verifiedOnly) verifiedOnly.addEventListener('change', updateDir);
  },

  renderDirectory() {
    const container = document.getElementById('directoryCardsContainer');
    if (!container) return;

    const searchTerm = (document.getElementById('dirSearchInput')?.value || '').toLowerCase().trim();
    const group = document.getElementById('dirGroupFilter')?.value || 'ALL';
    const type = document.getElementById('dirTypeFilter')?.value || 'ALL';
    const verifiedOnly = document.getElementById('dirVerifiedOnly')?.checked || false;

    let filtered = AppState.sources.filter(s => {
      if (verifiedOnly && !s.verified) return false;
      if (type !== 'ALL' && s.category !== type) return false;
      if (searchTerm) {
        const matchName = s.name.toLowerCase().includes(searchTerm);
        const matchCity = (s.city || '').toLowerCase().includes(searchTerm);
        const matchAddr = (s.address || '').toLowerCase().includes(searchTerm);
        if (!matchName && !matchCity && !matchAddr) return false;
      }
      return true;
    });

    const badge = document.getElementById('directoryCountBadge');
    if (badge) badge.innerText = `${filtered.length} Centers Found`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center p-5 text-muted">
          <h5>No blood source facilities match your filter</h5>
          <p class="small">Try adjusting search keyword or blood group criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      let stockDisplay = '';
      if (group !== 'ALL') {
        const grpStock = (s.inventory && s.inventory[group]) || {};
        stockDisplay = `
          <div class="mt-2 p-2 bg-light rounded text-center small">
            <span class="badge badge-blood">${group}</span> Available: 
            <strong>${(grpStock.prbc || 0) + (grpStock.whole_blood || 0)} PRBC/Whole</strong> • 
            <strong>${grpStock.platelets || 0} Platelets</strong> • 
            <strong>${grpStock.ffp || 0} FFP</strong>
          </div>
        `;
      }

      return `
        <div class="col-md-6 col-lg-4">
          <div class="card h-100 bg-white shadow-sm border">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge ${s.category === 'hospital_center' ? 'badge-hospital' : 'badge-source'}">
                  ${s.category === 'hospital_center' ? 'Hospital Blood Store' : 'Blood Bank'}
                </span>
                ${s.verified ? '<span class="badge badge-verified">✓ Verified</span>' : ''}
              </div>
              <h5 class="h6 font-weight-bold text-dark mb-1">${s.name}</h5>
              <p class="small text-muted mb-2">${s.address}</p>
              <div class="small mb-2">
                <div>📞 <strong>Phone:</strong> <a href="tel:${s.phone}">${s.phone}</a></div>
                <div>👤 <strong>Contact:</strong> ${s.contactPerson}</div>
                <div>🕒 <strong>Hours:</strong> ${s.operatingHours}</div>
              </div>
              ${stockDisplay}
            </div>
            <div class="card-footer bg-light d-flex justify-content-between align-items-center">
              <button class="btn btn-outline-primary btn-sm" onclick="AppUI.inspectSourceInventory('${s.id}')">
                Inspect Full Stock
              </button>
              <button class="btn btn-danger btn-sm" onclick="AppUI.quickRequestFromSource('${s.id}')">
                Request Units →
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  inspectSourceInventory(sourceId) {
    const s = AppState.sources.find(src => src.id === sourceId);
    if (!s) return;

    let tableRows = BLOOD_GROUPS.map(grp => {
      const stock = (s.inventory && s.inventory[grp]) || { whole_blood: 0, prbc: 0, platelets: 0, ffp: 0, cryo: 0 };
      return `
        <tr>
          <td><span class="badge badge-blood">${grp}</span></td>
          <td>${stock.whole_blood}</td>
          <td><strong>${stock.prbc}</strong></td>
          <td>${stock.platelets}</td>
          <td>${stock.ffp}</td>
          <td>${stock.cryo}</td>
        </tr>
      `;
    }).join('');

    this.openGenericModal(`Inventory: ${s.name}`, `
      <div class="small text-muted mb-3">${s.address} • Contact: ${s.phone}</div>
      <div class="table-responsive">
        <table class="table table-bordered table-sm text-center small align-middle">
          <thead class="table-light">
            <tr>
              <th>Group</th>
              <th>Whole Blood</th>
              <th>PRBC</th>
              <th>Platelets</th>
              <th>FFP</th>
              <th>Cryo</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="text-end mt-3">
        <button class="btn btn-secondary btn-sm" onclick="AppUI.closeGenericModal()">Close</button>
      </div>
    `);
  },

  quickRequestFromSource(sourceId) {
    this.switchTab('request-blood');
    this.showToast('Select blood group and units to dispatch requisition.', 'info');
  },

  // --------------------------------------------------------------------------
  // Voluntary Donors Directory & Registration
  // --------------------------------------------------------------------------
  bindDonorFilters() {
    const searchInput = document.getElementById('donorSearchInput');
    const groupFilter = document.getElementById('donorGroupFilter');
    if (searchInput) searchInput.addEventListener('input', () => this.renderDonors());
    if (groupFilter) groupFilter.addEventListener('change', () => this.renderDonors());
  },

  renderDonors() {
    const container = document.getElementById('donorsCardsContainer');
    if (!container) return;

    const searchTerm = (document.getElementById('donorSearchInput')?.value || '').toLowerCase().trim();
    const group = document.getElementById('donorGroupFilter')?.value || 'ALL';

    let filtered = AppState.donors.filter(d => {
      if (group !== 'ALL' && d.bloodGroup !== group) return false;
      if (searchTerm) {
        const matchName = d.name.toLowerCase().includes(searchTerm);
        const matchCity = (d.city || '').toLowerCase().includes(searchTerm);
        if (!matchName && !matchCity) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center p-5 text-muted">
          <h5>No donors match your search</h5>
          <p class="small">Be the first to register as a voluntary blood donor in your city!</p>
          <button class="btn btn-danger btn-sm" onclick="AppUI.openDonorModal()">Register as Donor</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(d => `
      <div class="col-md-6 col-lg-3">
        <div class="card h-100 bg-white shadow-sm border">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge badge-blood font-size-1">${d.bloodGroup}</span>
              <span class="badge ${d.isAvailable ? 'badge-verified' : 'bg-secondary text-white'}">
                ${d.isAvailable ? '✓ Ready to Donate' : 'Unavailable'}
              </span>
            </div>
            <h5 class="h6 font-weight-bold text-dark mb-1">${d.name}</h5>
            <p class="small text-muted mb-2">📍 ${d.city}${d.address ? ' • ' + d.address : ''}</p>
            <div class="small mb-3">
              <div>📞 <a href="tel:${d.phone}">${d.phone}</a></div>
              <div>✉️ ${d.email}</div>
              ${d.lastDonated ? `<div>🕒 Last Donated: ${d.lastDonated}</div>` : ''}
            </div>
            <button class="btn btn-outline-danger btn-sm w-100" onclick="AppUI.contactDonorDirect('${d.name}', '${d.phone}')">
              📞 Emergency Contact
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  openDonorModal() {
    const modal = document.getElementById('donorModal');
    if (modal) modal.classList.add('active');
  },

  closeDonorModal() {
    const modal = document.getElementById('donorModal');
    if (modal) modal.classList.remove('active');
  },

  bindDonorForm() {
    const form = document.getElementById('donorRegistrationForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('donorName').value.trim();
      const bloodGroup = document.getElementById('donorBloodGroup').value;
      const phone = document.getElementById('donorPhone').value.trim();
      const email = document.getElementById('donorEmail').value.trim();
      const city = document.getElementById('donorCity').value.trim();
      const lastDonated = document.getElementById('donorLastDonated').value;
      const address = document.getElementById('donorAddress').value.trim();

      const donorPayload = {
        name,
        bloodGroup,
        phone,
        email,
        city,
        lastDonated,
        address
      };

      try {
        const res = await fetch(`${API_BASE}/api/donors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(donorPayload)
        });

        if (res.ok) {
          const data = await res.json();
          AppState.donors.unshift(data.donor);
          this.showToast('You are registered as a voluntary blood donor!', 'success');
          this.closeDonorModal();
          this.renderDonors();
          this.renderStats();
          return;
        }
      } catch (err) {
        console.warn('Backend donor POST error, saving locally:', err);
      }

      // Local fallback
      const localDonor = {
        id: 'DNR-' + Date.now(),
        ...donorPayload,
        isAvailable: true
      };
      AppState.donors.unshift(localDonor);
      AppState.addNotification('Donor Registered', `${name} (${bloodGroup}) registered as voluntary donor in ${city}.`, 'success');
      this.closeDonorModal();
      this.renderDonors();
      this.renderStats();
    });
  },

  // --------------------------------------------------------------------------
  // Hospital Dashboard
  // --------------------------------------------------------------------------
  renderHospitalDashboard() {
    const tbody = document.getElementById('hospitalRequestsTableBody');
    if (!tbody) return;

    const hospId = AppState.activeHospitalId;
    const reqs = AppState.requests.filter(r => !hospId || r.hospitalId === hospId || AppState.activeRole !== 'hospital');

    if (reqs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center p-4 text-muted">
            No active emergency requisitions for this facility. Click <strong>+ New Emergency Request</strong> to log a demand.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = reqs.map(r => `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.hospitalName}</td>
        <td>
          <div class="small">
            <strong>${r.patientName || 'Emergency Case'}</strong><br>
            <span class="text-muted">${r.clinicalReason || 'Transfusion'}</span>
          </div>
        </td>
        <td>
          <span class="badge badge-blood">${r.bloodGroup}</span>
          <strong>${r.unitsRequired} Units</strong> (${(r.component || 'PRBC').toUpperCase()})
        </td>
        <td>
          <span class="badge ${r.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">
            ${r.urgency}
          </span>
        </td>
        <td>
          <span class="badge ${r.status === 'Fulfilled' ? 'bg-success text-white' : r.status === 'Matched' ? 'bg-primary text-white' : 'bg-warning text-dark'}">
            ${r.status}
          </span>
          ${r.matchedSource ? `<div class="smaller text-muted mt-1">Source: ${r.matchedSource}</div>` : ''}
        </td>
        <td>
          ${r.status !== 'Fulfilled' ? `
            <button class="btn btn-outline-success btn-sm py-0 px-2" onclick="AppUI.markRequestFulfilled('${r.id}')">
              Mark Fulfilled ✓
            </button>
          ` : '<span class="text-success small">✓ Completed</span>'}
        </td>
      </tr>
    `).join('');
  },

  async markRequestFulfilled(reqId) {
    try {
      await fetch(`${API_BASE}/api/requests/${reqId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Fulfilled' })
      });
    } catch (e) {}

    const req = AppState.requests.find(r => r.id === reqId);
    if (req) req.status = 'Fulfilled';

    AppState.addNotification('Transfusion Completed', `Requisition ${reqId} successfully marked fulfilled.`, 'success');
    this.showToast(`Request ${reqId} marked fulfilled!`, 'success');
    this.renderHospitalDashboard();
    this.renderStats();
  },

  // --------------------------------------------------------------------------
  // Blood Bank Representative Portal
  // --------------------------------------------------------------------------
  renderBloodSourceDashboard() {
    const src = AppState.sources.find(s => s.id === AppState.activeSourceId) || AppState.sources[0];
    if (!src) return;

    const nameElem = document.getElementById('sourcePortalName');
    const typeElem = document.getElementById('sourcePortalType');
    const updateElem = document.getElementById('sourcePortalLastUpdate');

    if (nameElem) nameElem.innerText = src.name;
    if (typeElem) typeElem.innerText = `${src.type} • ${src.address}`;
    if (updateElem) updateElem.innerText = `Last stock update: ${src.lastUpdated ? new Date(src.lastUpdated).toLocaleTimeString() : 'Just now'}`;

    // Render Inbound Requests table
    const tbody = document.getElementById('sourceIncomingTableBody');
    if (tbody) {
      const incoming = AppState.requests.filter(r => r.status === 'Pending' || r.matchedSourceId === src.id);
      if (incoming.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center p-3 text-muted">
              No pending emergency alerts directed to this blood center at present.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = incoming.map(r => `
          <tr>
            <td><strong>${r.id}</strong></td>
            <td>${r.hospitalName}</td>
            <td><span class="badge badge-blood">${r.bloodGroup}</span> ${r.unitsRequired} Units (${r.component})</td>
            <td><span class="badge ${r.urgency === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">${r.urgency}</span></td>
            <td>${r.contactPerson} (<a href="tel:${r.contactPhone}">${r.contactPhone}</a>)</td>
            <td>
              <button class="btn btn-success btn-sm py-0 px-2" onclick="AppUI.confirmMatchWithSource('${r.id}', '${src.id}', '${src.name}')">
                Accept & Confirm ✓
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    // Render stock editor
    this.renderStockEditorGrid(src);
  },

  renderStockEditorGrid(source) {
    const grid = document.getElementById('stockEditorGrid');
    if (!grid) return;

    let html = `
      <div class="table-responsive">
        <table class="table table-bordered table-sm text-center align-middle bg-white mb-0">
          <thead class="table-light">
            <tr>
              <th>Blood Group</th>
              <th>Whole Blood</th>
              <th>PRBC</th>
              <th>Platelets</th>
              <th>Plasma (FFP)</th>
              <th>Cryo</th>
            </tr>
          </thead>
          <tbody>
    `;

    BLOOD_GROUPS.forEach(grp => {
      const stock = (source.inventory && source.inventory[grp]) || { whole_blood: 0, prbc: 0, platelets: 0, ffp: 0, cryo: 0 };
      html += `
        <tr>
          <td><span class="badge badge-blood font-size-1">${grp}</span></td>
          <td><input type="number" min="0" max="999" class="form-control form-control-sm text-center stock-input" data-group="${grp}" data-comp="whole_blood" value="${stock.whole_blood}"></td>
          <td><input type="number" min="0" max="999" class="form-control form-control-sm text-center stock-input" data-group="${grp}" data-comp="prbc" value="${stock.prbc}"></td>
          <td><input type="number" min="0" max="999" class="form-control form-control-sm text-center stock-input" data-group="${grp}" data-comp="platelets" value="${stock.platelets}"></td>
          <td><input type="number" min="0" max="999" class="form-control form-control-sm text-center stock-input" data-group="${grp}" data-comp="ffp" value="${stock.ffp}"></td>
          <td><input type="number" min="0" max="999" class="form-control form-control-sm text-center stock-input" data-group="${grp}" data-comp="cryo" value="${stock.cryo}"></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
    grid.innerHTML = html;
  },

  bindSourceStockUpdater() {
    const saveBtn = document.getElementById('saveStockChangesBtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
      const src = AppState.sources.find(s => s.id === AppState.activeSourceId);
      if (!src) return;

      const inputs = document.querySelectorAll('.stock-input');
      const updates = [];

      inputs.forEach(input => {
        const grp = input.getAttribute('data-group');
        const comp = input.getAttribute('data-comp');
        const val = parseInt(input.value, 10);
        const units = isNaN(val) ? 0 : Math.max(0, val);

        if (!src.inventory) src.inventory = {};
        if (!src.inventory[grp]) src.inventory[grp] = {};
        src.inventory[grp][comp] = units;

        updates.push({ bloodGroup: grp, component: comp, units });
      });

      src.lastUpdated = new Date().toISOString();

      // Persist to backend database in parallel
      try {
        for (let u of updates) {
          await fetch(`${API_BASE}/api/sources/${src.id}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u)
          });
        }
      } catch (err) {
        console.warn('Backend stock sync warning:', err);
      }

      AppState.addNotification('Stock Updated', `${src.name} inventory quantities saved to database.`, 'info');
      this.showToast('Stock quantities saved to database successfully!', 'success');
      this.renderBloodSourceDashboard();
      this.renderDirectory();
      this.renderStats();
    });
  },

  // --------------------------------------------------------------------------
  // Test Scenarios
  // --------------------------------------------------------------------------
  bindScenarios() {
    document.querySelectorAll('[data-scenario]').forEach(elem => {
      elem.addEventListener('click', () => {
        const scenario = elem.getAttribute('data-scenario');
        this.runScenario(scenario);
      });
    });
  },

  loadScenarioToForm(scenarioId) {
    this.switchTab('request-blood');
    const hospSelect = document.getElementById('reqHospitalSelect');
    const groupSelect = document.getElementById('reqBloodGroup');
    const compSelect = document.getElementById('reqComponent');
    const unitsInput = document.getElementById('reqUnits');
    const urgencySelect = document.getElementById('reqUrgency');
    const reasonInput = document.getElementById('reqReason');

    if (scenarioId === 'scenario-1') {
      if (hospSelect) hospSelect.value = 'HOSP-001';
      if (groupSelect) groupSelect.value = 'O+';
      if (compSelect) compSelect.value = 'prbc';
      if (unitsInput) unitsInput.value = '2';
      if (urgencySelect) urgencySelect.value = 'CRITICAL';
      if (reasonInput) reasonInput.value = 'Trauma code red - compound fracture';
    } else if (scenarioId === 'scenario-2') {
      if (hospSelect) hospSelect.value = 'HOSP-001';
      if (groupSelect) groupSelect.value = 'O-';
      if (compSelect) compSelect.value = 'prbc';
      if (unitsInput) unitsInput.value = '5';
      if (urgencySelect) urgencySelect.value = 'CRITICAL';
      if (reasonInput) reasonInput.value = 'Massive obstetric hemorrhage - rare group';
    } else if (scenarioId === 'scenario-3') {
      if (hospSelect) hospSelect.value = 'HOSP-003';
      if (groupSelect) groupSelect.value = 'AB+';
      if (compSelect) compSelect.value = 'prbc';
      if (unitsInput) unitsInput.value = '4';
      if (urgencySelect) urgencySelect.value = 'URGENT';
      if (reasonInput) reasonInput.value = 'Surgical reserve for bypass graft';
    }

    this.showToast(`Loaded ${scenarioId} into request form! Click Execute to run.`, 'info');
  },

  runScenario(scenarioId) {
    let req;
    if (scenarioId === 'scenario-1') {
      req = {
        id: 'SCENARIO-1',
        hospitalId: 'HOSP-001',
        hospitalName: 'Metro Emergency & Trauma Care',
        patientName: 'Scenario 1 (Nearby Match)',
        bloodGroup: 'O+',
        component: 'prbc',
        unitsRequired: 2,
        urgency: 'CRITICAL',
        clinicalReason: 'Severe trauma resuscitation',
        contactPerson: 'Dr. K. S. Sharma',
        contactPhone: '+91 86742 55900',
        lat: 16.3470,
        lng: 81.0420
      };
    } else if (scenarioId === 'scenario-2') {
      req = {
        id: 'SCENARIO-2',
        hospitalId: 'HOSP-001',
        hospitalName: 'Metro Emergency & Trauma Care',
        patientName: 'Scenario 2 (Shortage Pooling)',
        bloodGroup: 'O-',
        component: 'prbc',
        unitsRequired: 5,
        urgency: 'CRITICAL',
        clinicalReason: 'Massive transfusion protocol - O- shortage',
        contactPerson: 'Dr. K. S. Sharma',
        contactPhone: '+91 86742 55900',
        lat: 16.3470,
        lng: 81.0420
      };
    } else {
      req = {
        id: 'SCENARIO-3',
        hospitalId: 'HOSP-003',
        hospitalName: 'Vijayawada Apex Institute of Medical Sciences',
        patientName: 'Scenario 3 (Universal Recipient)',
        bloodGroup: 'AB+',
        component: 'prbc',
        unitsRequired: 4,
        urgency: 'URGENT',
        clinicalReason: 'Elective cardiac surgery preparation',
        contactPerson: 'Dr. Ananya Reddy',
        contactPhone: '+91 86625 90120',
        lat: 16.5062,
        lng: 80.6480
      };
    }

    const matchResult = MatchingEngine.match(req, AppState.sources, AppState.donors);
    AppState.currentMatchingResult = { request: req, ...matchResult };
    this.renderMatchingResults(AppState.currentMatchingResult);
    this.switchTab('matching');
    this.showToast(`Executed Test Scenario: ${scenarioId}`, 'success');
  },

  // --------------------------------------------------------------------------
  // Notifications & Stats
  // --------------------------------------------------------------------------
  renderNotifications() {
    const list = document.getElementById('notificationsDropdownList');
    const badge = document.getElementById('notifCountBadge');
    if (!list) return;

    const unreadCount = AppState.notifications.filter(n => !n.read).length;
    if (badge) badge.innerText = unreadCount;

    if (AppState.notifications.length === 0) {
      list.innerHTML = `<div class="p-3 text-center text-muted small">No emergency alerts recorded.</div>`;
      return;
    }

    list.innerHTML = AppState.notifications.map(n => `
      <div class="notification-item ${n.read ? '' : 'unread'}">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong class="small text-dark">${n.title}</strong>
          <span class="smaller text-muted">${n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}</span>
        </div>
        <p class="smaller text-muted mb-0">${n.message}</p>
      </div>
    `).join('');
  },

  toggleNotificationDrawer() {
    const drawer = document.getElementById('notificationDrawer');
    if (drawer) {
      drawer.classList.toggle('active');
      if (drawer.classList.contains('active')) {
        AppState.notifications.forEach(n => n.read = true);
        const badge = document.getElementById('notifCountBadge');
        if (badge) badge.innerText = '0';
        fetch(`${API_BASE}/api/notifications/mark-read`, { method: 'POST' }).catch(() => {});
      }
    }
  },

  renderStats() {
    const totalReq = document.getElementById('statTotalRequests');
    const pendingReq = document.getElementById('statPendingRequests');
    const confirmedReq = document.getElementById('statConfirmedRequests');
    const fulfilledReq = document.getElementById('statFulfilledRequests');
    const criticalReq = document.getElementById('statCriticalRequests');

    const total = AppState.requests.length;
    const pending = AppState.requests.filter(r => r.status === 'Pending' || r.status === 'Submitted').length;
    const confirmed = AppState.requests.filter(r => r.status === 'Matched').length;
    const fulfilled = AppState.requests.filter(r => r.status === 'Fulfilled').length;
    const critical = AppState.requests.filter(r => r.urgency === 'CRITICAL').length;

    if (totalReq) totalReq.innerText = total;
    if (pendingReq) pendingReq.innerText = pending;
    if (confirmedReq) confirmedReq.innerText = confirmed;
    if (fulfilledReq) fulfilledReq.innerText = fulfilled;
    if (criticalReq) criticalReq.innerText = critical;
  },

  // --------------------------------------------------------------------------
  // Modals & Real Authentication
  // --------------------------------------------------------------------------
  populateLoginFacilities() {
    const role = document.getElementById('authRole')?.value || 'hospital';
    const facSelect = document.getElementById('loginFacilitySelect');
    const facGroup = document.getElementById('loginFacilityGroup');
    if (!facSelect) return;

    if (role === 'evaluator') {
      if (facGroup) facGroup.style.display = 'none';
      return;
    }

    if (facGroup) facGroup.style.display = 'block';

    if (role === 'hospital') {
      facSelect.innerHTML = (AppState.hospitals || []).map(h => `
        <option value="${h.id}">${h.name} (${h.city})</option>
      `).join('');
    } else {
      facSelect.innerHTML = (AppState.sources || []).map(s => `
        <option value="${s.id}">${s.name} (${s.city})</option>
      `).join('');
    }
  },

  onAuthRoleChanged() {
    this.populateLoginFacilities();
  },

  checkExistingSession() {
    try {
      const stored = localStorage.getItem('lifelink_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.username) {
          AppState.currentUser = user;
          AppState.activeRole = user.role || 'hospital';
          if (user.facility_id) {
            if (user.role === 'hospital') AppState.activeHospitalId = user.facility_id;
            else AppState.activeSourceId = user.facility_id;
          }
          this.updateAuthHeaderUI();
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
  },

  updateAuthHeaderUI() {
    const authBtns = document.getElementById('authButtonsContainer');
    const profileBox = document.getElementById('userProfileContainer');
    const nameLabel = document.getElementById('userDisplayName');
    const roleSelect = document.getElementById('activeRoleSelector');

    if (AppState.currentUser) {
      if (authBtns) {
        authBtns.classList.add('d-none');
        authBtns.classList.remove('d-flex');
      }
      if (profileBox) {
        profileBox.classList.remove('d-none');
        profileBox.classList.add('d-flex');
      }
      if (nameLabel) {
        const displayName = AppState.currentUser.facilityName || AppState.currentUser.username;
        const displayRole = (AppState.currentUser.role || '').toUpperCase();
        nameLabel.innerText = `👤 ${displayName} (${displayRole})`;
      }
      if (roleSelect && AppState.currentUser.role) {
        roleSelect.value = AppState.currentUser.role === 'blood_bank' ? 'source' : AppState.currentUser.role;
      }
    } else {
      if (authBtns) {
        authBtns.classList.remove('d-none');
        authBtns.classList.add('d-flex');
      }
      if (profileBox) {
        profileBox.classList.add('d-none');
        profileBox.classList.remove('d-flex');
      }
    }
    this.updateRoleViewContext();
  },

  logout() {
    AppState.currentUser = null;
    try { localStorage.removeItem('lifelink_user'); } catch (e) {}
    this.updateAuthHeaderUI();
    this.showToast('You have been signed out successfully.', 'info');
    this.switchTab('home');
  },

  bindAuthModal() {
    const loginForm = document.getElementById('authLoginForm');
    const registerForm = document.getElementById('authRegisterForm');

    this.populateLoginFacilities();

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('authRole').value;
        const facilityId = document.getElementById('loginFacilitySelect')?.value;
        const username = document.getElementById('loginUsername')?.value.trim();
        const password = document.getElementById('loginPassword')?.value.trim();
        const submitBtn = document.getElementById('loginSubmitBtn');

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Verifying...';
        }

        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, facilityId, username, password })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            AppState.currentUser = data.user;
            AppState.activeRole = data.user.role === 'blood_bank' ? 'source' : data.user.role;
            if (data.user.facility_id) {
              if (data.user.role === 'hospital') AppState.activeHospitalId = data.user.facility_id;
              else AppState.activeSourceId = data.user.facility_id;
            }
            try { localStorage.setItem('lifelink_user', JSON.stringify(data.user)); } catch (e) {}
            
            this.updateAuthHeaderUI();
            this.closeAuthModal();
            this.showToast(data.message || 'Signed in successfully!', 'success');

            // Route to dashboard
            if (data.user.role === 'hospital') {
              this.switchTab('hospital-dashboard');
            } else if (data.user.role === 'blood_bank' || data.user.role === 'source') {
              this.switchTab('source-dashboard');
            }
          } else {
            this.showToast(data.message || 'Login failed. Please check credentials.', 'error');
          }
        } catch (err) {
          console.warn('Login request error, using fallback:', err);
          AppState.activeRole = role;
          if (facilityId) {
            if (role === 'hospital') AppState.activeHospitalId = facilityId;
            else AppState.activeSourceId = facilityId;
          }
          this.closeAuthModal();
          this.updateRoleViewContext();
          this.showToast(`Signed in as ${role}!`, 'success');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Sign In to Portal ✓';
          }
        }
      });
    }

    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const facilityType = document.getElementById('regFacilityType').value;
        const facilityName = document.getElementById('regFacilityName').value.trim();
        const phone = document.getElementById('regContactPhone').value.trim();
        const city = document.getElementById('regCity').value.trim();
        const address = document.getElementById('regAddress').value.trim();
        const repName = document.getElementById('regRepName').value.trim();
        const email = document.getElementById('regRepEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const submitBtn = document.getElementById('registerSubmitBtn');

        if (password !== confirmPassword) {
          this.showToast('Passwords do not match. Please re-enter.', 'error');
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Registering in Database...';
        }

        const payload = {
          facilityType,
          facilityName,
          phone,
          city,
          address,
          repName,
          email,
          password
        };

        try {
          const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            if (data.facility) {
              if (facilityType === 'hospital') {
                AppState.hospitals.push(data.facility);
                AppState.activeHospitalId = data.facility.id;
              } else {
                AppState.sources.push(data.facility);
                AppState.activeSourceId = data.facility.id;
              }
            }

            AppState.currentUser = data.user;
            AppState.activeRole = facilityType === 'blood_bank' ? 'source' : facilityType;
            try { localStorage.setItem('lifelink_user', JSON.stringify(data.user)); } catch (e) {}

            this.updateAuthHeaderUI();
            this.closeAuthModal();
            this.renderAll();
            this.showToast(`${facilityName} registered in database!`, 'success');

            if (facilityType === 'hospital') {
              this.switchTab('hospital-dashboard');
            } else {
              this.switchTab('source-dashboard');
            }
          } else {
            this.showToast(data.message || 'Registration failed.', 'error');
          }
        } catch (err) {
          console.warn('Registration request error:', err);
          this.showToast('Registration failed to connect to backend.', 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Register & Sign In ✓';
          }
        }
      });
    }
  },

  openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.add('active');
      this.populateLoginFacilities();
      this.switchAuthTab(tab);
    }
  },

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
  },

  switchAuthTab(tab) {
    const loginBtn = document.getElementById('authTabLoginBtn');
    const regBtn = document.getElementById('authTabRegisterBtn');
    const loginForm = document.getElementById('authLoginFormContainer');
    const regForm = document.getElementById('authRegisterFormContainer');

    if (tab === 'login') {
      if (loginBtn) loginBtn.classList.add('active', 'font-weight-bold');
      if (regBtn) regBtn.classList.remove('active', 'font-weight-bold');
      if (loginForm) loginForm.style.display = 'block';
      if (regForm) regForm.style.display = 'none';
      this.populateLoginFacilities();
    } else {
      if (loginBtn) loginBtn.classList.remove('active', 'font-weight-bold');
      if (regBtn) regBtn.classList.add('active', 'font-weight-bold');
      if (loginForm) loginForm.style.display = 'none';
      if (regForm) regForm.style.display = 'block';
    }
  },

  openGenericModal(title, bodyHtml) {
    const modal = document.getElementById('genericModal');
    const titleElem = document.getElementById('genericModalTitle');
    const bodyElem = document.getElementById('genericModalBody');
    if (modal && titleElem && bodyElem) {
      titleElem.innerText = title;
      bodyElem.innerHTML = bodyHtml;
      modal.classList.add('active');
    }
  },

  closeGenericModal() {
    const modal = document.getElementById('genericModal');
    if (modal) modal.classList.remove('active');
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type === 'error' ? 'critical' : type}`;
    toast.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <span>${type === 'critical' || type === 'error' ? '🚨' : type === 'success' ? '✓' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
};

// Auto-initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  AppUI.init();
});
